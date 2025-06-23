TITLE: Defining Main Function for Rust Binary Crate
DESCRIPTION: This snippet demonstrates how to define the `main` function, which serves as the entry point for a Rust binary executable. It includes a basic `println!` macro call to output 'Hello world!'. This function is essential for a binary crate to compile and run successfully.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0601.md#_snippet_0

LANGUAGE: Rust
CODE:
```
fn main() {
    // Your program will start here.
    println!("Hello world!");
}
```

----------------------------------------

TITLE: Defining a Basic Hello World Program (Rust)
DESCRIPTION: This Rust code defines a simple `main` function, which serves as the entry point for an executable program. Inside `main`, the `println!` macro is used to print the string "Hello, world!" to the standard output, illustrating fundamental Rust syntax for console output.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/doc/rustc/src/what-is-rustc.md#_snippet_1

LANGUAGE: rust
CODE:
```
fn main() {
    println!("Hello, world!");
}
```

----------------------------------------

TITLE: Illustrating Missing Trait Bound in Generic Rust Function
DESCRIPTION: This example shows the E0277 error in a generic function context. The `println!("{:?}", foo)` call requires `T` to implement `fmt::Debug`, but the generic function `some_func<T>` does not specify this trait bound, leading to a compile error even if `main` calls it with a `Debug` implementing type.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0277.md#_snippet_2

LANGUAGE: Rust
CODE:
```
fn some_func<T>(foo: T) {
    println!("{:?}", foo); // error: the trait `core::fmt::Debug` is not
                           //        implemented for the type `T`
}

fn main() {
    some_func(5i32);
}
```

----------------------------------------

TITLE: Recommended Structure for Rust Item Documentation
DESCRIPTION: This snippet outlines the recommended basic structure for documenting individual public API items in Rust, such as modules, structs, functions, or macros. It suggests starting with a short summary, followed by a detailed explanation, at least one copy-pasteable code example, and optionally more advanced explanations.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/doc/rustdoc/src/how-to-write-documentation.md#_snippet_1

LANGUAGE: text
CODE:
```
[short sentence explaining what it is]

[more detailed explanation]

[at least one code example that users can copy/paste to try it]

[even more advanced explanations if necessary]
```

----------------------------------------

TITLE: Rust Solution: Using Arc for Reference-Counted Shared Ownership
DESCRIPTION: For scenarios like threading where a value needs to be shared and moved across thread boundaries, `Arc` (Atomic Reference Counted) provides a solution. It allows multiple owners of a value, enabling `fancy_ref1` to be moved into a new thread while `fancy_ref2` retains access in the main thread.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0504.md#_snippet_3

LANGUAGE: Rust
CODE:
```
use std::sync::Arc;
use std::thread;

struct FancyNum {
    num: u8,
}

fn main() {
    let fancy_ref1 = Arc::new(FancyNum { num: 5 });
    let fancy_ref2 = fancy_ref1.clone();

    let x = thread::spawn(move || {
        // `fancy_ref1` can be moved and has a `'static` lifetime
        println!("child thread: {}", fancy_ref1.num);
    });

    x.join().expect("child thread should finish");
    println!("main thread: {}", fancy_ref2.num);
}
```

----------------------------------------

TITLE: Implementing Trait to Resolve E0277 Error in Rust
DESCRIPTION: This snippet provides the fix for the E0277 error by implementing the `Foo` trait for the `i32` type. This allows `some_func` to be called with an `i32` value, as `i32` now satisfies the `Foo` trait bound, resolving the compilation error.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0277.md#_snippet_1

LANGUAGE: Rust
CODE:
```
trait Foo {
    fn bar(&self);
}

// we implement the trait on the i32 type
impl Foo for i32 {
    fn bar(&self) {}
}

fn some_func<T: Foo>(foo: T) {
    foo.bar(); // we can now use this method since i32 implements the
               // Foo trait
}

fn main() {
    some_func(5i32); // ok!
}
```

----------------------------------------

TITLE: Creating a New Rust Project (Shell)
DESCRIPTION: These shell commands demonstrate how to create a new Rust project named 'hello_world' using Cargo, Rust's package manager, and then navigate into the newly created project directory.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/doc/rustc/src/platform-support/armv7-unknown-linux-uclibceabihf.md#_snippet_2

LANGUAGE: Shell
CODE:
```
cargo new hello_world
cd hello_world
```

----------------------------------------

TITLE: Compiling Rust for a Specific Target Architecture (Bash)
DESCRIPTION: This command demonstrates how to compile a Rust source file (`src/main.rs`) for a specific target architecture (`wasm32-unknown-unknown`) using the `rustc` compiler. The `--target` flag is used to specify the desired compilation target, enabling cross-compilation for environments like WebAssembly.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/doc/rustc/src/targets/index.md#_snippet_0

LANGUAGE: Bash
CODE:
```
rustc src/main.rs --target=wasm32-unknown-unknown
```

----------------------------------------

TITLE: Defining a Basic Rust Test Function
DESCRIPTION: This snippet illustrates how to define a basic test function in Rust using the `#[test]` attribute. The `assert_eq!` macro is used to verify an expected outcome, causing the test to pass if the assertion holds true, or fail if it panics or returns a non-zero `Result` value.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/doc/rustc/src/tests/index.md#_snippet_0

LANGUAGE: Rust
CODE:
```
#[test]
fn it_works() {
    assert_eq!(2 + 2, 4);
}
```

----------------------------------------

TITLE: Demonstrating Rust Move Semantics (Compile Fail)
DESCRIPTION: This snippet illustrates the E0382 compile error, which occurs when a variable is used after its contents have been moved. Since `MyStruct` is not marked `Copy`, assigning `x` to `y` moves the data out of `x`, making subsequent access to `x.s` invalid.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0382.md#_snippet_0

LANGUAGE: Rust
CODE:
```
struct MyStruct { s: u32 }

fn main() {
    let mut x = MyStruct{ s: 5u32 };
    let y = x;
    x.s = 6;
    println!("{}", x.s);
}
```

----------------------------------------

TITLE: Defining a Public Function in Rust
DESCRIPTION: This snippet defines a simple public function `a_func` within a Rust library file. This function serves as an item that Rustdoc can document and for which it can scrape usage examples.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/librustdoc/html/static/scrape-examples-help.md#_snippet_0

LANGUAGE: Rust
CODE:
```
// src/lib.rs
pub fn a_func() {}
```

----------------------------------------

TITLE: Defining a Public Function in Rust
DESCRIPTION: This snippet defines a public function named `foo` in Rust. It takes no arguments and prints the string 'foo' to the standard output using the `println!` macro. This demonstrates basic function declaration and console interaction in Rust.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/librustdoc/html/highlight/fixtures/dos_line.html#_snippet_0

LANGUAGE: Rust
CODE:
```
pub fn foo() { println!("foo"); }
```

----------------------------------------

TITLE: Compiling and Running a Single Rust File (Bash)
DESCRIPTION: These commands illustrate the process of compiling a single Rust source file (`hello.rs`) into an executable using `rustc`. Subsequently, they show how to execute the generated binary on both *NIX-like systems (`./hello`) and Windows (`.\hello.exe`), demonstrating the basic workflow from source to runnable program.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/doc/rustc/src/what-is-rustc.md#_snippet_2

LANGUAGE: bash
CODE:
```
$ rustc hello.rs
$ ./hello # on a *NIX
$ .\hello.exe # on Windows
```

----------------------------------------

TITLE: Handling Refutable Patterns with Match and If Let in Rust
DESCRIPTION: This example provides two idiomatic Rust solutions for safely handling refutable patterns. It demonstrates using a `match` expression to explicitly cover both `Some(y)` and `None` cases, and an `if let` expression for concisely handling only the `Some(y)` case when the `None` case can be ignored, preventing the E0005 error.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0005.md#_snippet_1

LANGUAGE: Rust
CODE:
```
let x = Some(1);

match x {
    Some(y) => {
        // do something
    },
    None => {}
}

// or:

if let Some(y) = x {
    // do something
}
```

----------------------------------------

TITLE: Fixing E0451 with a Public Constructor Method in Rust
DESCRIPTION: This snippet provides an alternative solution to the E0451 error by implementing a public constructor method (`new()`) for the `Foo` struct. This allows the `b` field to remain private while still enabling external instantiation of `Foo` through `bar::Foo::new()`, encapsulating the private field's initialization.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0451.md#_snippet_2

LANGUAGE: Rust
CODE:
```
mod bar {
    pub struct Foo {
        pub a: isize,
        b: isize, // still private
    }

    impl Foo {
        pub fn new() -> Foo { // we create a method to instantiate `Foo`
            Foo { a: 0, b: 0 }
        }
    }
}

let f = bar::Foo::new(); // ok!
```

----------------------------------------

TITLE: Creating a New Rust Project (Shell)
DESCRIPTION: These shell commands demonstrate how to create a new Rust project named 'hello_world' using Cargo and then navigate into its newly created directory. This is a prerequisite step before building and running a Rust application for the C-SKY target.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/doc/rustc/src/platform-support/csky-unknown-linux-gnuabiv2.md#_snippet_2

LANGUAGE: sh
CODE:
```
cargo new hello_world
cd hello_world
```

----------------------------------------

TITLE: Correct `derive` Usage on Rust Struct
DESCRIPTION: This snippet illustrates the correct usage of the `derive` attribute applied to a Rust struct. The `derive` attribute is designed to automatically implement traits like `Clone` for structs, unions, and enums, enabling boilerplate reduction and proper trait implementation.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0774.md#_snippet_1

LANGUAGE: Rust
CODE:
```
#[derive(Clone)] // ok!
struct Bar {
    field: u32,
}
```

----------------------------------------

TITLE: Correct Assignment to Mutable Variable in Rust
DESCRIPTION: This Rust code snippet illustrates the correct way to perform an assignment. A mutable variable `x` of type `i8` is declared and initialized. The `+=` operator then successfully modifies the value of `x`, as `x` is a valid 'place expression' for assignment.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0067.md#_snippet_1

LANGUAGE: Rust
CODE:
```
let mut x: i8 = 12;
x += 1; // ok!
```

----------------------------------------

TITLE: Creating a New Rust Crate (Bash)
DESCRIPTION: This command initializes a new Rust project named `hellosimd`. It sets up the basic directory structure and `Cargo.toml` file, preparing the environment for a new application.
SOURCE: https://github.com/rust-lang/rust/blob/master/library/portable-simd/README.md#_snippet_1

LANGUAGE: bash
CODE:
```
cargo new hellosimd
```

----------------------------------------

TITLE: Correcting a Recursive Struct Definition with Box in Rust
DESCRIPTION: This snippet shows the corrected definition of the `ListNode` struct. By wrapping the recursive `ListNode` in a `Box` within the `tail` field, the type gains a well-defined size. `Box` acts as a pointer, ensuring that the size of the `ListNode` itself is not directly part of the `ListNode`'s size calculation, thus resolving the E0072 error.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0072.md#_snippet_1

LANGUAGE: Rust
CODE:
```
struct ListNode {
    head: u8,
    tail: Option<Box<ListNode>>,
}
```

----------------------------------------

TITLE: Defining a Public Function in a Sub-module (Rust)
DESCRIPTION: This Rust code defines a public function `hello()` within a `foo.rs` file, intended to be part of a larger crate. The `pub` keyword makes the function accessible from other modules, and it simply prints "Hello, world!", illustrating basic function definition and module structure for inter-module communication.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/doc/rustc/src/what-is-rustc.md#_snippet_4

LANGUAGE: rust
CODE:
```
pub fn hello() {
    println!("Hello, world!");
}
```

----------------------------------------

TITLE: Illustrating E0317 Error: Missing Else in Rust If Expression
DESCRIPTION: This Rust code snippet demonstrates the `E0317` compile-time error. The `if` expression lacks an `else` block, causing it to implicitly return `()` (unit type) if the condition is false. When assigned to `a`, which expects an `i32`, this results in a type mismatch error because a non-unit type is expected.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0317.md#_snippet_0

LANGUAGE: Rust
CODE:
```
let x = 5;
let a = if x == 5 {
    1
};
```

----------------------------------------

TITLE: Update Rust Toolchain to Nightly
DESCRIPTION: This command uses `rustup` to update the installed Rust toolchain to the latest nightly build. It's essential for developers who need access to the newest features or bug fixes.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/tools/rust-analyzer/xtask/test_data/input.adoc#_snippet_1

LANGUAGE: bash
CODE:
```
rustup update nightly
```

----------------------------------------

TITLE: Defining a Generic Rust Function with Trait Bound
DESCRIPTION: This snippet defines a public Rust function named `charlie` that is generic over a type `C`. It specifies a trait bound, meaning `C` must implement `MyTrait`. This pattern is common for creating flexible functions that operate on various types as long as they provide specific behavior defined by the trait.
SOURCE: https://github.com/rust-lang/rust/blob/master/tests/rustdoc/where.charlie_fn_decl.html#_snippet_0

LANGUAGE: Rust
CODE:
```
pub fn charlie<C>()  where C: [MyTrait](trait.MyTrait.html "trait foo::MyTrait"),  
```

----------------------------------------

TITLE: Demonstrating Non-Exhaustive Match Patterns in Rust
DESCRIPTION: This Rust code snippet illustrates the E0004 compiler error, showing a `match` expression that fails to cover all variants of the `Terminator` enum. The compiler reports a 'non-exhaustive patterns' error because `Terminator::HastaLaVistaBaby` is not explicitly handled, preventing a guaranteed match.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0004.md#_snippet_0

LANGUAGE: Rust
CODE:
```
enum Terminator {
    HastaLaVistaBaby,
    TalkToMyHand,
}

let x = Terminator::HastaLaVistaBaby;

match x { // error: non-exhaustive patterns: `HastaLaVistaBaby` not covered
    Terminator::TalkToMyHand => {}
}
```

----------------------------------------

TITLE: Borrowing Values with References in Rust
DESCRIPTION: This example demonstrates how to use immutable references (`&`) to allow a function to 'borrow' a value without taking ownership. This prevents the value from being moved, allowing the original variable (`s1`) to remain valid after the function call.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0382.md#_snippet_1

LANGUAGE: Rust
CODE:
```
fn main() {
    let s1 = String::from("hello");

    let len = calculate_length(&s1);

    println!("The length of '{}' is {}.", s1, len);
}

fn calculate_length(s: &String) -> usize {
    s.len()
}
```

----------------------------------------

TITLE: Running Clippy as Cargo Subcommand
DESCRIPTION: This command executes Clippy on the current Rust project, performing lint checks and reporting potential issues. It runs Clippy as a cargo subcommand, integrating it into the standard Rust build process.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/tools/clippy/README.md#_snippet_2

LANGUAGE: terminal
CODE:
```
cargo clippy
```

----------------------------------------

TITLE: Installing rustfmt on Stable Toolchain (Shell)
DESCRIPTION: This command adds the `rustfmt` component to your stable Rust toolchain using `rustup`. It makes the `rustfmt` binary and `cargo fmt` subcommand available for use with your stable Rust installations.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/tools/rustfmt/README.md#_snippet_0

LANGUAGE: sh
CODE:
```
rustup component add rustfmt
```

----------------------------------------

TITLE: Demonstrating E0308 Compiler Errors in Rust
DESCRIPTION: This snippet showcases multiple instances of the E0308 compiler error in Rust, illustrating common type mismatches. It includes an intrinsic function with an incorrect return type, a `main` function with an invalid signature, a `match` expression with a range pattern containing a mismatched type, and an `impl` block using an unsupported explicit `self` parameter type.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0211.md#_snippet_0

LANGUAGE: Rust
CODE:
```
#![feature(intrinsics)]
#![allow(internal_features)]

#[rustc_intrinsic]
unsafe fn unreachable(); // error: intrinsic has wrong type

// or:

fn main() -> i32 { 0 }
// error: main function expects type: `fn() {main}`: expected (), found i32

// or:

let x = 1u8;
match x {
    0u8..=3i8 => (),
    // error: mismatched types in range: expected u8, found i8
    _ => ()
}

// or:

use std::rc::Rc;
struct Foo;

impl Foo {
    fn x(self: Rc<Foo>) {}
    // error: mismatched self type: expected `Foo`: expected struct
    //        `Foo`, found struct `alloc::rc::Rc`
}
```

----------------------------------------

TITLE: Defining a Trait in Rust
DESCRIPTION: This snippet defines a trait named `Bar` with a single associated function `bar`. Traits define shared behavior that types can implement, similar to interfaces in other languages.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/tools/rust-analyzer/crates/ide/src/syntax_highlighting/test_data/highlight_general.html#_snippet_2

LANGUAGE: Rust
CODE:
```
trait Bar {
    fn bar(&self) -> i32;
}
```

----------------------------------------

TITLE: Demonstrating E0070 Error in Rust Assignments
DESCRIPTION: This snippet illustrates common scenarios that trigger the Rust E0070 error. It shows attempts to assign values to a constant, a literal, a function call, and a struct's type-level field, none of which are valid 'place expressions' for assignment.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0070.md#_snippet_0

LANGUAGE: Rust
CODE:
```
struct SomeStruct {
    x: i32,
    y: i32,
}

const SOME_CONST: i32 = 12;

fn some_other_func() {}

fn some_function() {
    SOME_CONST = 14; // error: a constant value cannot be changed!
    1 = 3; // error: 1 isn't a valid place!
    some_other_func() = 4; // error: we cannot assign value to a function!
    SomeStruct::x = 12; // error: SomeStruct a structure name but it is used
                        //        like a variable!
}
```

----------------------------------------

TITLE: Defining a Generic Function with a Trait Bound - Rust
DESCRIPTION: This snippet defines a generic function `foo` that requires its type parameter `T` to implement the `Default` trait. This bound ensures that `T` can be default-constructed when `foo` is called, and `T: Default` must be proven via `predicates_of`.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/doc/rustc-dev-guide/src/effects.md#_snippet_0

LANGUAGE: Rust
CODE:
```
fn foo<T>() where T: Default {}
```

----------------------------------------

TITLE: Resolving Lifetime Mismatch by Constraining Lifetimes in Rust
DESCRIPTION: This Rust code snippet demonstrates one solution to the lifetime mismatch error (E0623). By adding a lifetime bound `'in_: 'out` to the `badboi` function, it ensures that the `'in_` lifetime lives at least as long as the `'out` lifetime, satisfying the compiler's requirements and allowing the `sadness.cast()` operation to be valid.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0623.md#_snippet_1

LANGUAGE: Rust
CODE:
```
struct Foo<'a, 'b, T>(std::marker::PhantomData<(&'a (), &'b (), T)>)
where
    T: Convert<'a, 'b>;

trait Convert<'a, 'b>: Sized {
    fn cast(&'a self) -> &'b Self;
}
impl<'long: 'short, 'short, T> Convert<'long, 'short> for T {
    fn cast(&'long self) -> &'short T {
        self
    }
}
fn badboi<'in_: 'out, 'out, T>(
    x: Foo<'in_, 'out, T>,
    sadness: &'in_ T
) -> &'out T {
    sadness.cast()
}
```

----------------------------------------

TITLE: Formatting Rust Project with cargo fmt (Shell)
DESCRIPTION: This command runs `rustfmt` on a cargo project in the current working directory. It automatically formats all binary and library targets of your crate, providing an easy way to ensure consistent formatting across your project.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/tools/rustfmt/README.md#_snippet_1

LANGUAGE: sh
CODE:
```
cargo fmt
```

----------------------------------------

TITLE: Using Early Returns for Option Handling in Rust
DESCRIPTION: Shows the preferred way to handle `Option` types using early returns. This pattern reduces cognitive load and simplifies control flow, especially when a condition leads to an immediate `None` result, making the main logic clearer.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/tools/rust-analyzer/docs/book/src/contributing/style.md#_snippet_29

LANGUAGE: Rust
CODE:
```
// GOOD
fn foo() -> Option<Bar> {
    if !condition() {
        return None;
    }

    Some(...)
}
```

----------------------------------------

TITLE: Fixing E0505: Releasing Borrow Before Move in Rust
DESCRIPTION: This solution addresses the E0505 error by ensuring that the borrow (`ref_to_val`) is no longer active before the value `x` is moved. The `borrow` function is called first, consuming the reference, and only then is `x` moved into the `eat` function, satisfying Rust's ownership rules.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0505.md#_snippet_2

LANGUAGE: Rust
CODE:
```
struct Value {}

fn borrow(val: &Value) {}

fn eat(val: Value) {}

fn main() {
    let x = Value{};

    let ref_to_val: &Value = &x;
    borrow(ref_to_val);
    // ref_to_val is no longer used.
    eat(x);
}
```

----------------------------------------

TITLE: Correct Rust Borrowing: Single Mutable or Multiple Immutable References
DESCRIPTION: This Rust code snippet illustrates correct borrowing practices. It shows that a variable can have either a single mutable reference (`x`) or multiple immutable references (`a`, `b`, `c`) concurrently, but not both. This adheres to Rust's core ownership and borrowing principles for memory safety.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0499.md#_snippet_1

LANGUAGE: Rust
CODE:
```
let mut i = 0;
let mut x = &mut i; // ok!

// or:
let mut i = 0;
let a = &i; // ok!
let b = &i; // still ok!
let c = &i; // still ok!
b;
a;
```

----------------------------------------

TITLE: Implementing a Trait for a Struct in Rust
DESCRIPTION: This `impl` block implements the `t` trait for the `foo` struct. It provides concrete implementations for the functions defined in the `t` trait, demonstrating how a struct can fulfill the contract of a trait.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/tools/rust-analyzer/crates/ide/src/syntax_highlighting/test_data/highlight_assoc_functions.html#_snippet_4

LANGUAGE: Rust
CODE:
```
impl t for foo {
    pub fn is_static() {}
    pub fn is_not_static(&self) {}
}
```

----------------------------------------

TITLE: Publishing a Rust Crate to crates.io
DESCRIPTION: This command publishes the current Rust crate to crates.io using the nightly toolchain. It is part of a larger process that includes version bumping, Git tagging, and ensuring a clean working directory.
SOURCE: https://github.com/rust-lang/rust/blob/master/library/compiler-builtins/PUBLISHING.md#_snippet_0

LANGUAGE: Shell
CODE:
```
cargo +nightly publish
```

----------------------------------------

TITLE: Updating Rustup and Compiler
DESCRIPTION: This command updates Rustup and all installed toolchains and components to their latest versions, ensuring you have the most recent Rust compiler and tools.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/tools/clippy/README.md#_snippet_0

LANGUAGE: terminal
CODE:
```
rustup update
```

----------------------------------------

TITLE: Defining a Basic Rust Function
DESCRIPTION: This snippet defines a simple Rust function named `blah` that takes no arguments and returns nothing. It serves as a basic example of function declaration syntax in Rust, demonstrating the `fn` keyword followed by the function name, empty parentheses for parameters, and curly braces for the function body.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/tools/rustfmt/tests/writemode/target/modified.txt#_snippet_0

LANGUAGE: Rust
CODE:
```
fn blah() {}
```

----------------------------------------

TITLE: Demonstrating Missing Trait Implementation in Rust
DESCRIPTION: This snippet illustrates the E0277 error where a concrete type (i32) is used in a context expecting a trait (Foo) that it does not implement. The `some_func` expects a type `T` that implements `Foo`, but `main` passes an `i32` which does not, leading to a compile-time error.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0277.md#_snippet_0

LANGUAGE: Rust
CODE:
```
// here we declare the Foo trait with a bar method
trait Foo {
    fn bar(&self);
}

// we now declare a function which takes an object implementing the Foo trait
fn some_func<T: Foo>(foo: T) {
    foo.bar();
}

fn main() {
    // we now call the method with the i32 type, which doesn't implement
    // the Foo trait
    some_func(5i32); // error: the trait bound `i32 : Foo` is not satisfied
}
```

----------------------------------------

TITLE: Defining and Accessing Fields of a Rust Struct
DESCRIPTION: This example illustrates how to define a custom struct (`Foo`) with named fields (`x` and `y`) in Rust. It then demonstrates creating an instance of the struct and successfully accessing its individual fields, contrasting with primitive type limitations.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0610.md#_snippet_1

LANGUAGE: Rust
CODE:
```
// We declare struct called `Foo` containing two fields:
struct Foo {
    x: u32,
    y: i64,
}

// We create an instance of this struct:
let variable = Foo { x: 0, y: -12 };
// And we can now access its fields:
println!("x: {}, y: {}", variable.x, variable.y);
```

----------------------------------------

TITLE: Adding Trait Bound to Resolve E0277 in Generic Rust Function
DESCRIPTION: This snippet demonstrates how to fix the E0277 error in a generic function by adding a trait bound. By specifying `T: fmt::Debug`, the compiler knows that `T` will always implement `Debug`, allowing the `println!` macro to be used safely and resolving the compilation error.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0277.md#_snippet_3

LANGUAGE: Rust
CODE:
```
use std::fmt;

// Restrict the input type to types that implement Debug.
fn some_func<T: fmt::Debug>(foo: T) {
    println!("{:?}", foo);
}

fn main() {
    // Calling the method is still fine, as i32 implements Debug.
    some_func(5i32);

    // This would fail to compile now:
    // struct WithoutDebug;
    // some_func(WithoutDebug);
}
```

----------------------------------------

TITLE: Installing Clippy Component with Rustup (Shell)
DESCRIPTION: This command installs the Clippy component for a specified Rust toolchain using `rustup`. It's used when Clippy is not automatically included with a minimal Rust toolchain installation. The `--toolchain` flag is optional and allows specifying a particular toolchain.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/tools/clippy/book/src/installation.md#_snippet_0

LANGUAGE: Shell
CODE:
```
$ rustup component add clippy [--toolchain=<name>]
```

----------------------------------------

TITLE: Pushing a New Git Branch to Remote - Shell
DESCRIPTION: This command pushes the `my-branch` from the local repository to the `origin` remote. The `--set-upstream` flag establishes a tracking relationship, so subsequent `git push` and `git pull` commands for this branch will automatically refer to the remote branch.
SOURCE: https://github.com/rust-lang/rust/blob/master/library/portable-simd/CONTRIBUTING.md#_snippet_4

LANGUAGE: Shell
CODE:
```
git push --set-upstream origin my-branch
```

----------------------------------------

TITLE: Demonstrating E0507 Error: Moving Self from RefCell Borrow in Rust
DESCRIPTION: This snippet illustrates the E0507 error in Rust, where a method attempts to take ownership (`self`) of a value that is only mutably borrowed from a `RefCell`. The `nothing_is_true` method consumes `self`, but `x.borrow()` only provides a reference, leading to a 'cannot move out of borrowed content' error.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0507.md#_snippet_0

LANGUAGE: Rust
CODE:
```
use std::cell::RefCell;

struct TheDarkKnight;

impl TheDarkKnight {
    fn nothing_is_true(self) {}
}

fn main() {
    let x = RefCell::new(TheDarkKnight);

    x.borrow().nothing_is_true(); // error: cannot move out of borrowed content
}
```

----------------------------------------

TITLE: Adding rust-analyzer Component via rustup
DESCRIPTION: This command uses `rustup`, the official Rust toolchain installer, to add `rust-analyzer` as a component to your existing Rust installation. This is the recommended and simplest way to install `rust-analyzer` if `rustup` is already in use.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/tools/rust-analyzer/docs/book/src/rust_analyzer_binary.md#_snippet_2

LANGUAGE: Shell
CODE:
```
rustup component add rust-analyzer
```

----------------------------------------

TITLE: Fixing Rust E0118 Error with Newtype Wrapper
DESCRIPTION: This snippet provides an alternative solution to the E0118 error by introducing a 'newtype' wrapper. A newtype is a tuple struct that wraps an existing type, allowing inherent implementations to be defined on the wrapper struct, thereby associating methods with the wrapped type indirectly.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0118.md#_snippet_2

LANGUAGE: Rust
CODE:
```
struct TypeWrapper<T>(T);

impl<T> TypeWrapper<T> {
    fn get_state(&self) -> String {
        "Fascinating!".to_owned()
    }
}
```

----------------------------------------

TITLE: Resolving E0433: Importing HashMap in Rust
DESCRIPTION: This example demonstrates how to resolve the E0433 error by correctly importing the `HashMap` type from the `std::collections` module. Once imported, `HashMap` can be used without compilation errors, allowing for proper type instantiation and usage.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0433.md#_snippet_1

LANGUAGE: Rust
CODE:
```
use std::collections::HashMap; // HashMap has been imported.
let map: HashMap<u32, u32> = HashMap::new(); // So it can be used!
```

----------------------------------------

TITLE: Correctly Binding a Rust Enum Variant in a Match Expression
DESCRIPTION: This snippet shows the proper method for binding an enum variant within a `match` expression in Rust. Instead of attempting to match the enum type `Jak` directly, the specific variant `Jak::Daxter` is matched, allowing access to its fields and resolving the E0574 error.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0574.md#_snippet_2

LANGUAGE: Rust
CODE:
```
enum Jak {
    Daxter { i: isize },
}

let eco = Jak::Daxter { i: 1 };
match eco {
    Jak::Daxter { i } => {} // ok!
}
```

----------------------------------------

TITLE: Syncing Local Repository with Upstream Master
DESCRIPTION: This snippet demonstrates how to keep your local `master` branch and feature branches synchronized with the upstream repository. It uses `git pull --ff-only` to prevent merge commits and `git rebase` to update feature branches, followed by `git push --force-with-lease` to ensure remote consistency.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/doc/rustc-dev-guide/src/git.md#_snippet_13

LANGUAGE: console
CODE:
```
git checkout master
git pull upstream master --ff-only # to make certain there are no merge commits
git rebase master feature_branch
git push --force-with-lease # (set origin to be the same as local)
```

----------------------------------------

TITLE: Demonstrating Integer Overflow in Rust
DESCRIPTION: This Rust snippet illustrates an integer overflow scenario. It attempts to add 1 to a `u8` variable initialized to its maximum value (255), which will cause a panic in debug builds due to overflow checks. This demonstrates Rust's default behavior for preventing unintended integer computation results.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/doc/rustc/src/exploit-mitigations.md#_snippet_1

LANGUAGE: Rust
CODE:
```
fn main() {
    let u: u8 = 255;
    println!("u: {}", u + 1);
}
```

----------------------------------------

TITLE: Basic Rustdoc Documentation Example
DESCRIPTION: Illustrates the fundamental syntax for `rustdoc` tests using triple backticks to define code blocks within documentation comments. Running `rustdoc --test` on the source file extracts and executes these examples as tests.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/doc/rustdoc/src/write-documentation/documentation-tests.md#_snippet_0

LANGUAGE: Rust
CODE:
```
/// # Examples
///
/// ```
/// let x = 5;
/// ```
# fn f() {}
```

----------------------------------------

TITLE: Generating and Opening Docs with cargo doc
DESCRIPTION: This command extends `cargo doc` with the `--open` flag, which automatically opens the generated documentation in the default web browser after generation is complete.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/doc/rustdoc/src/what-is-rustdoc.md#_snippet_7

LANGUAGE: bash
CODE:
```
$ cargo doc --open
```

----------------------------------------

TITLE: Correcting E0594: Declaring a Struct Instance as Mutable in Rust
DESCRIPTION: This Rust code snippet provides the fix for the E0594 error. By declaring the `ss` instance of `SolarSystem` as mutable using the `mut` keyword, its fields can be successfully modified after initialization.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0594.md#_snippet_1

LANGUAGE: Rust
CODE:
```
struct SolarSystem {
    earth: i32,
}

let mut ss = SolarSystem { earth: 3 }; // declaring `ss` as mutable
ss.earth = 2; // ok!
```

----------------------------------------

TITLE: Preferring General Types in Rust
DESCRIPTION: Recommends preferring more general types (e.g., `&[T]`, `&str`, `Option<&T>`) over more specific or owned types (`&Vec<T>`, `&String`, `&Option<T>`) when defining function signatures or struct fields. This promotes generality and consistency, even when strict generality isn't required.
SOURCE: https://github.com/rust-lang/rust/blob/master/src/tools/rust-analyzer/docs/book/src/contributing/style.md#_snippet_7

LANGUAGE: Rust
CODE:
```
// GOOD      BAD
&[T]         &Vec<T>
&str         &String
Option<&T>   &Option<T>
&Path        &PathBuf
```

----------------------------------------

TITLE: Defining a Basic Trait and Implementations in Rust
DESCRIPTION: This snippet defines a simple `Trait` with a `foo` method and provides two implementations for `String` and `u8`. It illustrates the basic structure of traits and their implementations, which form the basis for virtual method tables in trait objects.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0038.md#_snippet_4

LANGUAGE: Rust
CODE:
```
trait Trait {
    fn foo(&self);
}

impl Trait for String {
    fn foo(&self) {
        // implementation 1
    }
}

impl Trait for u8 {
    fn foo(&self) {
        // implementation 2
    }
}
```

----------------------------------------

TITLE: Matching Qualified Enum Variants in Rust
DESCRIPTION: This snippet demonstrates the correct way to match enum variants in Rust by explicitly qualifying them with their enum type (e.g., `Method::GET`). This prevents the compiler from interpreting the variant names as new variable bindings, ensuring proper pattern matching behavior and avoiding the E0170 error.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0170.md#_snippet_2

LANGUAGE: Rust
CODE:
```
enum Method {
    GET,
    POST,
}

let m = Method::GET;

match m {
    Method::GET => {},
    Method::POST => {},
}
```

----------------------------------------

TITLE: Deriving Rust Trait Return Lifetimes with Anonymous '_'
DESCRIPTION: This Rust example demonstrates how to make the lifetime of the returned 'impl Trait' or 'Box<dyn Trait>' derived from the input argument's lifetime using the anonymous lifetime '_'. This allows the returned value to borrow data for a non-'static' duration, matching the input 'x'.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0759.md#_snippet_2

LANGUAGE: Rust
CODE:
```
# use std::fmt::Debug;
fn foo(x: &i32) -> impl Debug + '_ {
    x
}
fn bar(x: &i32) -> Box<dyn Debug + '_> {
    Box::new(x)
}
```

----------------------------------------

TITLE: Illustrating Undeclared Lifetime Error (E0261) in Rust
DESCRIPTION: This snippet demonstrates the E0261 error in Rust, which arises when a lifetime parameter, such as `'a`, is used without being declared. It shows examples in both a function signature and a struct field, highlighting how the compiler flags these as errors due to the missing lifetime declaration.
SOURCE: https://github.com/rust-lang/rust/blob/master/compiler/rustc_error_codes/src/error_codes/E0261.md#_snippet_0

LANGUAGE: Rust
CODE:
```
// error, use of undeclared lifetime name `'a`
fn foo(x: &'a str) { }

struct Foo {
    // error, use of undeclared lifetime name `'a`
    x: &'a str,
}
```