import { expect, test } from '@playwright/test'
import { loginAsAna, resetSimulation, updateScenario } from './helpers'

test.describe('Tempo Real (Socket.IO), Acessibilidade e Resiliência', () => {
  test('9. alteração de preço/disponibilidade via Socket.IO durante o checkout bloqueia confirmação até nova revisão', async ({
    page,
  }) => {
    await resetSimulation(page, 'fast')
    await updateScenario(page, { paymentDelayMs: 300 })
    await loginAsAna(page)

    await page.goto('/nft/nft_001')
    await page.getByTestId('detail-buy-now').click()
    await page.getByTestId('proceed-to-checkout-btn').click()

    await page.getByTestId('checkout-connect-wallet-btn').click()
    await page.getByTestId('checkout-review-checkbox').check()

    const initialTotal = await page.getByTestId('checkout-total').textContent()

    await page.evaluate(async () => {
      await fetch('/api/__sim/nft-mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nftId: 'nft_001', priceDeltaPercent: 25 }),
      })
    })

    await expect(page.getByTestId('checkout-stale-quote-banner')).toBeVisible()
    await expect(page.getByTestId('checkout-submit-btn')).toBeDisabled()

    await page.getByTestId('checkout-acknowledge-quote-btn').click()
    await expect(page.getByTestId('checkout-stale-quote-banner')).toHaveCount(0)

    const updatedTotal = await page.getByTestId('checkout-total').textContent()
    expect(updatedTotal).not.toBe(initialTotal)

    await page.getByTestId('checkout-submit-btn').click()
    await expect(page).toHaveURL(/\/orders\/ord_[a-f0-9]+\/confirmation/)
  })

  test('10. eventos duplicados ou antigos são descartados e desconexão com pedido pendente reconcilia ao reconectar', async ({
    page,
  }) => {
    await resetSimulation(page, 'fast')
    await updateScenario(page, { paymentDelayMs: 2500 })
    await loginAsAna(page)

    await page.goto('/nft/nft_001')
    const priceBefore = await page.getByTestId('edition-price-nft_001_ed1').textContent()

    await page.evaluate(async () => {
      await fetch('/api/__sim/socket-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'nft.updated',
          nftId: 'nft_001',
          version: 99,
          eventId: 'evt_dup_test_1',
        }),
      })
      await fetch('/api/__sim/socket-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'nft.updated',
          nftId: 'nft_001',
          version: 99,
          eventId: 'evt_dup_test_1',
        }),
      })
      await fetch('/api/__sim/socket-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'nft.updated',
          nftId: 'nft_001',
          version: 2,
          eventId: 'evt_stale_test_2',
        }),
      })
    })

    await expect(page.getByTestId('edition-price-nft_001_ed1')).toHaveText(priceBefore ?? '')

    await page.getByTestId('scenario-toolbar-trigger').click()
    await expect(page.getByTestId('socket-duplicate-count')).toContainText('Duplicados ignorados: 1')
    await expect(page.getByTestId('socket-stale-count')).toContainText('Antigos ignorados: 1')
    await page.keyboard.press('Escape')

    await page.getByTestId('detail-buy-now').click()
    await page.getByTestId('proceed-to-checkout-btn').click()
    await page.getByTestId('checkout-connect-wallet-btn').click()
    await page.getByTestId('checkout-review-checkbox').check()
    await page.getByTestId('checkout-submit-btn').click()

    await expect(page.getByTestId('order-pending-card')).toBeVisible()

    await page.evaluate(async () => {
      await fetch('/api/__sim/socket-disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockReconnect: true }),
      })
    })

    await page.reload()
    await expect(page.getByTestId('order-pending-card')).toBeVisible()

    await page.evaluate(async () => {
      await fetch('/api/__sim/socket-allow', { method: 'POST' })
    })

    await expect(page).toHaveURL(/\/orders\/ord_[a-f0-9]+\/confirmation/, { timeout: 15_000 })
    await expect(page.getByTestId('order-confirmation-receipt')).toBeVisible()
  })

  test('11. navegação por teclado, controle de foco em diálogos e semântica de validação', async ({
    page,
  }) => {
    await resetSimulation(page, 'fast')

    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo principal' })
    await expect(skipLink).toBeFocused()

    await page.getByTestId('footer-support-btn').click()
    await expect(page.getByTestId('out-of-scope-dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('out-of-scope-dialog')).toHaveCount(0)

    await page.goto('/login')
    await page.getByTestId('login-submit').click()
    await expect(page.getByTestId('login-email')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByTestId('login-password')).toHaveAttribute('aria-invalid', 'true')
  })

  test('12. skeletons durante carregamento lento, falha de servidor e recuperação após nova tentativa', async ({
    page,
  }) => {
    await resetSimulation(page, 'slow')
    await page.goto('/')
    await expect(page.getByTestId('catalog-skeleton-grid')).toBeVisible()
    await expect(page.getByTestId('catalog-grid')).toBeVisible({ timeout: 10_000 })

    await resetSimulation(page, 'server-error')
    await expect(page.getByTestId('catalog-error-state')).toBeVisible()
    await page.getByTestId('catalog-retry-btn').click()
    await expect(page.getByTestId('catalog-grid')).toBeVisible()
  })
})
