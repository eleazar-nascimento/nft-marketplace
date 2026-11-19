import { expect, test } from '@playwright/test'
import { resetSimulation } from './helpers'

test.describe('Catálogo e Detalhe do NFT', () => {
  test('1. busca, filtros combinados, ordenação, paginação e restauração pelo histórico @responsive', async ({
    page,
  }) => {
    await resetSimulation(page, 'fast')

    await expect(page.getByTestId('catalog-results-summary')).toContainText('45 NFTs encontrados (página 1 de 5)')

    await page.getByTestId('pagination-page-2').click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByTestId('catalog-results-summary')).toContainText('página 2 de 5')

    const mobileTrigger = page.getByTestId('mobile-filters-trigger')
    if (await mobileTrigger.isVisible()) {
      await mobileTrigger.click()
      await page.getByTestId('mobile-category-art').click()
      await page.getByTestId('mobile-network-select').selectOption('ethereum')
      await page.keyboard.press('Escape')
    } else {
      await page.getByTestId('desktop-category-art').click()
      await page.getByTestId('desktop-network-select').selectOption('ethereum')
    }

    await expect(page).not.toHaveURL(/page=2/)
    await expect(page).toHaveURL(/category=.*art/)
    await expect(page).toHaveURL(/network=ethereum/)

    if (await mobileTrigger.isVisible()) {
      await mobileTrigger.click()
      await page.getByTestId('mobile-sort-select').selectOption('price_asc')
      await page.keyboard.press('Escape')
    } else {
      await page.getByTestId('catalog-sort-select').selectOption('price_asc')
    }
    await expect(page).toHaveURL(/sort=price_asc/)

    if (await mobileTrigger.isVisible()) {
      await page.getByTestId('mobile-search-input').fill('Emerald')
      await page.getByTestId('mobile-search-input').press('Enter')
    } else {
      await page.getByTestId('catalog-search-input').fill('Emerald')
      await page.getByTestId('catalog-search-submit').click()
    }
    await expect(page).toHaveURL(/q=Emerald/)
    await expect(page.getByTestId('catalog-grid').getByTestId('nft-card-nft_001')).toBeVisible()

    await page.reload()
    await expect(page).toHaveURL(/q=Emerald/)
    await expect(page.getByTestId('catalog-grid').getByTestId('nft-card-nft_001')).toBeVisible()

    await page.goBack()
    await expect(page).not.toHaveURL(/q=Emerald/)
    await expect(page).toHaveURL(/sort=price_asc/)
  })

  test('2. acesso direto ao detalhe, edição indisponível, limite de quantidade e recurso inexistente', async ({
    page,
  }) => {
    await resetSimulation(page, 'fast')

    await page.goto('/nft/nft_006')
    await expect(page.getByTestId('detail-nft-title')).toHaveText('Ivory Baron #088')

    await page.getByTestId('gallery-thumb-1').click()
    await expect(page.getByTestId('gallery-thumb-1')).toHaveAttribute('aria-pressed', 'true')

    const plusBtn = page.getByTestId('detail-qty-increase')
    for (let i = 0; i < 6; i += 1) {
      if (await plusBtn.isEnabled()) {
        await plusBtn.click()
      }
    }
    await expect(plusBtn).toBeDisabled()

    await page.getByTestId('edition-option-nft_006_ed2').click()
    await expect(page.getByTestId('edition-unavailable-banner')).toBeVisible()

    await page.goto('/nft/nft_inexistente_999')
    await expect(page.getByTestId('nft-not-found')).toBeVisible()

    await page.goto('/rota/que/nao/existe')
    await expect(page.getByTestId('route-not-found')).toBeVisible()
  })
})
