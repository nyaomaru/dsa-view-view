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

test('executes worker traces containing variable declarations', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByRole('combobox', { name: 'Example' }).click()
  await page.getByLabel('Search examples').fill('product except self')
  await page
    .getByRole('option', { name: 'Product Except Self', exact: true })
    .click()

  await expect(page.getByText('Input Parameters')).toBeVisible()
  const executionWorkerStarted = page.waitForEvent('worker', {
    predicate: (worker) => worker.url().includes('execution-worker'),
  })
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await executionWorkerStarted

  await expect(page.getByText('All execution steps')).toBeVisible()
  await expect(page.getByText('[24,12,8,6]')).toBeVisible()
  await expect(
    page.getByText('Worker returned an invalid response.')
  ).toHaveCount(0)
})

test('returns cyclic clone graphs across the worker boundary', async ({
  page,
  isMobile,
}) => {
  await page.goto('/')

  await page.getByRole('combobox', { name: 'Example' }).click()
  await page.getByLabel('Search examples').fill('clone graph')
  await page.getByRole('option', { name: 'Clone Graph', exact: true }).click()

  await expect(page.getByText('Input Parameters')).toBeVisible()
  const executionWorkerStarted = page.waitForEvent('worker', {
    predicate: (worker) => worker.url().includes('execution-worker'),
  })
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await executionWorkerStarted

  await expect(page.getByText('All execution steps')).toBeVisible()
  await expect(page.getByText('Execution Error')).toHaveCount(0)
  await expect(
    page.getByText('Execution produced a value that cannot leave the worker.')
  ).toHaveCount(0)

  if (isMobile) {
    await page.getByRole('button', { name: 'Graph View' }).click()
  }

  await expect(
    page.getByRole('heading', { name: 'Graph: return value' })
  ).toBeVisible()
})
