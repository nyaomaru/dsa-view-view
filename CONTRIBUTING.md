# Contributing to DSA View View

Thanks for considering a contribution to DSA View View. Bug fixes, new
visualizations, tests, documentation, and accessibility improvements are all
welcome.

By participating, you agree to follow our
[Code of Conduct](./CODE_OF_CONDUCT.md).

## Setup

The project requires Node.js 24.15 or later and pnpm 11.2.2.

```sh
pnpm install
pnpm dev
```

## Workflow

1. Fork and clone the repository.
2. Create a focused branch such as `feat/add-heap-view` or
   `fix/mobile-dialog-scroll`.
3. Make a small, reviewable change and add regression tests where appropriate.
4. Run the relevant checks.
5. Open a pull request that explains what changed and why.

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
for commit messages, for example `feat: add heap visualization` or
`fix: preserve matrix scroll position`.

## Checks

Run these checks before opening a pull request:

```sh
pnpm check
pnpm test
pnpm build
```

For changes that affect execution or the interface, also run:

```sh
pnpm test:e2e
```

## Pull Requests

- Keep each pull request focused on one concern.
- Describe the motivation and any important tradeoffs.
- Link related issues with `Closes #123` when applicable.
- Include screenshots or recordings for visible interface changes.
- Update tests and documentation when behavior changes.

Please report suspected security vulnerabilities privately according to our
[Security Policy](./SECURITY.md), rather than opening a public issue.
