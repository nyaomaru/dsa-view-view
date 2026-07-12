import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

describe('Tabs', () => {
  it('renders trigger labels inside a foreground layer wrapper', () => {
    render(
      <Tabs defaultValue="editor">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="runtime">Runtime</TabsTrigger>
        </TabsList>
        <TabsContent value="editor">Editor panel</TabsContent>
        <TabsContent value="runtime">Runtime panel</TabsContent>
      </Tabs>
    )

    expect(
      screen
        .getByRole('tab', { name: 'Editor' })
        .querySelector('.pixel-tab-trigger__label')
    ).not.toBeNull()
    expect(
      screen
        .getByRole('tab', { name: 'Runtime' })
        .querySelector('.pixel-tab-trigger__label')
    ).not.toBeNull()
  })
})
