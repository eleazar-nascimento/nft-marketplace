import { expect, test } from '@playwright/test'
import { loginAsAna, resetSimulation } from './helpers'

test.describe('Regressão Visual @visual', () => {
  test('visual: início, detalhe, carrinho e pagamento', async ({ page }) => {
    await resetSimulation(page, 'fast')

    await expect(page.getByTestId('catalog-grid')).toBeVisible()
    await expect(page).toHaveScreenshot('01-home.png', { fullPage: false })

    await page.goto('/nft/nft_001')
    await expect(page.getByTestId('detail-nft-title')).toBeVisible()
    await expect(page).toHaveScreenshot('02-nft-detail.png', { fullPage: false })

    await page.getByTestId('detail-buy-now').click()
    await expect(page.getByTestId('cart-line-nft_001')).toBeVisible()
    await expect(page).toHaveScreenshot('03-cart.png', { fullPage: false })

    await loginAsAna(page)
    await page.goto('/checkout')
    await expect(page.getByTestId('checkout-submit-btn')).toBeVisible()
    await expect(page).toHaveScreenshot('04-checkout.png', {
      fullPage: false,
      mask: [page.getByTestId('checkout-idempotency-badge')],
    })
  })
})
