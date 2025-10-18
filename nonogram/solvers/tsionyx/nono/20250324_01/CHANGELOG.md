# Changelog
All notable changes to this project will be documented in this file.

The format based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).


## [0.7.3] - 2021-11-06

### Fixed
- correctly show the black-and-white solved puzzle in the terminal (thanks to @SmileB4Deathz).


## [0.7.2] - 2021-11-05

### Added
- special `UnsolvableLine` error type;
- new benchmarks info:
  - how it behaves on hard puzzles with the default backtracking (without SAT);
  - when the SAT finds the first solution and how much time it needs to find the second one;
  - new hard line-solvable puzzles from http://www.nonograms.org;
- information on blotted (webpbn) puzzles:
  - numbers;
  - supported formats;
- show solution rate on various steps of solving.

### Changed
- moved from Travis CI to Github Actions;
- updated compiler lints in lib.rs;
- refactoring:
  - simplify string trimming while parsing;
  - explicit anonymous lifetimes;
  - signatures of members for `Copy` traits (`Color` and `Block`): `&self` -> `self`;
  - new names for `LineSolver`'s methods:
    - `get_soltion`-> `into_solution`;
    - `get_sol` -> `solve_block`;
  - get rid of isize argument in `LineSolver::set_color_block`;
- updated dependencies:
  - `ordered_float`=2.8;
  - `smalvec`=1.6;
  - others with `cargo update` (check that they are still compilable under Rust 1.39).

### Fixed
- a lot of clippy warnings (up to 1.57.0-beta.3 and 1.58.0-nightly);
- suppress `clippy::cast_precision_loss`;
- suppress some IDEA warnings (`std::fmt::Debug`);
- benchmark script:
  - variables scope;
  - `RUSTFLAGS="-C target-cpu=native"` for maximum performance;
- freeze `varisat` version to "=0.2.1" (to support Rust 1.39).


## [0.7.1] - 2020-08-09

### Added
- automatically deploy solution on https://spoj.com.

### Changed
- represent a line as `Rc<B>` instead of `Rc<Vec<B>>`;
- trait bounds for `ShellRenderer`;
- move rendering of `BinaryColor` into `render.rs`;
- `update_solved` returns `Option::None` instead of empty `Vec`;
- refactoring:
  - extract `LineDirection` and `LinePosition`;
  - generalize `JobQueue`;
  - `uniq_indexes` closure in the `Board` constructor;
  - do not allocate unnecessary `String`-s in parsers;
  - simplify `MyFormat`: reduce nesting;
  - `== ""` => `.is_empty()`;
- remove suppression of some warnings (`#[derive(Debug)]`);
- coverage run only once as the last step of CI;


## [0.7.0] - 2020-07-12

### Added
- `BoardParser::parse_rc` to produce the `Arc<RefCell<Board>>` in one step;

### Changed
- flatten the library's API;
- renamed some public `struct`-s;
- use `Box<[B]>` instead of `Vec<B>` for the solved lines;
- regrouped the imports;
- updated the dependencies.

### Fixed
- clean the travis cache from previous build's artifacts.


## [0.6.3] - 2020-07-11

### Added
- tests for various webpbn [exported formats](https://webpbn.com/export.cgi);
- tests with minimal supported Rust version (1.39);
- check for _clippy::pedantic_ in travis (3 different sets of features).

### Fixed
- travis builds;
- grammar and typos (thanks to IDEA's hints);
- clippy warnings for the _sat_ feature (with the updated [cargo_every](cargo-every.py) script).

### Changed
- move solvers benchmarks into the [script](benches/cmp.sh);
- [optimize](http://likebike.com/posts/How_To_Write_Fast_Rust_Code.html#opt-hot-path) slice index operations with the `get/get_mut`;
- optimize initial propagation (the lines closer to the edges will be solved first);
- refactor `Job` -> `LinePosition`;
- simplified conditional compliation for _ini_, _xml_, _threaded_ features;
- `Point` with `pub` fields;
- reduce turbofish usage by specifying variable's type.

### Removed
- outdated comments;
- unnecessary `pub`-s.


## [0.6.2] - 2020-01-17

### Fixed
- spoj example clippy warning

### Changed
- SAT solver refactoring


## [0.6.1] - 2019-11-30

### Added
- optimization for colored puzzles: exclusion of colors based on the extreme clues positions;
- Rust logo as solved nonogram image in [README](README.md);
- coverage with [codecov.io](https://codecov.io/gh/tsionyx/nonogrid);
- add some badges in [README](README.md);
- SAT variables and clauses number in the report ot the hardest puzzles;
- [cargo-every.py](cargo-every.py) script for doing a cargo command
  for every combination of features.

### Changed
- simplify generation of SAT clauses for overlapping blocks;
- move some methods of `Description` closer to its definition and add some tests;
- clarified features names and usage;
- updated `--help` message for [batch.sh](benches/batch.sh).


## [0.6.0] - 2019-11-19

### Fixed
- non UTF-8 symbols into input files are ignoring.

### Added
- SAT-solver, adapted for binary and multicolor puzzles:
  huge speed improvement;
- Random puzzles [comparison](https://webpbn.com/survey/#rand);
- Allow using callbacks in non-threaded environment;
- Validation on `Board::restore` (to prevent showing bad results on completion);
- `Renderer::render_simple` to print solution in compact;
- `ProbeImpact` now stores the color of every cell that was changed during the probe.

### Changed
- some clippy warnings
  (in `cargo clippy -- -W clippy::nursery` and `cargo clippy -- -W clippy::pedantic` modes);
- show diff with previous solution when multiple ones found.
- updated and cleaned up benchmarks


## [0.5.2] - 2019-08-14

### Added
- [spoj example](examples/spoj) with the algorithm adaptation for
[this problem](https://www.spoj.com/problems/JCROSS/)
- crate metadata to `--help` with help of `clap`'s macros.

### Fixed
- README examples
- get rid of some allocations by preventing premature `collect`-ing
- do not store `Err("Bad line")` in cache anymore
- use iterators instead of `Vec`'s where possible
- optimize `propagation::Solver::update_line`
- clippy errors about `f64` comparison: use `f64::EPSILON`

### Updated
- move solutions cache from `Board` to `propagation::Solver`
- make the `Priority` abstraction instead of `OrderedFloat<f64>`
- make the `ProbeResult` abstraction instead of `Option`
to represent NewInfo/Contradiction variants
- benchmark results (run some very long-solving puzzles)
- use SmallVec for Point's neighbours
- lower the logs level for some of `probing` and `backtracking` events
- do not create the propagation solver `with_point` anymore, just run with (or without) a Point
- dependencies
- callback test as closure


## [0.5.1] - 2019-07-03

### Fixed
- correctly parse the colors starting with '#', e.g. _#FF00FF_


## [0.5.0] - 2019-07-03
### Added
- olsak is the new default format for webpbn puzzles
- support for [more formats](https://webpbn.com/export.cgi/) (faase, ish, keen, makhorin, ss, syro, nin)
- _LOW_PRIORITY_ environment variable to prevent probing the cells with possibly low impact
- [more checks](src/lib.rs)
- implement `Debug` for all the structures
- [travis](https://travis-ci.org/tsionyx/nonogrid) tests support
- 'stat' mode for [batch.sh](benches/batch.sh) script
- performance comparison [results as csv](benches)
- article on [habr.com]((https://habr.com/ru/post/454586/))

### Fixed
- remove `Color::is_updated_with` and `Board::diff` to improve performance
- disable `backtracking::Solver::explored_paths` to improve performance
- improve `backtracking::SearchTree::debug` to prevent high memory usage
- add 'repository' in crate metadata

### Updated
- move all but the core dependencies into optional features (clap, env_logger, ini, xml, colored)
- iterators refactoring
- [bench results](benches/README.md)
- merge 'benches/batch-nonograms.org.sh' and 'benches/batch-webpbn.sh' into [single script](benches/batch.sh)
- remove unnecessary `pub`


## [0.4.1] - 2019-05-19
### Added
-  add `ColorDesc::rgb_value` to use in web renderer

### Fixed
- restore backtracking timeouts with `Instant::now()` by enabling `std_time` default feature

### Updated
- published on crates.io repository


## [0.4.0] - 2019-05-09
### Added
- ability to use Board in threaded environment (--features=threaded)

### Fixed
- WASM runtime support: remove Instant::now() calls

### Updated
- fix imports to use `crate::` instead of `super::`
- switch to upstream priority-queue (after merging https://github.com/garro95/priority-queue/pull/14)


## [0.3.1] - 2019-04-12
### Added
- callbacks support

### Fixed
- optimization of probing queue: use different strategies depending of queue size
- optimize NonogramsOrg parsing and ShellRenderer with caching

### Updated
- replace `Option::unwrap` with `Option::expect("error message")`
- many refactoring of references
- refactoring with clippy


## [0.3.0] - 2019-04-03
### Added
- Support for multi-colored boards
- Parse boards from https://nonograms.org


## [0.2.0] - 2019-03-15
### Added
- Solve the black-and-white board with the line solving then probing and then backtracking
- Parse boards from https://webpbn.com


## [0.1.0] - 2019-02-12
### Added
- Initial release!
- Parse a board from custom TOML-based format
- Store the board
- Print out the board in the terminal
- Solve a single black-and-white line
