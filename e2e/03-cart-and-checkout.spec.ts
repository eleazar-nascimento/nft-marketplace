import { expect, test } from '@playwright/test'
import { loginAsAna, resetSimulation, updateScenario } from './helpers'

test.describe('Carrinho, Pagamento e Confirmação', () => {
  test('5. carrinho visitante, edição de quantidades, cupom inválido/expirado/válido e preservação após login', async ({
    page,
  }) => {
    await resetSimulation(page, 'fast')

    await page.goto('/nft/nft_001')
    await page.getByTestId('detail-add-to-cart').click()
    await expect(page.getByTestId('nav-cart-count')).toHaveText('1')

    await page.goto('/cart')
    await expect(page.getByTestId('cart-line-nft_001')).toBeVisible()

    await page.getByTestId('cart-qty-increase-nft_001').click()
    await expect(page.getByTestId('cart-qty-value-nft_001')).toHaveText('2')

    await page.reload()
    await expect(page.getByTestId('cart-qty-value-nft_001')).toHaveText('2')

    await page.getByTestId('cart-coupon-input').fill('INVALIDO99')
    await page.getByTestId('apply-coupon-btn').click()
    await expect(page.getByTestId('cart-coupon-error')).toContainText('Cupom inválido')

    await page.getByTestId('cart-coupon-input').fill('EXPIRED20')
    await page.getByTestId('apply-coupon-btn').click()
    await expect(page.getByTestId('cart-coupon-error')).toContainText('expirou')

    await page.getByTestId('cart-coupon-input').fill('NFT10')
    await page.getByTestId('apply-coupon-btn').click()
    await expect(page.getByTestId('active-coupon-pill')).toContainText('NFT10')

    await page.getByTestId('proceed-to-checkout-btn').click()
    await expect(page).toHaveURL(/\/login/)

    await page.getByTestId('fill-ana-btn').click()
    await page.getByTestId('login-submit').click()
    await expect(page).toHaveURL(/\/checkout/)
    await expect(page.getByTestId('checkout-line-nft_001')).toBeVisible()
  })

  test('6. compra completa do catálogo ao recibo confirmado e snapshot imutável @responsive', async ({
    page,
  }) => {
    await resetSimulation(page, 'fast')
    await updateScenario(page, { paymentDelayMs: 300 })
    await loginAsAna(page)

    await page.goto('/nft/nft_001')
    await page.getByTestId('detail-buy-now').click()
    await expect(page).toHaveURL(/\/cart/)

    await page.getByTestId('proceed-to-checkout-btn').click()
    await expect(page).toHaveURL(/\/checkout/)

    await page.getByTestId('checkout-connect-wallet-btn').click()
    await expect(page.getByTestId('wallet-connection-status')).toContainText('Carteira conectada')

    await page.getByTestId('checkout-review-checkbox').check()
    await page.getByTestId('checkout-submit-btn').click()

    await expect(page).toHaveURL(/\/orders\/ord_[a-f0-9]+\/confirmation/)
    await expect(page.getByTestId('order-confirmation-receipt')).toBeVisible()

    const totalBeforeMutation = await page.getByTestId('receipt-total').textContent()

    await page.evaluate(async () => {
      await fetch('/api/__sim/nft-mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nftId: 'nft_001', priceDeltaPercent: 50 }),
      })
    })
    await page.reload()
    await expect(page.getByTestId('receipt-total')).toHaveText(totalBeforeMutation ?? '')
    await expect(page.getByTestId('nav-cart-count').or(page.getByTestId('mobile-cart-count')).first()).toHaveText('0')
  })

  test('7. falha de pagamento preservando carrinho e timeout com recuperação idempotente do mesmo pedido', async ({
    page,
  }) => {
    await resetSimulation(page, 'fast')
    await updateScenario(page, {
      paymentOutcome: 'decline',
      paymentDelayMs: 250,
    })
    await loginAsAna(page)

    await page.goto('/nft/nft_004')
    await page.getByTestId('detail-buy-now').click()
    await page.getByTestId('proceed-to-checkout-btn').click()

    await page.getByTestId('checkout-connect-wallet-btn').click()
    await page.getByTestId('checkout-review-checkbox').check()
    await page.getByTestId('checkout-submit-btn').click()

    await expect(page.getByTestId('order-declined-card')).toBeVisible()
    await expect(page.getByTestId('nav-cart-count')).toHaveText('1')

    await page.getByTestId('order-retry-after-decline').click()

    await updateScenario(page, {
      paymentOutcome: 'confirm',
      paymentDelayMs: 400,
      orderTimeoutOnce: true,
    })

    const badgeBefore = await page.getByTestId('checkout-idempotency-badge').textContent()
    await page.getByTestId('checkout-submit-btn').click()

    await expect(page.getByTestId('checkout-submit-error')).toContainText('tempo limite')
    await expect(page.getByTestId('checkout-idempotency-badge')).toHaveText(badgeBefore ?? '')

    await page.getByTestId('checkout-submit-btn').click()
    await expect(page).toHaveURL(/\/orders\/ord_[a-f0-9]+\/confirmation/)
    await expect(page.getByTestId('order-confirmation-receipt')).toBeVisible()
  })
})
