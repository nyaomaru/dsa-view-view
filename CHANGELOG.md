# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [vv1.4.0] - 2026-11-25

### Added

- Add First Missing Positive visualization by @nyaomaru in [#99](https://github.com/nyaomaru/dsa-view-view/pull/99)
- jump game by @nyaomaru in [#105](https://github.com/nyaomaru/dsa-view-view/pull/105)
- add N-Queens chessboard visualization by @nyaomaru in [#108](https://github.com/nyaomaru/dsa-view-view/pull/108)
- get permutation visualization by @nyaomaru in [#110](https://github.com/nyaomaru/dsa-view-view/pull/110)
- unique paths by @nyaomaru in [#116](https://github.com/nyaomaru/dsa-view-view/pull/116)
  - Why: Tightens detection so only the canonical Unique Paths recurrence uses the dedicated view.

### Fixed

- message position by @nyaomaru in [#93](https://github.com/nyaomaru/dsa-view-view/pull/93)
- fit 9x9 matrix grids inside visualization modal by @nyaomaru in [#97](https://github.com/nyaomaru/dsa-view-view/pull/97)
  - Why: Fix Matrix View for 9×9 boards overflowing the modal and forcing horizontal scroll.
- patch dompurify and source-map-js security alerts by @nyaomaru in [#98](https://github.com/nyaomaru/dsa-view-view/pull/98)
- pin Vercel deployments to Node 24 by @nyaomaru in [#103](https://github.com/nyaomaru/dsa-view-view/pull/103)
- bump dompurify to 3.4.17 by @nyaomaru in [#120](https://github.com/nyaomaru/dsa-view-view/pull/120)
- remove logo from mobile header by @nyaomaru in [#127](https://github.com/nyaomaru/dsa-view-view/pull/127)

### Changed

- adjust github link and panel frame by @nyaomaru in [#130](https://github.com/nyaomaru/dsa-view-view/pull/130)

### Docs

- v1.3.0 by [bot] by @github-actions in [#91](https://github.com/nyaomaru/dsa-view-view/pull/91)

### Chore

- bump the minor-and-patch group with 14 updates by [bot] by @dependabot in [#92](https://github.com/nyaomaru/dsa-view-view/pull/92)
- bump vite-plus from 0.3.3 to 1.0.0 by [bot] by @dependabot in [#95](https://github.com/nyaomaru/dsa-view-view/pull/95)
- bump the minor-and-patch group across 1 directory with 6 updates by [bot] by @dependabot in [#96](https://github.com/nyaomaru/dsa-view-view/pull/96)
- bump nyaomaru/changelog-bot from 0.6.14 to 0.7.0 in the actions group by [bot] by @dependabot in [#100](https://github.com/nyaomaru/dsa-view-view/pull/100)
- bump framer-motion from 13.4.3 to 14.0.0 by [bot] by @dependabot in [#102](https://github.com/nyaomaru/dsa-view-view/pull/102)
- bump nyaomaru/changelog-bot from 0.7.0 to 0.8.0 in the actions group by [bot] by @dependabot in [#106](https://github.com/nyaomaru/dsa-view-view/pull/106)
- bump nyaomaru/changelog-bot from 0.8.0 to 0.9.3 in the actions group by [bot] by @dependabot in [#112](https://github.com/nyaomaru/dsa-view-view/pull/112)
- bump /resolvers from 5.9.1 to 6.0.0 by @dependabot[bot] by @hookform in [#114](https://github.com/nyaomaru/dsa-view-view/pull/114)
- bump zod from 4.6.5 to 4.6.6 by [bot] by @dependabot in [#115](https://github.com/nyaomaru/dsa-view-view/pull/115)
- bump vite-plus from 1.1.0 to 1.3.0 by [bot] by @dependabot in [#111](https://github.com/nyaomaru/dsa-view-view/pull/111)
- bump nyaomaru/changelog-bot from 0.9.3 to 0.10.1 in the actions group by [bot] by @dependabot in [#118](https://github.com/nyaomaru/dsa-view-view/pull/118)
- bump the minor-and-patch group across 1 directory with 28 updates by [bot] by @dependabot in [#119](https://github.com/nyaomaru/dsa-view-view/pull/119)
- bump nyaomaru/changelog-bot from 0.10.1 to 0.11.1 in the actions group by [bot] by @dependabot in [#121](https://github.com/nyaomaru/dsa-view-view/pull/121)
- bump /resolvers from 6.0.2 to 7.0.3 by @dependabot[bot] by @hookform in [#123](https://github.com/nyaomaru/dsa-view-view/pull/123)
- bump jsdom from 30.1.3 to 31.0.0 by [bot] by @dependabot in [#124](https://github.com/nyaomaru/dsa-view-view/pull/124)
- bump the minor-and-patch group with 17 updates by [bot] by @dependabot in [#126](https://github.com/nyaomaru/dsa-view-view/pull/126)
- bump /jest-dom from 7.0.1 to 8.0.0 by @dependabot[bot] by @testing-library in [#129](https://github.com/nyaomaru/dsa-view-view/pull/129)
- bump the minor-and-patch group with 10 updates by [bot] by @dependabot in [#128](https://github.com/nyaomaru/dsa-view-view/pull/128)

**Full Changelog**: https://github.com/nyaomaru/dsa-view-view/compare/v1.3.0...v1.4.0

[vv1.4.0]: https://github.com/nyaomaru/dsa-view-view/compare/v1.3.0...v1.4.0

## [vv1.3.0] - 2026-09-26

### Added

- capacity search view by @nyaomaru in [#69](https://github.com/nyaomaru/dsa-view-view/pull/69)
  - Why: Add a dedicated Capacity View for shipping-capacity binary searches.
- add runtime comparison view by @nyaomaru in [#70](https://github.com/nyaomaru/dsa-view-view/pull/70)
- add longest substring sliding window view by @nyaomaru in [#76](https://github.com/nyaomaru/dsa-view-view/pull/76)
- add side-by-side DFS comparison by @nyaomaru in [#78](https://github.com/nyaomaru/dsa-view-view/pull/78)
- add permutations and show void final inputs by @nyaomaru in [#81](https://github.com/nyaomaru/dsa-view-view/pull/81)
- add zigzag conversion visualization by @nyaomaru in [#82](https://github.com/nyaomaru/dsa-view-view/pull/82)
- add regex matching visualization by @nyaomaru in [#87](https://github.com/nyaomaru/dsa-view-view/pull/87)
- show contextual comparisons in index visualizers by @nyaomaru in [#90](https://github.com/nyaomaru/dsa-view-view/pull/90)

### Fixed

- icon & buttons image by @nyaomaru in [#65](https://github.com/nyaomaru/dsa-view-view/pull/65)
- clarify empty stack handling in parentheses sample by @nyaomaru in [#74](https://github.com/nyaomaru/dsa-view-view/pull/74)
- execution frame id in error handlers by @nyaomaru in [#83](https://github.com/nyaomaru/dsa-view-view/pull/83)

### Changed

- stock profit types and UI by @nyaomaru in [#66](https://github.com/nyaomaru/dsa-view-view/pull/66)

### Docs

- v1.2.0 by [bot] by @github-actions in [#62](https://github.com/nyaomaru/dsa-view-view/pull/62)

### Chore

- add calm and beam animations by @nyaomaru in [#75](https://github.com/nyaomaru/dsa-view-view/pull/75)
- style align dark background tokens by @nyaomaru in [#86](https://github.com/nyaomaru/dsa-view-view/pull/86)
- bump nyaomaru/changelog-bot from 0.6.9 to 0.6.10 in the actions group by [bot] by @dependabot in [#63](https://github.com/nyaomaru/dsa-view-view/pull/63)
- bump the minor-and-patch group with 6 updates by [bot] by @dependabot in [#64](https://github.com/nyaomaru/dsa-view-view/pull/64)
- bump nyaomaru/changelog-bot from 0.6.10 to 0.6.11 in the actions group by [bot] by @dependabot in [#72](https://github.com/nyaomaru/dsa-view-view/pull/72)
- bump the minor-and-patch group with 7 updates by [bot] by @dependabot in [#73](https://github.com/nyaomaru/dsa-view-view/pull/73)
- bump nyaomaru/changelog-bot from 0.6.11 to 0.6.12 in the actions group by [bot] by @dependabot in [#79](https://github.com/nyaomaru/dsa-view-view/pull/79)
- bump the minor-and-patch group with 11 updates by [bot] by @dependabot in [#80](https://github.com/nyaomaru/dsa-view-view/pull/80)
- bump nyaomaru/changelog-bot from 0.6.12 to 0.6.13 in the actions group by [bot] by @dependabot in [#84](https://github.com/nyaomaru/dsa-view-view/pull/84)
- bump the minor-and-patch group with 18 updates by [bot] by @dependabot in [#85](https://github.com/nyaomaru/dsa-view-view/pull/85)
- bump nyaomaru/changelog-bot from 0.6.13 to 0.6.14 in the actions group by [bot] by @dependabot in [#88](https://github.com/nyaomaru/dsa-view-view/pull/88)
- bump the minor-and-patch group with 12 updates by [bot] by @dependabot in [#89](https://github.com/nyaomaru/dsa-view-view/pull/89)

**Full Changelog**: https://github.com/nyaomaru/dsa-view-view/compare/v1.2.0...v1.3.0

[vv1.3.0]: https://github.com/nyaomaru/dsa-view-view/compare/v1.2.0...v1.3.0

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
