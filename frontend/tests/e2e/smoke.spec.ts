import { test, expect } from '@playwright/test'

test('landing page renders key navigation', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('D&D Hub')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Dice' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'References' })).toBeVisible()
})
