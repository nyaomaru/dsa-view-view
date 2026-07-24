# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

* @github-actions[bot] made their first contribution in https://github.com/nyaomaru/dsa-view-view/pull/11

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

* @nyaomaru made their first contribution in https://github.com/nyaomaru/dsa-view-view/pull/1
* @dependabot[bot] made their first contribution in https://github.com/nyaomaru/dsa-view-view/pull/6

**Full Changelog**: https://github.com/nyaomaru/dsa-view-view/commits/v1.0.0

[vv1.0.0]: https://github.com/nyaomaru/dsa-view-view/compare/5f998b205396326dba271dffdb9788b7df30afb7...v1.0.0

