import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'

describe('Select', () => {
  it('uses secondary styling for focused items', () => {
    render(
      <Select open value="1">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">1</SelectItem>
        </SelectContent>
      </Select>
    )

    expect(screen.getByRole('option', { name: '1' })).toHaveClass(
      'focus:bg-secondary',
      'focus:text-secondary-foreground'
    )
  })
})
