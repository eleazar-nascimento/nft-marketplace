# Arquitetura e Decisões Técnicas (`ARCHITECTURE.md`)

## 1. Visão Geral e Divisão de Responsabilidades

A aplicação foi estruturada em camadas desacopladas para garantir que componentes visuais, hooks de estado e o cliente HTTP não contenham lógica de simulação ou desvios de negócio:

```
src/
├── contracts/     # Contratos tipados e schemas Zod compartilhados (REST + Socket.IO)
├── lib/           # Aritmética decimal em ETH (BigInt em wei), persistência local e utilitários
├── api/           # Instância Axios pura, interceptors de sessão e chamadas REST tipadas
├── state/         # Query keys isoladas, hooks TanStack Query, contexto de sessão e engine Socket.IO
├── components/    # Primitivas shadcn/ui adaptadas, layout responsivo, barra de cenários e cards
├── pages/         # As 9 telas funcionais do desafio + página dedicada /favorites + página 404
└── mocks/         # Camada de rede isolada (MSW + @mswjs/socket.io-binding, fixtures, store e cenários)
```

## 2. Contratos REST (`/api/*`)

Todas as chamadas passam pela instância `httpClient` (`Axios`) em `src/api/client.ts`. Erros seguem o envelope padronizado:

```json
{
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHENTICATED | SESSION_EXPIRED | FORBIDDEN | NOT_FOUND | CONFLICT | EMAIL_TAKEN | USERNAME_TAKEN | INVALID_CREDENTIALS | EDITION_UNAVAILABLE | QUANTITY_LIMIT | QUOTE_STALE | QUOTE_EXPIRED | COUPON_INVALID | COUPON_EXPIRED | IDEMPOTENCY_CONFLICT | WALLET_REJECTED | WALLET_NOT_CONNECTED | TRANSIENT | TIMEOUT",
    "message": "Mensagem legível para o usuário",
    "fieldErrors": { "campo": "Mensagem específica do campo" },
    "details": {}
  }
}
```

### Recursos e Operações

| Recurso | Método e Rota | Descrição |
| --- | --- | --- |
| **Sessão e Conta** | `POST /api/auth/register` | Cria conta (hash `PBKDF2-SHA256`), mescla carrinho visitante (`X-Guest-Cart-Id`) e inicia sessão |
| | `POST /api/auth/login` | Autentica credenciais, mescla carrinho visitante e retorna token + `expiresAt` |
| | `GET /api/auth/session` | Valida sessão atual via `Authorization: Bearer <token>` |
| | `POST /api/auth/logout` | Revoga a sessão ativa (`204 No Content`) |
| | `POST /api/auth/expire` | Expira imediatamente a sessão do usuário atual (suporte a testes e demonstração) |
| **NFTs** | `GET /api/nfts/featured` | Lista os NFTs em destaque da coleção |
| | `GET /api/nfts` | Lista paginada com `q`, `category` (combinável), `network`, `minPrice`, `maxPrice`, `availability`, `sort`, `page`, `pageSize` |
| | `GET /api/nfts/:nftId` | Detalhe completo do NFT (galeria, edições, limites por pedido, versão) ou `404 NOT_FOUND` |
| **Favoritos** | `GET /api/favorites` | Lista IDs dos NFTs favoritados pelo usuário autenticado |
| | `POST /api/favorites` | Inclui um NFT nos favoritos e incrementa curtidas |
| | `DELETE /api/favorites/:nftId` | Remove um NFT dos favoritos e decrementa curtidas |
| **Carrinho** | `GET /api/cart` | Consulta o carrinho do usuário autenticado ou visitante (`X-Guest-Cart-Id`) |
| | `POST /api/cart/items` | Adiciona item respeitando disponibilidade e `maxPerOrder` da edição |
| | `PATCH /api/cart/items/:lineId` | Atualiza quantidade inteira de um item |
| | `DELETE /api/cart/items/:lineId` | Remove item do carrinho |
| | `POST /api/cart/coupon` | Valida e aplica cupom (`422 COUPON_INVALID` ou `COUPON_EXPIRED` em falha) |
| | `DELETE /api/cart/coupon` | Remove o cupom ativo |
| | `POST /api/cart/acknowledge` | Confirma alterações de preço/disponibilidade no carrinho e sincroniza limites |
| **Cotação** | `POST /api/quotes` | Calcula subtotal, desconto, taxa de rede (`ethereum`, `polygon`, `base`), total em ETH, `fingerprint` criptográfico e lista de divergências (`issues`) |
| **Pedidos** | `POST /api/orders` | Cria pedido idempotente via header `Idempotency-Key`, revalidando carteira conectada e `quoteFingerprint` (`409 QUOTE_STALE` se desatualizado) |
| | `GET /api/orders` | Lista os pedidos do usuário autenticado |
| | `GET /api/orders/:orderId` | Consulta estado (`pending`, `confirmed`, `declined`) e recibo imutável (`403 FORBIDDEN` para outro usuário) |
| **Perfil** | `GET /api/profile` | Consulta dados do perfil do colecionador |
| | `PUT /api/profile` | Atualiza nome, username, e-mail, bio e website (`409` em conflito de e-mail/username) |
| | `PUT /api/profile/avatar` | Atualiza avatar validando formato (`PNG`, `JPEG`, `WEBP`) e limite de `1 MB` |
| | `PUT /api/profile/password` | Altera senha validando a senha atual |
| **Carteiras** | `GET /api/wallets` | Lista carteiras principal/secundária do usuário e estado da conexão ativa |
| | `POST /api/wallets` | Cadastra carteira principal ou secundária (`409 CONFLICT` em endereço duplicado) |
| | `PUT /api/wallets/:walletId` | Atualiza carteira existente |
| | `POST /api/wallets/:walletId/connect` | Simula conexão na rede selecionada (`409 WALLET_REJECTED` quando recusada) |
| | `POST /api/wallets/disconnect` | Desconecta a carteira ativa |

## 3. Precisão Decimal em ETH e Estado do Carrinho

Valores em ETH trafegam exclusivamente como strings decimais (`EthAmount`) e são processados em `src/lib/eth.ts` convertendo cada valor para `wei` (`BigInt` com escala $10^{18}$). Isso evita erros de ponto flutuante IEEE 754 em somas, multiplicações por quantidade inteira, cálculo percentual de cupons e comparações de preço.

- **Carrinho Visitante vs. Autenticado**: Visitantes recebem um identificador persistente (`nftm:guestCartId`) enviado no header `X-Guest-Cart-Id`. No `login` ou `register`, o handler MSW executa `mergeGuestCart`, transferindo e somando os itens do visitante ao carrinho do usuário autenticado respeitando o limite de cada edição.
- **Remoção Seletiva Pós-Compra**: Quando um pedido é confirmado, apenas os itens e quantidades efetivamente comprados no snapshot do pedido são deduzidos do carrinho e do estoque da edição. Em caso de falha ou recusa (`declined`), o carrinho permanece intacto.

## 4. Política de Sessão, Cache e Atualização Otimista

- **Isolamento por Usuário e Parâmetros**: Todas as query keys privadas em `src/state/queryKeys.ts` incluem o `userId` (`['private', userId, ...]`), e carrinhos/cotações são isolados por `scope` (`userId` ou `'guest'`).
- **Expiração e Retomada**: Quando uma requisição autenticada recebe `401 SESSION_EXPIRED` ou o TTL da sessão se esgota, `SessionProvider` limpa as queries privadas do `QueryClient`, preserva o rascunho do checkout (`sessionStorage` por usuário) e salva a URL atual em `nftm:returnTo`. Após novo login, o usuário retorna automaticamente à rota e recupera os dados preenchidos.
- **Cancelamento de Consultas Obsoletas**: Todos os `queryFn` repassam o `AbortSignal` do TanStack Query ao Axios, descartando respostas lentas fora de ordem quando filtros ou buscas mudam rapidamente.
- **Atualização Otimista com Rollback**: O hook `useToggleFavorite` aplica atualização otimista imediata na lista de favoritos, no contador de curtidas do detalhe e nos cards paginados do catálogo. Caso o servidor retorne erro (como no cenário `favorite-failure`), o callback `onError` restaura integralmente os snapshots anteriores e emite alerta acessível.

## 5. Tempo Real com Socket.IO e `@mswjs/socket.io-binding`

### Contratos de Eventos

Todos os eventos seguem o envelope `RealtimeEnvelope<TType, TResource, TData>`:

```json
{
  "id": "evt_...",
  "type": "nft.updated | order.updated",
  "resource": { "type": "nft | order", "id": "nft_001" },
  "version": 2,
  "occurredAt": "2026-11-17T12:00:00.000Z",
  "data": {}
}
```

- `nft.updated`: Atualiza `priceFromEth`, `available` e o estado das edições no detalhe, nas listagens em cache e no carrinho. Se o NFT estiver no carrinho ativo, emite alerta visual e acessível e invalida a cotação para exigir nova confirmação no checkout.
- `order.updated`: Emitido apenas para conexões autenticadas pertencentes ao `userId` dono do pedido. Atualiza o estado do pedido (`pending` → `confirmed` ou `declined`).

### Controle de Versão, Duplicatas e Reconciliação

`RealtimeProvider` (`src/state/realtime.tsx`) mantém dois estruturas em memória por sessão:
1. `seenEventsRef` (`Set<string>`): descarta imediatamente eventos com `id` já processado.
2. `versionsRef` (`Map<string, number>`): alimentado tanto pelas respostas REST (`recordResourceVersion`) quanto pelos eventos Socket.IO. Qualquer evento com `version <= knownVersion` é descartado sem regredir o estado da interface.

Ao reconectar após queda de conexão, o cliente reenvia `session.identify` com o token atual e invalida as queries ativas (`nfts`, `cart`, `quote`, `orders`, `favorites`) para reconciliar o estado com a API REST.

### Transporte e Limitações do `@mswjs/socket.io-binding` no Ambiente de Mocks

- O pacote `engine.io-client` captura a referência global `const WebSocketCtor = globalThis.WebSocket` no momento em que seu módulo é avaliado. Para garantir que o `socket.io-client` utilize o `WebSocket` interceptado pelo MSW, `src/main.tsx` inicia `await startMockRuntime()` antes de importar dinamicamente `src/App.tsx`.
- Internamente, o `WebSocketHandler` do MSW remove o prefixo `/socket.io/` do `pathname` antes de comparar a URL do handler. Por isso, o link WebSocket em `src/mocks/ws.ts` utiliza `ws.link(/^wss?:\/\//)` para interceptar o handshake WebSocket do Socket.IO v4.
- Como o `@mswjs/socket.io-binding` opera em memória na aba ativa, o escopo de salas/autenticação por conexão (`session.identify`) é gerenciado explicitamente no mapa `clients` em `src/mocks/ws.ts`.

## 6. Decisões de UX, Acessibilidade, Assets e Desvios do Figma

- **Identidade Visual KURIO e Contraste (WCAG AA)**: O design system em `src/styles/globals.css` reproduz fielmente os tokens do Figma (`#140D0A` ink background, `#241612` surface card, `#2F1D15` surface raised, `#38220F` surface dark, `#F5F1EB` foreground, `#CFB28C` secondary text, `#B39463` muted text, `#D28A4C` primary button com texto `#140D0A`, `#E89B55` accent text e `#3F2319` border), mantendo razão de contraste acessível e pontuação **100 em Acessibilidade no Lighthouse**.
- **Tipografia e Assets Locais Otimizados**: A família `Roboto Mono` (`400`, `500`, `700`) é empacotada localmente via `@fontsource/roboto-mono` em `src/main.tsx`. As obras do Figma (`public/images/figma/*.jpg`, convertidas e redimensionadas para `600px` com ~70–80 KB) e SVGs (`thank-you.svg`, ícones sociais) são servidos localmente com dimensões explícitas (`width`/`height`) e `fetchPriority="high"` nas imagens principais para preservar o LCP e evitar CLS.
- **Desvios Funcionais Pontuais em Relação ao Figma**:
  - Inclusão da barra `ScenarioToolbar` no header desktop (`scenario-toolbar-trigger`) e no drawer da home mobile (`mobile-scenario-toolbar-trigger`) para alternância e reset determinístico dos cenários de avaliação (`default`, `fast`, `slow`, `server-error`, `empty`, `payment-decline`, `session-expired`, etc.) sem interferir no fluxo normal do usuário.
  - Adição de seletor de rede no carrinho (para cálculo dinâmico de taxa na cotação), botão dedicado `Carrinho` ao lado de `COMPRAR` no detalhe do NFT (permitindo adicionar sem redirecionar), checkbox explícito de revisão no checkout, botões de preenchimento rápido das contas fictícias (`Ana Souza` e `Bruno Lima`) na tela de login e toggle `Igual à carteira principal` + preenchimento rápido em `/wallets`.
  - Fluxo mobile alinhado aos protótipos: barra de navegação inferior fixa com recorte, gradiente `#D28A4C66` → `#D28A4C` no botão central e contador condicional no carrinho; botão de favoritar direto no topo dos cards em telas menores; rota autenticada dedicada `/favorites` (`FavoritesPage`); e cadastro com 4 campos (`Nome de usuário`, `E-mail`, `Senha`, `Confirmar senha`) usando `username` como fallback inicial de exibição.
- **Movimento Reduzido**: O efeito shimmer dos skeletons (`.skeleton-shimmer`) e as transições respeitam `@media (prefers-reduced-motion: reduce)`.
