# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [vv1.2.0] - 2026-08-22

### Added

- heap view by @nyaomaru in [#37](https://github.com/nyaomaru/dsa-view-view/pull/37)
- trace async execution by @nyaomaru in [#43](https://github.com/nyaomaru/dsa-view-view/pull/43)
- track concurrent promise frames by @nyaomaru in [#47](https://github.com/nyaomaru/dsa-view-view/pull/47)
- generator execution support by @nyaomaru in [#49](https://github.com/nyaomaru/dsa-view-view/pull/49)
- mouse hover suggestion by @nyaomaru in [#57](https://github.com/nyaomaru/dsa-view-view/pull/57)
  - Why: Enable Monaco’s IDE-style hover information for TypeScript and JavaScript symbols.
- add maximum subarray visualization by @nyaomaru in [#58](https://github.com/nyaomaru/dsa-view-view/pull/58)
- improve mobile visualization modal by @nyaomaru in [#59](https://github.com/nyaomaru/dsa-view-view/pull/59)
- add stock profit visualization by @nyaomaru in [#60](https://github.com/nyaomaru/dsa-view-view/pull/60)

### Fixed

- editor save formatting by @nyaomaru in [#36](https://github.com/nyaomaru/dsa-view-view/pull/36)
  - Why: Register Monaco’s format contribution so Prettier formatting works with `Ctrl/Cmd + S`.
- favicon size ratio by @nyaomaru in [#39](https://github.com/nyaomaru/dsa-view-view/pull/39)
- trace object-backed heap values by @nyaomaru in [#41](https://github.com/nyaomaru/dsa-view-view/pull/41)
- suppress unused entry function warnings by @nyaomaru in [#53](https://github.com/nyaomaru/dsa-view-view/pull/53)

### Changed

- extract View View animation feature by @nyaomaru in [#38](https://github.com/nyaomaru/dsa-view-view/pull/38)
- extract heap tracing by @nyaomaru in [#42](https://github.com/nyaomaru/dsa-view-view/pull/42)

### Docs

- v1.1.0 by [bot] by @github-actions in [#31](https://github.com/nyaomaru/dsa-view-view/pull/31)

### Chore

- enable changelog why sections by @nyaomaru in [#33](https://github.com/nyaomaru/dsa-view-view/pull/33)
- update runtime dependencies by @nyaomaru in [#32](https://github.com/nyaomaru/dsa-view-view/pull/32)
- bump vite-plus from 0.2.5 to 0.2.6 in the minor-and-patch group by [bot] by @dependabot in [#35](https://github.com/nyaomaru/dsa-view-view/pull/35)
- bump the actions group with 2 updates by [bot] by @dependabot in [#34](https://github.com/nyaomaru/dsa-view-view/pull/34)
- bump the minor-and-patch group with 16 updates by [bot] by @dependabot in [#45](https://github.com/nyaomaru/dsa-view-view/pull/45)
- bump jsdom from 29.1.1 to 30.0.1 by [bot] by @dependabot in [#46](https://github.com/nyaomaru/dsa-view-view/pull/46)
- bump nyaomaru/changelog-bot from 0.6.7 to 0.6.8 in the actions group by [bot] by @dependabot in [#50](https://github.com/nyaomaru/dsa-view-view/pull/50)
- bump framer-motion from 12.43.0 to 13.0.0 by [bot] by @dependabot in [#52](https://github.com/nyaomaru/dsa-view-view/pull/52)
- bump the minor-and-patch group across 1 directory with 6 updates by [bot] by @dependabot in [#51](https://github.com/nyaomaru/dsa-view-view/pull/51)
- bump nyaomaru/changelog-bot from 0.6.8 to 0.6.9 in the actions group by [bot] by @dependabot in [#55](https://github.com/nyaomaru/dsa-view-view/pull/55)
- bump the minor-and-patch group with 8 updates by [bot] by @dependabot in [#56](https://github.com/nyaomaru/dsa-view-view/pull/56)

### What’s New in v1.2.0 🚀

This release adds richer execution tracing, new visualizations for classic array problems, and a better experience across desktop and mobile.

#### New Algorithm Visualizations

- **Maximum Subarray View** — Follow the current position, best sum ending at that position, and best sum found so far.
- **Stock Profit View** — Visualize single- and multiple-transaction strategies, including buy/sell decisions, skipped declines, and accumulated profit.
- **Expanded Heap View** — Visualize reordering inside a single local `MinHeap` or `MaxHeap`, not only paired heaps.

#### Async & Generator Execution

- Step through `async` functions and `await` boundaries.
- Track concurrent Promise branches with independent call frames.
- Trace generator execution across `yield`, `yield*`, suspension, resumption, and cleanup.

#### Editor and Mobile Improvements

- Added TypeScript hover information in the code editor.
- Improved formatting on save and removed misleading unused warnings for entry functions.
- Redesigned visualization dialogs for near-fullscreen mobile playback with better scrolling, controls, and return-value handling.

Thanks for using DSA View View! 👀👀

**Full Changelog**: https://github.com/nyaomaru/dsa-view-view/compare/v1.1.0...v1.2.0

[vv1.2.0]: https://github.com/nyaomaru/dsa-view-view/compare/v1.1.0...v1.2.0

## [vv1.1.0] - 2026-07-24

### Added

- add github link by @nyaomaru in [#15](https://github.com/nyaomaru/dsa-view-view/pull/15)
- add built-in min and max heaps by @nyaomaru in [#17](https://github.com/nyaomaru/dsa-view-view/pull/17)
- visualize median finder heaps by @nyaomaru in [#18](https://github.com/nyaomaru/dsa-view-view/pull/18)
- add word ladder visualization by @nyaomaru in [#19](https://github.com/nyaomaru/dsa-view-view/pull/19)
- improve step playback discoverability by @nyaomaru in [#20](https://github.com/nyaomaru/dsa-view-view/pull/20)
- add previous variable change navigation by @nyaomaru in [#21](https://github.com/nyaomaru/dsa-view-view/pull/21)
- expression visualization by @nyaomaru in [#25](https://github.com/nyaomaru/dsa-view-view/pull/25)
- support ListNode array inputs by @nyaomaru in [#28](https://github.com/nyaomaru/dsa-view-view/pull/28)
- add recursive call frame inspector by @nyaomaru in [#27](https://github.com/nyaomaru/dsa-view-view/pull/27)
- add largest rectangle area visualization by @nyaomaru in [#29](https://github.com/nyaomaru/dsa-view-view/pull/29)

### Fixed

- trapped water view detection by @nyaomaru in [#16](https://github.com/nyaomaru/dsa-view-view/pull/16)

### Changed

- configure oxfmt and simplify is-kit guards by @nyaomaru in [#26](https://github.com/nyaomaru/dsa-view-view/pull/26)

### Docs

- v1.0.0 by [bot] by @github-actions in [#11](https://github.com/nyaomaru/dsa-view-view/pull/11)

### Test

- recursive frame snapshots by @nyaomaru in [#14](https://github.com/nyaomaru/dsa-view-view/pull/14)

### Chore

- version bump workflow by @nyaomaru in [#24](https://github.com/nyaomaru/dsa-view-view/pull/24)
- bump the actions group with 2 updates by [bot] by @dependabot in [#22](https://github.com/nyaomaru/dsa-view-view/pull/22)
- bump the minor-and-patch group with 5 updates by [bot] by @dependabot in [#23](https://github.com/nyaomaru/dsa-view-view/pull/23)

### What’s New in v1.1.0 🚀

This release makes it easier to understand not only the final answer, but how the algorithm got there.

#### New Visualizations

- **Largest Rectangle Area View** — Follow the monotonic stack, active rectangle, and best area, including sentinel and final-flush implementations.
- **Expression View** — Step through calculator expressions with the current character, accumulated result, and sign context.
- **Word Ladder View** — Explore BFS levels, queue state, visited words, and active transformations.
- **Heap View** — Watch values move between `MinHeap` and `MaxHeap` in algorithms such as Median Finder.

#### Better Runtime Debugging

- **Call Frame Inspector** — Inspect active, suspended, and completed recursive calls with their arguments and local variables.
- **Previous Variable Change** — Jump directly to the previous step where a selected variable changed.
- Improved step-review guidance after execution completes.

#### More DSA-Friendly Inputs

- Added built-in `MinHeap` and `MaxHeap` implementations.
- Added support for `ListNode[]` inputs, including linked-list arrays and cycle aware structures.

#### Reliability Improvements

- Improved Trapping Rain Water and histogram detection.
- Preserved non-JSON values such as `NaN`, `Infinity`, `BigInt`, and cyclic structures across runtime snapshots.
- Improved recursive frame snapshots, class receiver tracking, visualization fallback behavior, and modal scrolling.

Thanks for using DSA View View! 👀👀

### New Contributors

- @github-actions[bot] made their first contribution in https://github.com/nyaomaru/dsa-view-view/pull/11

**Full Changelog**: https://github.com/nyaomaru/dsa-view-view/compare/v1.0.0...v1.1.0

[vv1.1.0]: https://github.com/nyaomaru/dsa-view-view/compare/v1.0.0...v1.1.0

## [vv1.0.0] - 2026-07-13

### DSA View View 👀👀

<img width="415" height="166" alt="DSA-view-view-logo-animation" src="https://github.com/user-attachments/assets/a9efaa63-0a3d-4abc-9da8-b1060e156f78" />

> Turn algorithms into visual stories.

The very first release of **DSA View View** is here! 🎉

Write TypeScript algorithms, run them with structured inputs, and watch every step come to life from arrays and matrices to trees, linked lists, stacks, and pointers.

<img width="510" height="166" alt="dsa-view-view-tv" src="https://github.com/user-attachments/assets/b3cbc87c-fe8c-4c63-a169-9c661d40b1ba" />

### What’s Inside 🧠⚡

- Step through real TypeScript code in your browser
- Visualize arrays, matrices, trees, linked lists, stacks, and more
- Explore **39 built-in algorithm examples**
- Follow execution frame by frame
- Share the exact code, input, view, and runtime step with a URL
- Meet ViewView, your tiny algorithm-monitoring friend 📺👀

Perfect for debugging solutions, learning data structures, explaining algorithms, or finally turning:

**“I think I get it…”**
into
**“Ohhh, now I can see it!”** ✨

<img width="600" height="326" alt="dsa-view-view-demo" src="https://github.com/user-attachments/assets/5cee9892-830b-4313-84b7-76f64b6f5f5e" />

### Try It 🚀

👉 [Open DSA View View](https://dsa-view-view.vercel.app/)

If algorithms are hard to picture, let’s make them visible. 👀👀

### New Contributors

- @nyaomaru made their first contribution in https://github.com/nyaomaru/dsa-view-view/pull/1
- @dependabot[bot] made their first contribution in https://github.com/nyaomaru/dsa-view-view/pull/6

**Full Changelog**: https://github.com/nyaomaru/dsa-view-view/commits/v1.0.0

[vv1.0.0]: https://github.com/nyaomaru/dsa-view-view/compare/5f998b205396326dba271dffdb9788b7df30afb7...v1.0.0
