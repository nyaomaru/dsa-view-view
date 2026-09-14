import { expect, test } from '@playwright/test'

test('shows the regex matching visualization', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('combobox', { name: 'Example' }).click()
  await page.getByLabel('Search examples').fill('regular expression matching')
  await page.getByRole('option', { name: 'Regular Expression Matching' }).click()
  await page.getByRole('button', { name: 'Run', exact: true }).click()

  await expect(page.getByText('All execution steps')).toBeVisible()
  await expect(page.getByTestId('regex-match-visualizer')).toBeVisible()
})
