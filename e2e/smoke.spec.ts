import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0
  })
})

test('loads, compiles, runs a demo, and opens core dialogs', async ({
  page,
  isMobile,
}) => {
  await page.goto('/')

  await expect(page.getByLabel('Code Editor')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run demo' })).toBeVisible()

  await page.getByRole('button', { name: 'Compile Code' }).click()
  await expect(page.getByText('Input Parameters')).toBeVisible()

  if (isMobile) {
    await expect(
      page.getByRole('button', { name: 'Verification' })
    ).toHaveClass(/bg-primary/)
    await page.getByRole('button', { name: 'Editor' }).click()
    await expect(
      page.getByRole('button', { name: 'Compile Code' })
    ).toBeVisible()
  }

  const executionWorkerStarted = page.waitForEvent('worker', {
    predicate: (worker) => worker.url().includes('execution-worker'),
  })
  await page.getByRole('button', { name: 'Run demo' }).click()
  await executionWorkerStarted
  await expect(page.getByText('All execution steps')).toBeVisible()

  if (isMobile) {
    await expect(page.getByRole('button', { name: 'Runtime' })).toHaveClass(
      /bg-primary/
    )
  }

  await page.getByTitle('Visualize as bar chart').click()

  const visualizationDialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Bar Chart: nums' }) })
  await expect(visualizationDialog).toBeVisible()
  await visualizationDialog.getByRole('button', { name: 'Close' }).click()

  if (!isMobile) {
    await page.getByRole('button', { name: 'Open link menu' }).click()

    const shareDialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: 'Share visualization' }),
    })
    await expect(shareDialog).toBeVisible()
    await expect(shareDialog.getByLabel('Share URL')).toHaveValue(/#s=/)
  }
})
