import { expect, test } from '@playwright/test'
import { loginAsAna, resetSimulation, updateScenario } from './helpers'

test.describe('Perfil e Carteiras', () => {
  test('8. edição de perfil, avatar, senha e carteiras com erros de validação e persistência', async ({
    page,
  }) => {
    await resetSimulation(page, 'fast')
    await loginAsAna(page)

    await page.goto('/profile')
    await page.getByTestId('profile-email').fill('bruno@nft.dev')
    await page.getByTestId('profile-save-btn').click()
    await expect(page.getByTestId('profile-email-error')).toContainText('já está em uso')

    await page.getByTestId('profile-email').fill('ana@nft.dev')
    await page.getByTestId('profile-name').fill('Ana Colecionadora')
    await page.getByTestId('profile-save-btn').click()
    await expect(page.getByTestId('nav-user-name')).toHaveText('Ana Colecionadora')

    const samplePngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByTestId('profile-change-avatar-btn').click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from(samplePngBase64, 'base64'),
    })
    await expect(page.getByTestId('profile-avatar-img')).toHaveAttribute('src', /^data:image\/png;base64,/)
    await expect(page.getByTestId('header-user-avatar')).toHaveAttribute('src', /^data:image\/png;base64,/)

    await page.getByTestId('profile-remove-avatar-btn').click()
    await expect(page.getByTestId('profile-avatar-placeholder')).toBeVisible()
    await expect(page.getByTestId('header-user-avatar')).toHaveCount(0)

    const restoreChooserPromise = page.waitForEvent('filechooser')
    await page.getByTestId('profile-change-avatar-btn').click()
    const restoreChooser = await restoreChooserPromise
    await restoreChooser.setFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from(samplePngBase64, 'base64'),
    })
    await expect(page.getByTestId('profile-avatar-img')).toHaveAttribute('src', /^data:image\/png;base64,/)

    await page.getByTestId('password-current').fill('SenhaErrada1')
    await page.getByTestId('password-new').fill('NovaSenha@123')
    await page.getByTestId('password-confirm').fill('NovaSenha@123')
    await page.getByTestId('password-save-btn').click()
    await expect(page.getByTestId('password-current-error')).toContainText('Senha atual incorreta')

    await page.getByTestId('password-current').fill('Senha@123')
    await page.getByTestId('password-save-btn').click()
    await expect(
      page.getByTestId('toast-notification').filter({ hasText: 'Senha alterada com sucesso' }),
    ).toBeVisible()

    await page.reload()
    await expect(page.getByTestId('profile-name')).toHaveValue('Ana Colecionadora')

    await page.goto('/wallets')
    await page.getByTestId('wallet-address-secondary').fill('endereco_invalido')
    await page.getByTestId('wallet-save-secondary').click()
    await expect(page.getByTestId('wallet-address-err-secondary')).toContainText('Endereço inválido')

    await page.getByTestId('wallet-fill-sample-secondary').click()
    await page.getByTestId('wallet-network-secondary-polygon').click()
    await page.getByTestId('wallet-save-secondary').click()
    await expect(
      page.getByTestId('toast-notification').filter({ hasText: 'Carteira salva com sucesso' }),
    ).toBeVisible()

    await updateScenario(page, { walletConnect: 'reject' })
    await page.getByTestId('wallet-connect-secondary').click()
    await expect(
      page.getByTestId('toast-notification').filter({ hasText: 'Falha ao conectar carteira' }),
    ).toBeVisible()

    await updateScenario(page, { walletConnect: 'approve' })
    await page.getByTestId('wallet-connect-secondary').click()
    await expect(page.getByTestId('wallet-connected-badge-secondary')).toBeVisible()
  })
})
