import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'

const SOURCE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
)
const LAYER_RANK = {
  shared: 0,
  entities: 1,
  features: 2,
  widgets: 3,
  pages: 4,
  app: 5,
} as const
const SLICED_LAYERS = new Set(['entities', 'features', 'widgets', 'pages'])
const SECONDARY_PUBLIC_APIS = new Set([
  '@/entities/code/compiler',
  '@/features/code-editing/code-editor',
  '@/features/code-editing/parser',
  '@/features/code-execution/controls',
  '@/features/code-execution/input-form',
  '@/features/compilation/compiler',
  '@/features/visualization/visualizer',
])
const ALIAS_IMPORT_PATTERN =
  /['"]@\/(app|pages|widgets|features|entities|shared)\/([^'"]+)['"]/g

type Layer = keyof typeof LAYER_RANK

async function getSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return getSourceFiles(entryPath)
      if (
        !/\.(ts|tsx)$/.test(entry.name) ||
        /\.test\.(ts|tsx)$/.test(entry.name)
      ) {
        return []
      }
      return [entryPath]
    })
  )

  return files.flat()
}

describe('FSD architecture', () => {
  it('keeps production imports inside layer and public API boundaries', async () => {
    const violations: string[] = []

    for (const file of await getSourceFiles(SOURCE_ROOT)) {
      const relativeFile = path.relative(SOURCE_ROOT, file)
      const [sourceLayer, sourceSlice] = relativeFile.split(path.sep) as [
        Layer,
        string,
      ]
      const source = await readFile(file, 'utf8')

      for (const match of source.matchAll(ALIAS_IMPORT_PATTERN)) {
        const targetLayer = match[1] as Layer
        const targetParts = match[2].split('/')
        const targetSlice = targetParts[0]
        const targetPath = `@/${targetLayer}/${match[2]}`

        if (LAYER_RANK[targetLayer] > LAYER_RANK[sourceLayer]) {
          violations.push(`${relativeFile}: upward import ${targetPath}`)
          continue
        }

        const crossesSlice =
          sourceLayer === targetLayer &&
          SLICED_LAYERS.has(sourceLayer) &&
          sourceSlice !== targetSlice
        if (crossesSlice) {
          violations.push(`${relativeFile}: cross-slice import ${targetPath}`)
          continue
        }

        const bypassesPublicApi =
          SLICED_LAYERS.has(targetLayer) &&
          (sourceLayer !== targetLayer || sourceSlice !== targetSlice) &&
          targetParts.length > 1 &&
          !SECONDARY_PUBLIC_APIS.has(targetPath)
        if (bypassesPublicApi) {
          violations.push(`${relativeFile}: private import ${targetPath}`)
        }
      }
    }

    expect(violations).toEqual([])
  })
})
