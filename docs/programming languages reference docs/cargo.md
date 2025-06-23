TITLE: Running Cargo Build Command in Rust
DESCRIPTION: The basic syntax for running the cargo build command. This compiles the current package and its dependencies.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/generated_txt/cargo-build.txt#2025-04-21_snippet_0

LANGUAGE: bash
CODE:
```
cargo build [options]
```

----------------------------------------

TITLE: Defining Basic Dependency in Cargo.toml
DESCRIPTION: A simple Cargo.toml manifest showing a dependency on the uuid crate at version 1.0.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/reference/overriding-dependencies.md#2025-04-21_snippet_0

LANGUAGE: toml
CODE:
```
[package]
name = "my-library"
version = "0.1.0"

[dependencies]
uuid = "1.0"
```

----------------------------------------

TITLE: Basic Package Section in Cargo.toml
DESCRIPTION: This snippet shows the minimal required configuration for a Cargo.toml manifest file with the package section. It defines a package named 'hello_world' with version '0.1.0', following semantic versioning principles.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/reference/manifest.md#2025-04-21_snippet_0

LANGUAGE: toml
CODE:
```
[package]
name = "hello_world" # the name of the package
version = "0.1.0"    # the current version, obeying semver
```

----------------------------------------

TITLE: Displaying Help for a Cargo Command
DESCRIPTION: Illustrates how to get help information for a specific Cargo command.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo.md#2025-04-21_snippet_5

LANGUAGE: shell
CODE:
```
cargo help clean
```

----------------------------------------

TITLE: Creating a Binary Cargo Package (Rust/Cargo)
DESCRIPTION: This example demonstrates how to use the 'cargo new' command to create a new binary Cargo package in a specified directory. The command will generate a basic project structure with a Cargo.toml manifest, a sample source file, and a VCS ignore file.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo-new.md#2025-04-21_snippet_0

LANGUAGE: shell
CODE:
```
cargo new foo
```

----------------------------------------

TITLE: Running Cargo Run Command
DESCRIPTION: Demonstrates the basic syntax for running the 'cargo run' command. This command runs the main target of the local package.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo-run.md#2025-04-21_snippet_0

LANGUAGE: shell
CODE:
```
cargo run
```

----------------------------------------

TITLE: Basic Cargo Run Command Syntax
DESCRIPTION: Basic syntax for running cargo run command with optional arguments. Arguments after -- are passed to the binary being run.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-run.md#2025-04-21_snippet_0

LANGUAGE: bash
CODE:
```
cargo run [_options_] [-- _args_]
```

----------------------------------------

TITLE: Building Basic Rust Package
DESCRIPTION: Command to build the local package and all of its dependencies using the default debug settings.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo-build.md#2025-04-21_snippet_0

LANGUAGE: shell
CODE:
```
cargo build
```

----------------------------------------

TITLE: Adding a Single Dependency in Cargo.toml
DESCRIPTION: This snippet demonstrates how to add a single dependency to a Rust project's Cargo.toml file. It shows the correct format for specifying the crate name and version requirement.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/guide/dependencies.md#2025-04-21_snippet_0

LANGUAGE: toml
CODE:
```
[dependencies]
time = "0.1.12"
```

----------------------------------------

TITLE: Specifying a Basic Dependency in Cargo.toml
DESCRIPTION: This snippet shows how to specify a basic dependency on the 'time' crate from crates.io. The version string '0.1.12' represents the version range >=0.1.12, <0.2.0.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/reference/specifying-dependencies.md#2025-04-21_snippet_0

LANGUAGE: toml
CODE:
```
[dependencies]
time = "0.1.12"
```

----------------------------------------

TITLE: Creating a New Cargo Project
DESCRIPTION: This snippet shows how to create a new Cargo project using the 'cargo new' command. It creates a binary program by default, but can be used to create a library with the '--lib' flag.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/getting-started/first-steps.md#2025-04-21_snippet_0

LANGUAGE: console
CODE:
```
$ cargo new hello_world
```

----------------------------------------

TITLE: Configuring GitHub Actions CI for Rust Projects
DESCRIPTION: A GitHub Actions workflow configuration that builds and tests a Rust project across multiple toolchain versions (stable, beta, and nightly). The workflow runs on both push and pull request events and uses Ubuntu as the runner.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/guide/continuous-integration.md#2025-04-21_snippet_0

LANGUAGE: yaml
CODE:
```
name: Cargo Build & Test

on:
  push:
  pull_request:

env: 
  CARGO_TERM_COLOR: always

jobs:
  build_and_test:
    name: Rust project - latest
    runs-on: ubuntu-latest
    strategy:
      matrix:
        toolchain:
          - stable
          - beta
          - nightly
    steps:
      - uses: actions/checkout@v4
      - run: rustup update ${{ matrix.toolchain }} && rustup default ${{ matrix.toolchain }}
      - run: cargo build --verbose
      - run: cargo test --verbose
  
```

----------------------------------------

TITLE: Building with Release Profile in Rust
DESCRIPTION: The -r or --release flag builds optimized artifacts using the release profile. This is an alternative to specifying a profile by name.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-build.md#2025-04-21_snippet_2

LANGUAGE: rust
CODE:
```
cargo build -r
cargo build --release
```

----------------------------------------

TITLE: Installing Rust and Cargo on Linux/macOS using rustup
DESCRIPTION: Command to download and execute the rustup installation script on Linux and macOS systems. This single command will install both Rust and Cargo package manager.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/getting-started/installation.md#2025-04-21_snippet_0

LANGUAGE: console
CODE:
```
curl https://sh.rustup.rs -sSf | sh
```

----------------------------------------

TITLE: Creating a New Rust Executable Package
DESCRIPTION: Command to create a new Rust package that builds an executable application named 'foobar'.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/generated_txt/cargo.txt#2025-04-21_snippet_3

LANGUAGE: bash
CODE:
```
cargo new foobar
```

----------------------------------------

TITLE: Adding a regular dependency with cargo add
DESCRIPTION: Example of how to add the regex crate as a dependency to a Rust project using cargo add command.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-add.md#2025-04-21_snippet_2

LANGUAGE: shell
CODE:
```
cargo add regex
```

----------------------------------------

TITLE: Building Optimized Release
DESCRIPTION: Command to build the package with release optimizations enabled, producing optimized artifacts suitable for deployment.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo-build.md#2025-04-21_snippet_1

LANGUAGE: shell
CODE:
```
cargo build --release
```

----------------------------------------

TITLE: Building a Local Rust Package with Cargo
DESCRIPTION: Basic command to build a local Rust package and all of its dependencies using Cargo.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/generated_txt/cargo.txt#2025-04-21_snippet_0

LANGUAGE: bash
CODE:
```
cargo build
```

----------------------------------------

TITLE: Creating a Binary Cargo Package Example
DESCRIPTION: Example command to create a new binary Cargo package named 'foo' in a new directory. This creates the default project structure with src/main.rs.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-new.md#2025-04-21_snippet_0

LANGUAGE: bash
CODE:
```
cargo new foo
```

----------------------------------------

TITLE: Creating a New Executable Rust Package with Cargo in Bash
DESCRIPTION: Command to create a new Rust package named 'foobar' that is set up to build an executable (binary) application rather than a library.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo.md#2025-04-21_snippet_4

LANGUAGE: bash
CODE:
```
cargo new foobar
```

----------------------------------------

TITLE: Compiling and Running a Rust Project with Cargo Run
DESCRIPTION: This command compiles and runs the Rust project in a single step using 'cargo run'. It shows both compilation and execution output.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/guide/creating-a-new-project.md#2025-04-21_snippet_6

LANGUAGE: console
CODE:
```
$ cargo run
   Compiling hello_world v0.1.0 (file:///path/to/package/hello_world)
     Running `target/debug/hello_world`
Hello, world!
```

----------------------------------------

TITLE: Running All Tests in a Rust Package
DESCRIPTION: This command executes all unit and integration tests in the current Rust package without any filters.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/generated_txt/cargo-test.txt#2025-04-21_snippet_4

LANGUAGE: bash
CODE:
```
cargo test
```

----------------------------------------

TITLE: Creating a Binary Cargo Package
DESCRIPTION: This command creates a new binary Cargo package in the current directory. It initializes a new package with default settings, creating a src/main.rs file if no Rust source files are present.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-init.md#2025-04-21_snippet_0

LANGUAGE: bash
CODE:
```
cargo init
```

----------------------------------------

TITLE: Specifying Dependencies with Version Requirements in TOML
DESCRIPTION: Examples of how to specify dependency version requirements in a Cargo.toml file. It shows different ways to define version constraints and how they affect dependency resolution.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/reference/resolver.md#2025-04-21_snippet_1

LANGUAGE: toml
CODE:
```
[dependencies]
bitflags = "*"

```

LANGUAGE: toml
CODE:
```
[dependencies]
bitflags = "1.0"  # meaning `>=1.0.0,<2.0.0`

```

LANGUAGE: toml
CODE:
```
# Package A
[dependencies]
bitflags = "1.0"  # meaning `>=1.0.0,<2.0.0`

# Package B
[dependencies]
bitflags = "1.1"  # meaning `>=1.1.0,<2.0.0`

```

LANGUAGE: toml
CODE:
```
# Package A
[dependencies]
log = "=0.4.11"

# Package B
[dependencies]
log = "=0.4.8"

```

LANGUAGE: toml
CODE:
```
# Package A
[dependencies]
rand = "0.7"  # meaning `>=0.7.0,<0.8.0`

# Package B
[dependencies]
rand = "0.6"  # meaning `>=0.6.0,<0.7.0`

```

LANGUAGE: toml
CODE:
```
# Package A
[dependencies]
rand = ">=0.6,<0.8.0"

# Package B
[dependencies]
rand = "0.6"  # meaning `>=0.6.0,<0.7.0`

```

----------------------------------------

TITLE: Package Dependency Example
DESCRIPTION: Example showing a package dependency specification in Cargo.toml using a version requirement.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/reference/resolver.md#2025-04-21_snippet_11

LANGUAGE: toml
CODE:
```
# Package A
[dependencies]
rand = "0.7"
```

----------------------------------------

TITLE: Adding Basic Dependency in Cargo
DESCRIPTION: Demonstrates how to add a basic dependency (regex) to a Rust project using Cargo.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/generated_txt/cargo-add.txt#2025-04-21_snippet_1

LANGUAGE: shell
CODE:
```
cargo add regex
```

----------------------------------------

TITLE: Installing a Package from crates.io with Cargo
DESCRIPTION: Command to install or upgrade a package named 'ripgrep' from the crates.io registry.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-install.md#2025-04-21_snippet_4

LANGUAGE: shell
CODE:
```
cargo install ripgrep
```

----------------------------------------

TITLE: Cargo Configuration File Example
DESCRIPTION: Example showing the standard Cargo package manifest filename (Cargo.toml) used for configuration and dependency management. This is part of explaining the naming convention for Cargo's configuration files.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/faq.md#2025-04-21_snippet_0

LANGUAGE: toml
CODE:
```
Cargo.toml
```

----------------------------------------

TITLE: Basic Cargo Build Example
DESCRIPTION: Simple command to build the local package and all of its dependencies
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/generated_txt/cargo-build.txt#2025-04-21_snippet_2

LANGUAGE: shell
CODE:
```
cargo build
```

----------------------------------------

TITLE: Adding Basic Dependency in Rust
DESCRIPTION: Shows how to add the regex crate as a basic dependency to a Rust project.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo-add.md#2025-04-21_snippet_0

LANGUAGE: shell
CODE:
```
cargo add regex
```

----------------------------------------

TITLE: Building a Local Package with Cargo
DESCRIPTION: Demonstrates how to build a local package and all of its dependencies using Cargo.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo.md#2025-04-21_snippet_0

LANGUAGE: shell
CODE:
```
cargo build
```

----------------------------------------

TITLE: Edition Field Configuration in Cargo.toml
DESCRIPTION: This snippet demonstrates how to set the Rust Edition for a package. The edition field affects which Rust Edition your package is compiled with and applies to all targets in the package.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/reference/manifest.md#2025-04-21_snippet_2

LANGUAGE: toml
CODE:
```
[package]
# ...
edition = '2024'
```

----------------------------------------

TITLE: Compiling a Cargo Project
DESCRIPTION: This snippet demonstrates how to compile a Cargo project using the 'cargo build' command. It shows the output of the compilation process.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/getting-started/first-steps.md#2025-04-21_snippet_4

LANGUAGE: console
CODE:
```
$ cargo build
   Compiling hello_world v0.1.0 (file:///path/to/package/hello_world)
```

----------------------------------------

TITLE: Basic Cargo Add Command Syntax
DESCRIPTION: Shows the three main syntax patterns for adding dependencies using cargo-add: basic crate addition, path-based dependency, and git-based dependency.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-add.md#2025-04-21_snippet_0

LANGUAGE: bash
CODE:
```
cargo add [options] crate...
cargo add [options] --path path
cargo add [options] --git url [crate...]
```

----------------------------------------

TITLE: Compiling and Running with Cargo Run
DESCRIPTION: This snippet demonstrates how to use 'cargo run' to compile and run a Cargo project in one step. It shows the output of both the compilation and execution processes.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/getting-started/first-steps.md#2025-04-21_snippet_6

LANGUAGE: console
CODE:
```
$ cargo run
     Fresh hello_world v0.1.0 (file:///path/to/package/hello_world)
   Running `target/hello_world`
Hello, world!
```

----------------------------------------

TITLE: Default Rust Program in main.rs
DESCRIPTION: This snippet shows the default 'Hello, world!' program that Cargo generates in the src/main.rs file. It defines the main function which prints a greeting to the console.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/getting-started/first-steps.md#2025-04-21_snippet_3

LANGUAGE: rust
CODE:
```
fn main() {
    println!("Hello, world!");
}
```

----------------------------------------

TITLE: Creating a New Executable Package
DESCRIPTION: Demonstrates how to create a new package that builds an executable using Cargo.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo.md#2025-04-21_snippet_3

LANGUAGE: shell
CODE:
```
cargo new foobar
```

----------------------------------------

TITLE: Creating a New Binary Package with Cargo
DESCRIPTION: This command creates a new binary package named 'hello_world' using Cargo. It initializes a new git repository by default.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/guide/creating-a-new-project.md#2025-04-21_snippet_0

LANGUAGE: console
CODE:
```
$ cargo new hello_world --bin
```

----------------------------------------

TITLE: Feature-Based Dependencies Configuration
DESCRIPTION: Example of configuring optional dependencies and features in Cargo.toml.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/reference/specifying-dependencies.md#2025-04-21_snippet_9

LANGUAGE: toml
CODE:
```
[dependencies]
foo = { version = "1.0", optional = true }
bar = { version = "1.0", optional = true }

[features]
fancy-feature = ["foo", "bar"]
```

----------------------------------------

TITLE: Basic Cargo Build Command Syntax in Rust
DESCRIPTION: The basic syntax for the cargo build command, used to compile local packages and their dependencies in Rust projects.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-build.md#2025-04-21_snippet_0

LANGUAGE: bash
CODE:
```
cargo build [_options_]
```

----------------------------------------

TITLE: Running Cargo with Default Settings
DESCRIPTION: This command builds the local package and runs its main target, assuming only one binary is present.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-run.md#2025-04-21_snippet_8

LANGUAGE: bash
CODE:
```
cargo run
```

----------------------------------------

TITLE: Initializing a Package in the Current Directory
DESCRIPTION: Shows how to create a new Cargo package in the current directory.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo.md#2025-04-21_snippet_4

LANGUAGE: shell
CODE:
```
mkdir foo && cd foo
cargo init .
```

----------------------------------------

TITLE: Creating a Binary Cargo Package with cargo init
DESCRIPTION: This example demonstrates how to create a binary Cargo package in the current directory using the cargo init command. This will generate a new Cargo manifest and, if needed, a sample src/main.rs file.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/generated_txt/cargo-init.txt#2025-04-21_snippet_0

LANGUAGE: bash
CODE:
```
cargo init
```

----------------------------------------

TITLE: Getting Help with Cargo Commands
DESCRIPTION: The -h or --help flags display help information for the Cargo command.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-yank.md#2025-04-21_snippet_5

LANGUAGE: shell
CODE:
```
-h
```

LANGUAGE: shell
CODE:
```
--help
```

----------------------------------------

TITLE: Using the cargo-remove Command
DESCRIPTION: The basic command syntax for removing dependencies from a Cargo.toml manifest file. The command can take one or more dependency names as arguments.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-remove.md#2025-04-21_snippet_0

LANGUAGE: bash
CODE:
```
cargo remove [_options_] _dependency_...
```

----------------------------------------

TITLE: Updating All Dependencies with Cargo in Rust
DESCRIPTION: This command updates all dependencies in the Cargo.lock file to their latest compatible versions based on the specifications in Cargo.toml.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-update.md#2025-04-21_snippet_5

LANGUAGE: bash
CODE:
```
cargo update
```

----------------------------------------

TITLE: Building a Release-Optimized Package with Cargo in Bash
DESCRIPTION: Command to build a Rust package with optimizations enabled using the release profile, resulting in faster executables at the cost of longer compilation time.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo.md#2025-04-21_snippet_2

LANGUAGE: bash
CODE:
```
cargo build --release
```

----------------------------------------

TITLE: Adding Multiple Dependencies in Cargo.toml
DESCRIPTION: This example shows how to add multiple dependencies to a Cargo.toml file, including the package metadata. It demonstrates the correct structure for specifying multiple crates and their version requirements.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/guide/dependencies.md#2025-04-21_snippet_1

LANGUAGE: toml
CODE:
```
[package]
name = "hello_world"
version = "0.1.0"
edition = "2024"

[dependencies]
time = "0.1.12"
regex = "0.1.41"
```

----------------------------------------

TITLE: Building a Local Package with Cargo in Bash
DESCRIPTION: Simple command to build a local Rust package and all of its dependencies using the default debug profile.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo.md#2025-04-21_snippet_1

LANGUAGE: bash
CODE:
```
cargo build
```

----------------------------------------

TITLE: Command Syntax for Cargo Add
DESCRIPTION: Basic syntax patterns for using the cargo add command to add dependencies to a Cargo.toml file. Shows three main usage patterns: adding from registry, from path, and from git repository.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/generated_txt/cargo-add.txt#2025-04-21_snippet_0

LANGUAGE: shell
CODE:
```
cargo add [options] crate…
cargo add [options] --path path
cargo add [options] --git url [crate…]
```

----------------------------------------

TITLE: Using Toolchain Override in Cargo
DESCRIPTION: Example of using +toolchain prefix with cargo to specify a specific Rust toolchain like stable or nightly.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-package.md#2025-04-21_snippet_5

LANGUAGE: shell
CODE:
```
+stable
```

----------------------------------------

TITLE: Default Main Function in Rust
DESCRIPTION: This is the default main.rs file generated by Cargo for a new Rust project. It contains a simple 'Hello, world!' program.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/guide/creating-a-new-project.md#2025-04-21_snippet_3

LANGUAGE: rust
CODE:
```
fn main() {
    println!("Hello, world!");
}
```

----------------------------------------

TITLE: Major: Adding a private field to a struct with all public fields in Rust
DESCRIPTION: Demonstrates how adding a private field to a struct that previously had all public fields breaks code that constructs the struct using struct literals. The mitigation is to use #[non_exhaustive] or provide constructors.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/reference/semver.md#2025-04-21_snippet_20

LANGUAGE: rust
CODE:
```
// MAJOR CHANGE

///////////////////////////////////////////////////////////
// Before
pub struct Foo {
    pub f1: i32,
}

///////////////////////////////////////////////////////////
// After
pub struct Foo {
    pub f1: i32,
    f2: i32,
}

///////////////////////////////////////////////////////////
// Example usage that will break.
fn main() {
    let x = updated_crate::Foo { f1: 123 }; // Error: cannot construct `Foo`
}
```

----------------------------------------

TITLE: Basic Usage of cargo-remove Command for Standard Dependencies
DESCRIPTION: A simple example showing how to remove a regular dependency from a Cargo.toml manifest file.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/generated_txt/cargo-remove.txt#2025-04-21_snippet_0

LANGUAGE: shell
CODE:
```
cargo remove regex
```

----------------------------------------

TITLE: Adding Dependencies with Features in Rust
DESCRIPTION: Demonstrates adding serde and serde_json with the derive feature enabled for JSON serialization support.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo-add.md#2025-04-21_snippet_3

LANGUAGE: shell
CODE:
```
cargo add serde serde_json -F serde/derive
```

----------------------------------------

TITLE: Cargo Package Command List
DESCRIPTION: List of core Cargo package management commands with documentation links. Includes commands for project initialization, package installation, project creation, package search, and uninstallation.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/package-commands.md#2025-04-21_snippet_0

LANGUAGE: markdown
CODE:
```
# Package Commands
* [cargo init](cargo-init.md)
* [cargo install](cargo-install.md)
* [cargo new](cargo-new.md)
* [cargo search](cargo-search.md)
* [cargo uninstall](cargo-uninstall.md)
```

----------------------------------------

TITLE: Breaking Change: Removing Public Items in Rust
DESCRIPTION: Demonstrates how removing a public function is a major breaking change that will cause compilation failures in dependent code. This example shows why removing public items requires a major version bump.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/reference/semver.md#2025-04-21_snippet_0

LANGUAGE: rust
CODE:
```
// Before
pub fn foo() {}

// After
// ... item has been removed

// Example usage that will break.
fn main() {
    updated_crate::foo(); // Error: cannot find function `foo`
}
```

----------------------------------------

TITLE: Illustrating Cargo Package Directory Structure
DESCRIPTION: This snippet shows the typical directory and file layout for a Cargo package. It includes the main configuration files, source code directory, and directories for tests, benchmarks, and examples.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/guide/project-layout.md#2025-04-21_snippet_0

LANGUAGE: text
CODE:
```
.
├── Cargo.lock
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── main.rs
│   └── bin/
│       ├── named-executable.rs
│       ├── another-executable.rs
│       └── multi-file-executable/
│           ├── main.rs
│           └── some_module.rs
├── benches/
│   ├── large-input.rs
│   └── multi-file-bench/
│       ├── main.rs
│       └── bench_module.rs
├── examples/
│   ├── simple.rs
│   └── multi-file-example/
│       ├── main.rs
│       └── ex_module.rs
└── tests/
    ├── some-integration-tests.rs
    └── multi-file-test/
        ├── main.rs
        └── test_module.rs
```

----------------------------------------

TITLE: Filtering Tests by Name
DESCRIPTION: Example of running only tests whose names match a specific filter string, useful for focusing on a subset of tests.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo-test.md#2025-04-21_snippet_5

LANGUAGE: bash
CODE:
```
cargo test name_filter
```

----------------------------------------

TITLE: Building with Optimizations in Cargo (Rust)
DESCRIPTION: Builds the package and all of its dependencies with optimizations enabled.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-build.md#2025-04-21_snippet_22

LANGUAGE: rust
CODE:
```
cargo build --release
```

----------------------------------------

TITLE: Specifying Library Target Option in Cargo New Command
DESCRIPTION: The --lib option creates a package with a library target (src/lib.rs) when using the 'cargo new' command.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/includes/options-new.md#2025-04-21_snippet_1

LANGUAGE: rust
CODE:
```
--lib
```

----------------------------------------

TITLE: Displaying Help Information for Cargo Commands in Bash
DESCRIPTION: Command to display help information about a specific Cargo subcommand, in this case 'clean', which shows usage details and available options.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo.md#2025-04-21_snippet_6

LANGUAGE: bash
CODE:
```
cargo help clean
```

----------------------------------------

TITLE: Adding a development dependency with cargo add
DESCRIPTION: Example of how to add the trybuild crate as a development dependency to a Rust project, which will only be used during development/testing.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-add.md#2025-04-21_snippet_3

LANGUAGE: shell
CODE:
```
cargo add --dev trybuild
```

----------------------------------------

TITLE: Running Cargo Test with Filtering and Thread Control
DESCRIPTION: Example of using cargo test with filter and thread count arguments. This command filters tests with 'foo' in their name and runs them on 3 threads in parallel.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-test.md#2025-04-21_snippet_0

LANGUAGE: shell
CODE:
```
cargo test foo -- --test-threads 3
```

----------------------------------------

TITLE: Running Cargo Run with Example and Arguments
DESCRIPTION: Shows how to run a specific example with additional arguments using the 'cargo run' command. The '--example' flag specifies the example to run, and arguments after '--' are passed to the example.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo-run.md#2025-04-21_snippet_1

LANGUAGE: shell
CODE:
```
cargo run --example exname -- --exoption exarg1 exarg2
```

----------------------------------------

TITLE: Basic cargo fix example
DESCRIPTION: Example of applying compiler suggestions to the local package.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo-fix.md#2025-04-21_snippet_3

LANGUAGE: bash
CODE:
```
cargo fix
```

----------------------------------------

TITLE: Patching Dependency with Git Repository in Cargo.toml
DESCRIPTION: Cargo.toml configuration showing how to override a dependency with a git repository after submitting a pull request.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/reference/overriding-dependencies.md#2025-04-21_snippet_4

LANGUAGE: toml
CODE:
```
[patch.crates-io]
uuid = { git = 'https://github.com/uuid-rs/uuid.git' }
```

----------------------------------------

TITLE: Example Cargo.toml Manifest File
DESCRIPTION: This is the default Cargo.toml file generated for a new Rust project. It contains metadata about the package including name, version, and Rust edition.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/guide/creating-a-new-project.md#2025-04-21_snippet_2

LANGUAGE: toml
CODE:
```
[package]
name = "hello_world"
version = "0.1.0"
edition = "2024"

[dependencies]
```

----------------------------------------

TITLE: Displaying Cargo Version
DESCRIPTION: Command to display the current version of Cargo. This is the primary way to check which version of Cargo is installed.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/generated_txt/cargo-version.txt#2025-04-21_snippet_0

LANGUAGE: bash
CODE:
```
cargo version
```

----------------------------------------

TITLE: Basic Cargo Update Command
DESCRIPTION: Updates all dependencies in the Cargo.lock file to their latest versions.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/generated_txt/cargo-update.txt#2025-04-21_snippet_0

LANGUAGE: shell
CODE:
```
cargo update
```

----------------------------------------

TITLE: Updating Specific Dependencies with Cargo in Rust
DESCRIPTION: This command updates only the specified dependencies (foo and bar) to their latest compatible versions while leaving other dependencies unchanged.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-update.md#2025-04-21_snippet_6

LANGUAGE: bash
CODE:
```
cargo update foo bar
```

----------------------------------------

TITLE: Cargo Install Command Synopsis
DESCRIPTION: Shows the different ways to invoke the cargo install command, including installing from crates.io, local path, git repository, or listing installed crates.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-install.md#2025-04-21_snippet_0

LANGUAGE: shell
CODE:
```
cargo install [options] crate[@version]...
cargo install [options] --path path
cargo install [options] --git url [crate...]
cargo install [options] --list
```

----------------------------------------

TITLE: Implementing Optional std Support in Rust
DESCRIPTION: Example showing how to properly implement optional standard library support using features. Uses cfg attributes to conditionally include std-dependent code.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/reference/features.md#2025-04-21_snippet_10

LANGUAGE: rust
CODE:
```
#![no_std]

#[cfg(feature = "std")]
extern crate std;

#[cfg(feature = "std")]
pub fn function_that_requires_std() {
    // ...
}
```

----------------------------------------

TITLE: Using Locked Mode in Cargo Build (Rust)
DESCRIPTION: Asserts that the exact same dependencies and versions are used as when the existing Cargo.lock file was originally generated. Useful for deterministic builds in CI pipelines.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-build.md#2025-04-21_snippet_13

LANGUAGE: rust
CODE:
```
cargo build --locked
```

----------------------------------------

TITLE: Defining Basic Features in Cargo.toml
DESCRIPTION: Demonstrates how to define a simple feature named 'webp' in the [features] section of Cargo.toml. This feature can be used for conditional compilation of WebP image support.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/reference/features.md#2025-04-21_snippet_0

LANGUAGE: toml
CODE:
```
[features]
# Defines a feature named `webp` that does not enable any other features.
webp = []
```

----------------------------------------

TITLE: Configuring GitLab CI for Rust Projects
DESCRIPTION: A GitLab CI configuration that builds and tests a Rust project using both stable and nightly Rust channels. The nightly build is allowed to fail without causing the entire pipeline to fail.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/guide/continuous-integration.md#2025-04-21_snippet_1

LANGUAGE: yaml
CODE:
```
stages:
  - build

rust-latest:
  stage: build
  image: rust:latest
  script:
    - cargo build --verbose
    - cargo test --verbose

rust-nightly:
  stage: build
  image: rustlang/rust:nightly
  script:
    - cargo build --verbose
    - cargo test --verbose
  allow_failure: true
```

----------------------------------------

TITLE: Building a Package with Optimizations
DESCRIPTION: Shows how to build a package with optimizations enabled using the --release flag.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo.md#2025-04-21_snippet_1

LANGUAGE: shell
CODE:
```
cargo build --release
```

----------------------------------------

TITLE: Examining Cargo.toml Manifest File
DESCRIPTION: This snippet shows the contents of a default Cargo.toml file. It includes metadata such as package name, version, and Rust edition, as well as a section for dependencies.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/getting-started/first-steps.md#2025-04-21_snippet_2

LANGUAGE: toml
CODE:
```
[package]
name = "hello_world"
version = "0.1.0"
edition = "2024"

[dependencies]
```

----------------------------------------

TITLE: Logging in to Default Registry
DESCRIPTION: Example showing how to save an authentication token for the default registry (typically crates.io).
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo-login.md#2025-04-21_snippet_1

LANGUAGE: bash
CODE:
```
cargo login
```

----------------------------------------

TITLE: Building a Rust Package with Release Optimizations
DESCRIPTION: Command to build a Rust package with optimizations enabled for release builds.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/generated_txt/cargo.txt#2025-04-21_snippet_1

LANGUAGE: bash
CODE:
```
cargo build --release
```

----------------------------------------

TITLE: Applying Compiler Suggestions with cargo fix
DESCRIPTION: Shows how to use the basic cargo fix command to apply compiler-suggested fixes to the local Rust package.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/generated_txt/cargo-fix.txt#2025-04-21_snippet_4

LANGUAGE: shell
CODE:
```
cargo fix
```

----------------------------------------

TITLE: Initializing a Cargo Package in Current Directory in Bash
DESCRIPTION: Commands to create a directory, navigate to it, and initialize a new Cargo package in that location. This creates a Cargo.toml file and other basic project structures.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo.md#2025-04-21_snippet_5

LANGUAGE: bash
CODE:
```
mkdir foo && cd foo
cargo init .
```

----------------------------------------

TITLE: Basic Test Execution
DESCRIPTION: Example of running all unit and integration tests in the current package
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-test.md#2025-04-21_snippet_5

LANGUAGE: bash
CODE:
```
cargo test
```

----------------------------------------

TITLE: Example Custom Build Script in Rust
DESCRIPTION: This snippet demonstrates a basic build script that tells Cargo to rerun if a specific file changes and uses the cc crate to build and statically link a C file.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/reference/build-scripts.md#2025-04-21_snippet_0

LANGUAGE: rust
CODE:
```
fn main() {
    // Tell Cargo that if the given file changes, to rerun this build script.
    println!("cargo::rerun-if-changed=src/hello.c");
    // Use the `cc` crate to build a C file and statically link it.
    cc::Build::new()
        .file("src/hello.c")
        .compile("hello");
}
```

----------------------------------------

TITLE: Removing a Regular Dependency with Cargo
DESCRIPTION: Example command showing how to remove 'regex' as a regular dependency from a Cargo.toml manifest file.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo-remove.md#2025-04-21_snippet_0

LANGUAGE: bash
CODE:
```
cargo remove regex
```

----------------------------------------

TITLE: Removing Basic Dependency with Cargo
DESCRIPTION: Shows how to remove a regular dependency (regex) from a Rust project using cargo remove
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo-remove.md#2025-04-21_snippet_1

LANGUAGE: shell
CODE:
```
cargo remove regex
```

----------------------------------------

TITLE: Displaying Cargo Command Syntax in Markdown
DESCRIPTION: Shows the various ways to invoke the Cargo command, including options, subcommands, and special flags.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/commands/cargo.md#2025-04-21_snippet_0

LANGUAGE: markdown
CODE:
```
`cargo` [_options_] _command_ [_args_]\n`cargo` [_options_] `--version`\n`cargo` [_options_] `--list`\n`cargo` [_options_] `--help`\n`cargo` [_options_] `--explain` _code_
```

----------------------------------------

TITLE: Publishing a Cargo Package Example
DESCRIPTION: A simple example showing how to publish the current package to a registry using cargo publish command.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo-publish.md#2025-04-21_snippet_0

LANGUAGE: bash
CODE:
```
cargo publish
```

----------------------------------------

TITLE: Running a Specific Test within an Integration Test Module
DESCRIPTION: Example showing how to run a single test function within a specific integration test module, providing precise test selection.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo-test.md#2025-04-21_snippet_6

LANGUAGE: bash
CODE:
```
cargo test --test int_test_name -- modname::test_name
```

----------------------------------------

TITLE: Getting Help for a Cargo Command using the help Subcommand
DESCRIPTION: Shows how to use the 'cargo help' subcommand to get documentation for a specific Cargo command, in this case the 'build' command.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/man/cargo-help.md#2025-04-21_snippet_0

LANGUAGE: bash
CODE:
```
cargo help build
```

----------------------------------------

TITLE: Declaring Optional Dependencies in Cargo.toml
DESCRIPTION: Demonstrates how to declare an optional dependency. The 'gif' package is marked as optional, which implicitly creates a feature of the same name.
SOURCE: https://github.com/rust-lang/cargo.git/blob/master/src/doc/src/reference/features.md#2025-04-21_snippet_4

LANGUAGE: toml
CODE:
```
[dependencies]
gif = { version = "0.11.1", optional = true }
```