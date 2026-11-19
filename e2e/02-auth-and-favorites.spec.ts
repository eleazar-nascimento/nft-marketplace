import { expect, test } from '@playwright/test'
import { loginAsAna, loginAsBruno, resetSimulation, updateScenario } from './helpers'

test.describe('Autenticação, Sessão e Favoritos', () => {
  test('3. cadastro com conflito, login, expiração de sessão, logout e troca de usuário com isolamento', async ({
    page,
  }) => {
    await resetSimulation(page, 'fast')

    await page.goto('/register')
    await page.getByTestId('register-username').fill('ana_dup')
    await page.getByTestId('register-email').fill('ana@nft.dev')
    await page.getByTestId('register-password').fill('Senha@123')
    await page.getByTestId('register-confirmPassword').fill('Senha@123')
    await page.getByTestId('register-submit').click()
    await expect(page.getByTestId('register-email-error')).toContainText('já está cadastrado')

    await page.getByTestId('register-email').fill('clara@nft.dev')
    await page.getByTestId('register-username').fill('clara_mendes')
    await page.getByTestId('register-submit').click()
    await expect(page.getByTestId('nav-user-name')).toHaveText('clara_mendes')

    await page.getByTestId('nav-logout-button').click()
    await expect(page.getByTestId('nav-login-link')).toBeVisible()

    await loginAsAna(page)
    await page.goto('/profile')
    await expect(page.getByTestId('profile-favorite-nft_001')).toBeVisible()

    await page.getByTestId('scenario-toolbar-trigger').click()
    await page.getByTestId('sim-expire-session').click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByTestId('session-expired-banner')).toBeVisible()

    await page.getByTestId('fill-ana-btn').click()
    await page.getByTestId('login-submit').click()
    await expect(page).toHaveURL(/\/profile/)

    await page.getByTestId('nav-logout-button').click()
    await loginAsBruno(page)
    await page.goto('/profile')
    await expect(page.getByTestId('profile-favorite-nft_002')).toBeVisible()
    await expect(page.getByTestId('profile-favorite-nft_001')).toHaveCount(0)
  })

  test('4. favoritos com atualização otimista, rollback em falha de mutation e recuperação', async ({
    page,
  }) => {
    await resetSimulation(page, 'fast')
    await loginAsAna(page)

    await page.goto('/nft/nft_002')
    const favBtn = page.getByTestId('detail-favorite-btn')
    const countEl = page.getByTestId('detail-favorite-count')
    const initialLikes = Number(await countEl.textContent())

    await updateScenario(page, {
      failures: [{ route: 'POST /favorites', mode: 'http', status: 500, times: 1 }],
    })

    await favBtn.click()
    await expect(page.getByTestId('toast-notification').first()).toContainText(
      'Não foi possível atualizar os favoritos',
    )
    await expect(countEl).toHaveText(String(initialLikes))
    await expect(favBtn).toHaveAttribute('aria-pressed', 'false')

    await favBtn.click()
    await expect(favBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(countEl).toHaveText(String(initialLikes + 1))

    await page.reload()
    await expect(page.getByTestId('detail-favorite-btn')).toHaveAttribute('aria-pressed', 'true')
  })
})
