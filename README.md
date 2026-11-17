# NFT Marketplace — Desafio Frontend

Aplicação completa de **Marketplace de NFTs** implementada em **React 19**, **TypeScript**, **TanStack Router**, **TanStack Query**, **Axios**, **Socket.IO**, **Tailwind CSS**, **shadcn/ui**, **MSW** (`@mswjs/socket.io-binding`), **Playwright** e **Lighthouse**.

## 1. Requisitos e Setup

- **Node.js**: `>= 20` (testado em `v22.19.0`)
- **Gerenciador de pacotes**: `pnpm` (`10.17.1`)

```bash
pnpm install
cp .env.example .env
pnpm dev
```

A camada de mocks (**MSW** + **Socket.IO**) é ativada por padrão (`VITE_ENABLE_MOCKS=true`) tanto em desenvolvimento quanto no build de demonstração/produção.

## 2. Variáveis de Ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` | Ativa o Service Worker do MSW e o interceptador WebSocket/Socket.IO no navegador |

## 3. Comandos Disponíveis

| Comando | Descrição |
| --- | --- |
| `pnpm dev` | Inicia o servidor de desenvolvimento Vite com MSW + Socket.IO ativos |
| `pnpm build` | Executa verificação de tipos (`tsc -b`) e gera o build otimizado em `dist/` |
| `pnpm preview` | Serve o build otimizado na porta `4173` |
| `pnpm typecheck` | Verifica a tipagem estática do projeto (`tsc -b --noEmit`) |
| `pnpm lint` | Executa o ESLint em todo o código-fonte e suíte E2E |
| `pnpm format` | Formata os arquivos com Prettier e `prettier-plugin-tailwindcss` |
| `pnpm test:e2e` | Executa os 12 cenários E2E + regressão visual (desktop e mobile) no Playwright |
| `pnpm test:e2e:update` | Atualiza os snapshots de regressão visual do Playwright |
| `pnpm audit:lighthouse` | Executa 3 rodadas por página e perfil no Lighthouse e gera relatórios HTML/JSON |

## 4. Credenciais Fictícias e Cupons

As senhas nunca são armazenadas em texto puro (são derivadas com `PBKDF2-SHA256` + salt no seed do banco simulado).

| Usuário | E-mail | Senha | Características iniciais |
| --- | --- | --- | --- |
| **Ana Souza** | `ana@nft.dev` | `Senha@123` | Carteira principal (`MetaMask` — Ethereum e Base), favoritos `nft_001` e `nft_004` |
| **Bruno Lima** | `bruno@nft.dev` | `Senha@123` | Sem carteira inicial, favorito `nft_002` (permite validar isolamento entre contas) |

### Cupons de Desconto

| Código | Comportamento |
| --- | --- |
| `NFT10` | Válido — aplica `10%` de desconto sobre o subtotal |
| `WELCOME15` | Válido — aplica `15%` de desconto sobre o subtotal |
| `EXPIRED20` | Expirado — retorna erro `422 COUPON_EXPIRED` |
| Qualquer outro | Inválido — retorna erro `422 COUPON_INVALID` |

## 5. Seleção e Reset de Cenários (MSW + Socket.IO)

No cabeçalho da aplicação, clique no botão **Cenário** (`data-testid="scenario-toolbar-trigger"`) para abrir o **Painel de Simulação (MSW + Socket.IO)**, ou passe `?__scenario=<preset>` na URL.

### Presets Disponíveis

| Preset | Comportamento |
| --- | --- |
| `default` | Latência realista (`120–400 ms`) e operações com sucesso |
| `fast` | Sem latência artificial (utilizado na suíte automatizada) |
| `slow` | Respostas com `2,2 s` de atraso para evidenciar os skeletons com shimmer |
| `variable-latency` | Latência pseudoaleatória determinística entre `150 ms` e `2,0 s` |
| `out-of-order` | A primeira busca do catálogo demora `1,8 s` e a segunda `250 ms` |
| `empty-catalog` | O catálogo responde vazio (`0` itens) |
| `offline` | Simula falha de rede em todas as requisições REST |
| `server-error` | As duas primeiras listagens do catálogo respondem `503 Service Unavailable` |
| `session-expiring` | Sessões expiram `45 s` após o login |
| `favorite-failure` | A próxima inclusão ou remoção de favorito falha com `500` (testa rollback otimista) |
| `wallet-rejected` | A conexão da carteira é recusada (`409 WALLET_REJECTED`) |
| `price-change-checkout` | O preço do 1º item do carrinho sobe `+25%` após gerar a cotação |
| `sold-out-checkout` | A edição do 1º item do carrinho esgota após gerar a cotação |
| `order-timeout` | O 1º envio de pedido cria o registro mas responde `504 TIMEOUT`, permitindo recuperação por idempotência |
| `payment-declined` | O pedido entra em processamento e é recusado (`declined`), preservando os itens no carrinho |

Para restaurar integralmente o estado inicial (catálogo, usuários, carrinhos, carteiras, pedidos e conexões Socket.IO), clique em **Resetar estado completo** no painel de simulação ou envie `POST /api/__sim/reset`.

## 6. Como Reproduzir os Fluxos de Falha

1. **Falha otimista nos favoritos (com rollback)**:
   - Autentique-se com `ana@nft.dev`, abra o painel de simulação e selecione `favorite-failure`.
   - Clique no botão de curtir de qualquer NFT: a contagem sobe otimisticamente e, após a resposta `500`, reverte para o valor anterior exibindo alerta acessível. Clique novamente para confirmar a recuperação.
2. **Mudança de preço ou esgotamento em tempo real durante o checkout**:
   - Adicione um NFT ao carrinho e avance até `/checkout`.
   - Abra o painel de simulação e clique em **Subir preço (+25%)** ou **Esgotar edição**.
   - O evento `nft.updated` chega via Socket.IO, exibe o alerta em tempo real, atualiza o resumo e bloqueia o botão de envio até que o usuário clique em **Confirmar novos valores**.
3. **Timeout após criação do pedido e recuperação por idempotência**:
   - Em `/checkout`, ative o cenário `order-timeout`, conecte a carteira, marque a revisão e envie o pedido.
   - A primeira tentativa retorna `504 TIMEOUT`, mantendo a mesma chave de idempotência (`Idempotency-Key`).
   - Clique em **Tentar novamente com segurança**: o servidor reconhece a chave, recupera o mesmo pedido sem duplicar a compra e conclui a liquidação.
4. **Pagamento recusado preservando o carrinho**:
   - Ative o cenário `payment-declined` e envie o pedido em `/checkout`.
   - O pedido passa por `pending` e transita para `declined` via evento `order.updated`, mantendo os itens intactos no carrinho.
5. **Expiração de sessão com retomada de contexto**:
   - Acesse `/profile` ou `/checkout`, abra o painel de simulação e clique em **Expirar sessão atual**.
   - A aplicação limpa o cache privado, exibe o banner de sessão expirada e redireciona para `/login`. Ao autenticar novamente, o fluxo anterior e os rascunhos do checkout são restaurados.

## 7. Auditoria Lighthouse (Mediana de 3 Execuções)

Ambiente: macOS (`arm64`), Node `v22.19.0`, Lighthouse `13.6.0`, Chromium Headless, build de produção (`pnpm build && pnpm preview`) com o cenário `default` dos mocks ativo. Os relatórios completos HTML/JSON e o arquivo `summary.json` estão versionados em `lighthouse/reports/`.

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início (`/`) | Mobile | **94** | **100** | **100** | **100** | 2.814 ms | 0 | 144 ms |
| Início (`/`) | Desktop | **100** | **100** | **100** | **100** | 737 ms | 0,0002 | 0 ms |
| Detalhe (`/nft/nft_001`) | Mobile | **95** | **100** | **100** | **100** | 2.804 ms | 0,0045 | 122 ms |
| Detalhe (`/nft/nft_001`) | Desktop | **91** | **100** | **100** | **100** | 710 ms | 0,1908 | 0 ms |
| **Meta do Desafio** | — | **≥ 90** | **≥ 95** | **≥ 95** | **≥ 90** | — | — | — |
