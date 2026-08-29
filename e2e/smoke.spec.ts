import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0
  })
})

test('formats TypeScript with Ctrl+S', async ({ page }) => {
  await page.goto('/')

  const editor = page.getByRole('code')
  await expect(editor).toBeVisible()
  await editor.click()
  await page.keyboard.press('Control+A')
  await page.keyboard.type('function  foo( ){return  1}')

  await page.keyboard.press('Control+S')

  await expect(page.locator('.view-lines')).toContainText('function foo() {')
  await expect(page.locator('.view-lines')).toContainText('return 1')
})

test('allows entry functions that share names with DOM globals', async ({
  page,
}) => {
  await page.goto('/')

  const editor = page.getByRole('code')
  await expect(editor).toBeVisible()
  const sourceCode = `function* parent(): Generator<number | string, string, void> {
  const childResult = yield* child()

  yield childResult
  return 'parent done'
}

function* child(): Generator<number, string, void> {
  yield 1
  return 'child done'
}`
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.evaluate((clipboardValue) => {
    const clipboardNavigator = navigator as Navigator & {
      clipboard: { writeText: (value: string) => Promise<void> }
    }
    return clipboardNavigator.clipboard.writeText(clipboardValue)
  }, sourceCode)
  await editor.click()
  await page.keyboard.press('Control+A')
  await page.keyboard.press('Control+V')

  const compileButton = page.getByRole('button', { name: 'Compile Code' })
  await expect(compileButton).toBeEnabled()
  await compileButton.click()

  await expect(page.getByText('Input Parameters')).toBeVisible()
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(page.getByText('All execution steps')).toBeVisible()
  await expect(page.getByText('Duplicate identifier')).toHaveCount(0)
  await expect(
    page.getByText('Returned: "parent done"', { exact: true })
  ).toBeVisible()
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

  const visualizationDialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Bar Chart: nums' }) })
  const openDialog = page.getByRole('dialog')
  await expect(openDialog).toBeVisible()

  if (isMobile) {
    const viewport = page.viewportSize()
    const dialogBox = await openDialog.boundingBox()
    const playbackBox = await openDialog
      .getByRole('group', {
        name: 'Visualization playback controls',
      })
      .boundingBox()

    expect(viewport).not.toBeNull()
    expect(dialogBox).not.toBeNull()
    expect(playbackBox).not.toBeNull()
    expect(dialogBox?.x).toBeCloseTo(4, 0)
    expect(dialogBox?.y).toBeCloseTo(8, 0)
    expect(dialogBox?.width).toBeCloseTo((viewport?.width ?? 0) - 8, 0)
    expect(dialogBox?.height).toBeCloseTo((viewport?.height ?? 0) - 16, 0)
    expect(playbackBox?.x).toBeGreaterThan(dialogBox?.x ?? 0)
    expect((playbackBox?.x ?? 0) + (playbackBox?.width ?? 0)).toBeLessThan(
      (dialogBox?.x ?? 0) + (dialogBox?.width ?? 0)
    )
    expect((playbackBox?.y ?? 0) + (playbackBox?.height ?? 0)).toBeLessThan(
      (dialogBox?.y ?? 0) + (dialogBox?.height ?? 0)
    )
    await expect(
      openDialog.getByRole('group', {
        name: 'Visualization playback controls',
      })
    ).toBeVisible()
  }

  await openDialog.getByRole('button', { name: 'Close' }).click()
  await expect(openDialog).toBeHidden()

  if (isMobile) {
    await expect(page.getByRole('button', { name: 'Runtime' })).toHaveClass(
      /bg-primary/
    )
  }

  await page.getByTitle('Visualize as bar chart').click()
  await expect(visualizationDialog).toBeVisible()
  await visualizationDialog.getByRole('button', { name: 'Close' }).click()
  await expect(visualizationDialog).toBeHidden()

  if (!isMobile) {
    await page.getByRole('button', { name: 'Open link menu' }).click()

    const shareDialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: 'Share visualization' }),
    })
    await expect(shareDialog).toBeVisible()
    await expect(shareDialog.getByLabel('Share URL')).toHaveValue(/#s=/)
  }
})

test('visualizes Product Except Self answer growth', async ({ page }) => {
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

  const stackDialog = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: 'Stack Visualization: answer' }),
  })
  await page.getByTitle('Skip to End').first().click()
  await expect(stackDialog).toBeVisible()
})

test('visualizes trapped rain water between height bars', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('combobox', { name: 'Example' }).click()
  await page.getByLabel('Search examples').fill('trapping rain water')
  await page
    .getByRole('option', { name: 'Trapping Rain Water', exact: true })
    .click()

  await expect(page.getByText('Input Parameters')).toBeVisible()
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(page.getByText('All execution steps')).toBeVisible()

  const areaDialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Area View: height' }) })
  await expect(areaDialog).toBeVisible()
  await areaDialog.getByTitle('Skip to End').click()
  await expect(areaDialog.getByTitle('Skip to End')).toBeDisabled()

  await expect(
    page.getByRole('heading', { name: 'Area View: height' })
  ).toBeVisible()
  await expect(page.getByText('Rain Water View: height')).toBeVisible()
  await expect(page.getByText('water=6')).toBeVisible()
})

test('tracks maximum-subarray state at each array position', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByRole('combobox', { name: 'Example' }).click()
  await page.getByLabel('Search examples').fill('maximum subarray')
  await page
    .getByRole('option', { name: 'Maximum Subarray', exact: true })
    .click()

  await expect(page.getByText('Input Parameters')).toBeVisible()
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(page.getByText('All execution steps')).toBeVisible()

  const maxSubarrayDialog = page.getByRole('dialog').filter({
    has: page.getByRole('heading', {
      name: 'Maximum Subarray View: nums',
    }),
  })
  await expect(maxSubarrayDialog).toBeVisible()
  await maxSubarrayDialog.getByTitle('Skip to End').click()
  await expect(maxSubarrayDialog.getByText('Best ending here')).toBeVisible()
  await expect(maxSubarrayDialog.getByText('Best so far')).toBeVisible()
  await expect(
    maxSubarrayDialog.getByLabel('Index 8: 4, current')
  ).toBeVisible()
  await expect(
    maxSubarrayDialog.getByText('maxEndingHere').first()
  ).toBeVisible()
  await expect(maxSubarrayDialog.getByText('maxSoFar').first()).toBeVisible()
})

test('visualizes array and rolling DP examples', async ({ page, isMobile }) => {
  const examples = [
    { label: 'Coin Change', variable: 'dp', table: 'dp: DP table' },
    {
      label: 'Longest Increasing Subsequence',
      variable: 'dp',
      table: 'dp: DP table',
    },
    {
      label: 'House Robber',
      variable: 'nums',
      table: 'nums: rolling DP state',
    },
  ]

  for (const example of examples) {
    await page.goto('/')
    await page.getByRole('combobox', { name: 'Example' }).click()
    await page.getByLabel('Search examples').fill(example.label)
    await page.getByRole('option', { name: example.label, exact: true }).click()

    await expect(page.getByText('Input Parameters')).toBeVisible()
    await page.getByRole('button', { name: 'Run', exact: true }).click()
    await expect(page.getByText('All execution steps')).toBeVisible()

    const dpDialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', {
        name: `DP View: ${example.variable}`,
      }),
    })
    const openDialog = page.getByRole('dialog')
    if (await openDialog.isVisible()) {
      await openDialog.getByTitle('Skip to End').click()
    } else {
      await page.getByTitle('Skip to End').first().click()
    }

    await expect(dpDialog).toBeVisible()
    await expect(dpDialog.getByText(example.table)).toBeVisible()

    if (isMobile) {
      const scrollContainer = dpDialog.locator('[data-tree-scroll-container]')
      const layout = await scrollContainer.evaluate((element) => {
        const containerTop = element.getBoundingClientRect().top
        const firstChildTop =
          element.firstElementChild?.getBoundingClientRect().top

        return {
          containerTop,
          firstChildTop,
          scrollTop: element.scrollTop,
        }
      })

      expect(layout.scrollTop).toBe(0)
      expect(layout.firstChildTop).toBeGreaterThanOrEqual(
        layout.containerTop - 1
      )
    }
  }
})

test('visualizes semantic Map updates', async ({ page }) => {
  const examples = [
    { label: 'Two Sum', map: 'seen', table: 'seen: lookup table' },
    {
      label: 'Valid Anagram',
      map: 'counts',
      table: 'counts: frequency table',
    },
  ]

  for (const example of examples) {
    await page.goto('/')
    await page.getByRole('combobox', { name: 'Example' }).click()
    await page.getByLabel('Search examples').fill(example.label)
    await page.getByRole('option', { name: example.label, exact: true }).click()

    await expect(page.getByText('Input Parameters')).toBeVisible()
    await page.getByRole('button', { name: 'Run', exact: true }).click()
    await expect(page.getByText('All execution steps')).toBeVisible()
    await expect(page.getByText('Execution Error')).toHaveCount(0)

    const mapDialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', {
        name: `Map View: ${example.map}`,
      }),
    })
    const openDialog = page.getByRole('dialog')
    if (await openDialog.isVisible()) {
      await openDialog.getByTitle('Skip to End').click()
    } else {
      await page.getByTitle('Skip to End').first().click()
    }

    await expect(mapDialog).toBeVisible()
    await expect(mapDialog.getByText(example.table)).toBeVisible()
  }
})

test('shows Top K result growth instead of buckets Matrix View', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByRole('combobox', { name: 'Example' }).click()
  await page.getByLabel('Search examples').fill('top k frequent')
  await page
    .getByRole('option', { name: 'Top K Frequent', exact: true })
    .click()

  await expect(page.getByText('Input Parameters')).toBeVisible()
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(page.getByText('All execution steps')).toBeVisible()

  await expect(page.getByText('Graph View')).toHaveCount(0)
  await expect(page.getByText('Matrix View')).toHaveCount(0)
  const stackDialog = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: 'Stack Visualization: result' }),
  })
  await page.getByTitle('Skip to End').first().click()
  await expect(stackDialog).toBeVisible()
})

test('returns cyclic clone graphs across the worker boundary', async ({
  page,
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

  const graphDialog = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: 'Graph: return value' }),
  })
  await expect(graphDialog).toBeVisible()
  await expect(graphDialog).toHaveCSS('opacity', '1')

  const dialogBox = await graphDialog.boundingBox()
  const graphBox = await graphDialog
    .getByRole('img', { name: 'return value graph' })
    .boundingBox()

  expect(dialogBox).not.toBeNull()
  expect(graphBox).not.toBeNull()
  expect(graphBox?.x).toBeGreaterThanOrEqual(dialogBox?.x ?? 0)
  expect(graphBox?.y).toBeGreaterThanOrEqual(dialogBox?.y ?? 0)
  expect((graphBox?.x ?? 0) + (graphBox?.width ?? 0)).toBeLessThanOrEqual(
    (dialogBox?.x ?? 0) + (dialogBox?.width ?? 0)
  )
  expect((graphBox?.y ?? 0) + (graphBox?.height ?? 0)).toBeLessThanOrEqual(
    (dialogBox?.y ?? 0) + (dialogBox?.height ?? 0)
  )
})
