import { expect, test } from '@playwright/test'

test('plays the Unique Paths DP grid', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('combobox', { name: 'Example' }).click()
  await page.getByLabel('Search examples').fill('unique paths')
  await page.getByRole('option', { name: 'Unique Paths', exact: true }).click()
  await page.getByRole('button', { name: 'Run', exact: true }).click()

  const dialog = page.getByRole('dialog')
  await expect(
    dialog.getByRole('heading', { name: 'Unique Paths · 3 × 7' })
  ).toBeVisible()
  await expect(
    dialog.getByRole('group', { name: 'Unique paths DP table' })
  ).toBeVisible()
  await page.screenshot({ path: '/tmp/unique-paths-visualization.png' })
})
