import { expect, type Page } from '@playwright/test'
import type { ScenarioConfig, ScenarioPreset } from '../src/mocks/scenarios'

export async function resetSimulation(page: Page, preset: ScenarioPreset = 'fast'): Promise<void> {
  await page.goto(`/?__scenario=${preset}`)
  await page.evaluate(async (targetPreset) => {
    localStorage.clear()
    sessionStorage.clear()
    await fetch('/api/__sim/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset: targetPreset }),
    })
  }, preset)
  await page.reload()
  await expect(page.getByTestId('catalog-grid').or(page.getByTestId('catalog-empty-state')).or(page.getByTestId('catalog-error-state')).or(page.getByTestId('catalog-skeleton-grid'))).toBeVisible()
}

export async function updateScenario(
  page: Page,
  patch: { preset?: ScenarioPreset } & Partial<ScenarioConfig>,
): Promise<void> {
  await page.evaluate(async (body) => {
    await fetch('/api/__sim/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }, patch)
}

export async function loginAsAna(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByTestId('fill-ana-btn').click()
  await page.getByTestId('login-submit').click()
  await expect(page).not.toHaveURL(/\/login/)
}

export async function loginAsBruno(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByTestId('fill-bruno-btn').click()
  await page.getByTestId('login-submit').click()
  await expect(page).not.toHaveURL(/\/login/)
}
