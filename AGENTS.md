# Repository Guidelines

## Project Structure & Module Organization

This repo is a Vite + React + TypeScript app for visualizing algorithm execution. Source code lives in `src/`, organized in a feature-sliced style:

- `src/app/`: app entry, global styles, app-level model, and test setup
- `src/widgets/`: composed UI such as the header
- `src/features/`: editing, compilation, execution, and visualization logic
- `src/entities/`: shared domain types
- `src/shared/`: reusable UI primitives and utilities

Feature tests currently live beside their feature code, for example `src/features/code-execution/tests/`. Static assets are in `public/` and `src/assets/`. Architecture notes and planning docs are in `docs/` and the repo root.

## Build, Test, and Development Commands

Use `pnpm` because the repository includes `pnpm-lock.yaml`.

- `pnpm dev`: start the Vite dev server with HMR
- `pnpm build`: run TypeScript project checks, then create a production build
- `pnpm preview`: serve the built app locally
- `pnpm lint`: run ESLint across the repository
- `pnpm test`: run Vitest in watch mode
- `pnpm test:ui`: open the Vitest UI

## Coding Style & Naming Conventions

Follow the existing TypeScript/React style: 2-space indentation, semicolon-free statements, and single quotes. Use `kebab-case` for all `.ts` and `.tsx` file names (`code-editor.tsx`, `use-algorithm-execution.ts`, `tree-node-input.test.ts`) and feature folder names (`code-execution`, `code-editing`). Keep exported React component names in `PascalCase` and functions/hooks in `camelCase`.

Prefer the `@/` alias for imports from `src`. Re-export public APIs through local `index.ts` files when a slice already exposes one. Keep layer boundaries intact: lower layers must not import from upper layers.

### Runtime Guards

Use `@/shared/lib/guards` as the application boundary for runtime type guards. Prefer existing `is-kit` predicates and combinators over handwritten `typeof`, `Array.isArray`, nullish comparisons, or reusable literal comparisons. Before implementing a custom guard, inspect the installed `is-kit` interface for an existing primitive or composition helper, then import and re-export any missing capability through `@/shared/lib/guards`. Build genuinely domain-specific guards with `define`, `and`, `or`, `not`, `arrayOf`, `struct`, or related is-kit combinators rather than duplicating primitive checks.

## Testing Guidelines

Vitest runs in `jsdom` with shared setup from `src/app/testing/setup.ts`. Add tests next to the feature they validate and name them `*.test.ts`. Prioritize parser, compiler, instrumentation, and execution regressions, using small reproduction-style cases like the existing execution tests.

No coverage threshold is configured today, so contributors should at minimum add tests for new logic and bug fixes.

## Commit & Pull Request Guidelines

Recent history uses short subjects such as `update` and `re-architecture`. Keep commit titles short and imperative, but make them more specific than `update` when possible, for example `fix execution step highlighting`.

PRs should include a concise description, testing notes (`pnpm lint`, `pnpm test`), and screenshots or recordings for UI changes. Link related issues when applicable.
