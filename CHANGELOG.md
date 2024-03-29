# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.1] - 2022-01-03

### Fixed
- Fixed TypeScript JSX namespace detection by adding default RxFM root export.

## [2.1.0] - 2022-01-02

### Added
- Added JSX/TSX support to RxFM.

### Changed
- Updated TypeScript version to ^4.5.4, removed deprecated `applet` html component creator.

### Deprecated
- Deprecated `DestroySubject`.
- Deprecated `ConditionalOptions` overload in `conditional` operator.

## [2.0.0] - 2021-11-26

### Added
- Added generic `switchTap` operator to inject an observable side effect into the stream.

### Changed
- Reversed order of `mapToComponents` arguments. Made item index the default id if no id function is provided. Added ability to pass an item key name to derive id from.
- Changed names of `notGate`, `andGate`, `nandGate`, `orGate` and `norGate` observable boolean logic functions to `not`, `and`, `nand`, `or` and `nor` respectively.

## [1.0.0-beta.1] - 2021-07-08
### Added
- Added proxies to access individual style, attribute, and event operators as properties of their respective operators.
- Added ability to pass classes and individual style, and attribute operators as tagged templates.
- Added `access` utility function to access an object property using an observable.
- Added overload to `conditional` utility function to allow passing arguments as an options object.

## [1.0.0-beta.0] - 2021-05-26
### Removed
- Removed deprecated utils: watchFrom, distinctUntilKeysChanged, gate, mapToLatest, conditionalMapTo, stopPropagation, ternary, filterObject, REF_COUNT.

## [1.0.0-alpha.12] - 2021-05-19
### Removed
- Removed debounce from component child updates to make them synchronous at the cost of efficiency for simultaneous changes in component children.

## [1.0.0-alpha.11] - 2021-05-18
### Changed
- Updated RxJS peer dependency to ^7.0.0.
- Updated ES compilation target to ES2015.
- Updated TypeScript version to ^4.2.4.

### Deprecated
- Deprecated unused or duplicated utility functions: watchFrom, distinctUntilKeysChanged, gate, mapToLatest, conditionalMapTo, stopPropagation, ternary, filterObject.
- Deprecated unused REF_COUNT constant for shareReplay.
