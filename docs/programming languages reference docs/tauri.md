TITLE: Register Tauri commands in Rust application
DESCRIPTION: This Rust code snippet shows how to register commands, specifically `my_custom_command`, with the Tauri application builder using `invoke_handler` and `tauri::generate_handler!`. This step is crucial for making the commands accessible from the frontend.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/develop/calling-rust.mdx#_snippet_1

LANGUAGE: Rust
CODE:
```
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![my_custom_command])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
```

----------------------------------------

TITLE: Automated Migration with Cargo (Cargo)
DESCRIPTION: This command sequence installs or updates the `tauri-cli` to version `^2.0.0` using Cargo, ensuring the exact locked version is used, and then executes the `cargo tauri migrate` command. This automates most of the migration process from Tauri 1.0 to Tauri 2.0, helping to update project configurations and dependencies.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/start/migrate/from-tauri-1.mdx#_snippet_6

LANGUAGE: Cargo
CODE:
```
cargo install tauri-cli --version "^2.0.0" --locked
    cargo tauri migrate
```

----------------------------------------

TITLE: Install Rust on Linux and macOS
DESCRIPTION: Install Rust on Linux and macOS systems using `rustup` via a secure `curl` command. This is the recommended method for setting up the Rust development environment.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/start/prerequisites.mdx#_snippet_2

LANGUAGE: sh
CODE:
```
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

----------------------------------------

TITLE: Creating Tauri App with npm
DESCRIPTION: This command uses npm's create feature to scaffold a new Tauri application project, leveraging the create-tauri-app package at its latest version.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/_fragments/cta.mdx#_snippet_3

LANGUAGE: npm
CODE:
```
npm create tauri-app@latest
```

----------------------------------------

TITLE: Installing Tauri CLI Tool
DESCRIPTION: This snippet provides commands to install the Tauri CLI tool as a development dependency using various package managers. For Cargo, it specifies a global installation with a version lock.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/start/create-project.mdx#_snippet_7

LANGUAGE: npm
CODE:
```
npm install -D @tauri-apps/cli@latest
```

LANGUAGE: yarn
CODE:
```
yarn add -D @tauri-apps/cli@latest
```

LANGUAGE: pnpm
CODE:
```
pnpm add -D @tauri-apps/cli@latest
```

LANGUAGE: deno
CODE:
```
deno add -D npm:@tauri-apps/cli@latest
```

LANGUAGE: bun
CODE:
```
bun add -D @tauri-apps/cli@latest
```

LANGUAGE: cargo
CODE:
```
cargo install tauri-cli --version "^2.0.0" --locked
```

----------------------------------------

TITLE: Initializing Minimal Tauri Application in Rust
DESCRIPTION: This `src/main.rs` file contains the main entry point for the minimal Tauri application. It initializes a default Tauri builder using `tauri::Builder::default()` and then runs the application with the generated context via `tauri::generate_context!()`. The `.expect()` call handles potential errors during application execution.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/develop/Tests/WebDriver/Example/index.mdx#_snippet_3

LANGUAGE: Rust
CODE:
```
fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("unable to run Tauri application");
}
```

----------------------------------------

TITLE: Run Tauri Application in Development Mode for Desktop
DESCRIPTION: These commands initiate the Tauri development server for desktop applications. The first run may take time for Rust package compilation, but subsequent runs are faster. Once built, the webview opens, and changes to the web app should automatically update.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/develop/index.mdx#_snippet_2

LANGUAGE: npm
CODE:
```
npm run tauri dev
```

LANGUAGE: yarn
CODE:
```
yarn tauri dev
```

LANGUAGE: pnpm
CODE:
```
pnpm tauri dev
```

LANGUAGE: deno
CODE:
```
deno task tauri dev
```

LANGUAGE: bun
CODE:
```
bun tauri dev
```

LANGUAGE: cargo
CODE:
```
cargo tauri dev
```

----------------------------------------

TITLE: Run Tauri Application in Development Mode for Mobile
DESCRIPTION: These commands start the Tauri development server for mobile applications (Android or iOS). Similar to desktop development, the initial build may take time. For iOS physical devices, the development server might need to listen on a specific `TAURI_DEV_HOST` address.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/develop/index.mdx#_snippet_3

LANGUAGE: npm
CODE:
```
npm run tauri [android|ios] dev
```

LANGUAGE: yarn
CODE:
```
yarn tauri [android|ios] dev
```

LANGUAGE: pnpm
CODE:
```
pnpm tauri [android|ios] dev
```

LANGUAGE: deno
CODE:
```
deno task tauri [android|ios] dev
```

LANGUAGE: bun
CODE:
```
bun tauri [android|ios] dev
```

LANGUAGE: cargo
CODE:
```
cargo tauri [android|ios] dev
```

----------------------------------------

TITLE: Complete Tauri Command Example with State and Async Operations
DESCRIPTION: This section provides a comprehensive example demonstrating how to combine various Tauri features, including asynchronous Rust commands, window access, state management, and custom response serialization. It also shows the corresponding JavaScript frontend invocation, illustrating how to pass parameters and handle structured responses.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/develop/calling-rust.mdx#_snippet_23

LANGUAGE: rust
CODE:
```
struct Database;

#[derive(serde::Serialize)]
struct CustomResponse {
	message: String,
	other_val: usize,
}

async fn some_other_function() -> Option<String> {
	Some("response".into())
}

#[tauri::command]
async fn my_custom_command(
	window: tauri::Window,
	number: usize,
	database: tauri::State<'_, Database>,
) -> Result<CustomResponse, String> {
	println!("Called from {}", window.label());
	let result: Option<String> = some_other_function().await;
	if let Some(message) = result {
		Ok(CustomResponse {
			message,
			other_val: 42 + number,
		})
	} else {
		Err("No result".into())
	}
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
	tauri::Builder::default()
		.manage(Database {})
		.invoke_handler(tauri::generate_handler![my_custom_command])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
```

LANGUAGE: javascript
CODE:
```
import { invoke } from '@tauri-apps/api/core';

// Invocation from JavaScript
invoke('my_custom_command', {
  number: 42,
})
  .then((res) =>
    console.log(`Message: ${res.message}, Other Val: ${res.other_val}`)
  )
  .catch((e) => console.error(e));
```

----------------------------------------

TITLE: Configure Tauri Development Server with Dev URL and Command
DESCRIPTION: This JSON configuration snippet for `tauri.conf.json` sets up the development server. `devUrl` specifies the URL of the frontend development server (e.g., `http://localhost:3000`), and `beforeDevCommand` defines the command to run before starting the development server (e.g., `npm run dev`). This is useful when using UI frameworks or JavaScript bundlers.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/develop/index.mdx#_snippet_0

LANGUAGE: json
CODE:
```
{
  "build": {
    "devUrl": "http://localhost:3000",
    "beforeDevCommand": "npm run dev"
  }
}
```

----------------------------------------

TITLE: Building Tauri Applications
DESCRIPTION: This section explains how to build a Tauri application using its command-line interface. It provides examples for various package managers and build tools to compile the application for the target platform.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/distribute/index.mdx#_snippet_0

LANGUAGE: npm
CODE:
```
npm run tauri build
```

LANGUAGE: yarn
CODE:
```
yarn tauri build
```

LANGUAGE: pnpm
CODE:
```
pnpm tauri build
```

LANGUAGE: deno
CODE:
```
deno task tauri build
```

LANGUAGE: bun
CODE:
```
bun tauri build
```

LANGUAGE: cargo
CODE:
```
cargo tauri build
```

----------------------------------------

TITLE: Checking and Installing Updates with Tauri JavaScript Plugin
DESCRIPTION: This JavaScript snippet demonstrates how to use the `@tauri-apps/plugin-updater` to check for available updates, log update details, and then download and install the update. It also shows how to use the `@tauri-apps/plugin-process` to relaunch the application after an update.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/start/migrate/from-tauri-1.mdx#_snippet_71

LANGUAGE: JavaScript
CODE:
```
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const update = await check();
if (update?.available) {
  console.log(`Update to ${update.version} available! Date: ${update.date}`);
  console.log(`Release notes: ${update.body}`);
  await update.downloadAndInstall();
  // requires the `process` plugin
  await relaunch();
}
```

----------------------------------------

TITLE: Invoke Async Tauri Command from JavaScript
DESCRIPTION: Illustrates how to invoke an asynchronous Tauri command from the frontend using JavaScript's invoke function. Since invoke already returns a Promise, it handles asynchronous operations naturally.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/develop/calling-rust.mdx#_snippet_16

LANGUAGE: JavaScript
CODE:
```
invoke('my_custom_command', { value: 'Hello, Async!' }).then(() =>
  console.log('Completed!')
);
```

----------------------------------------

TITLE: Structured Custom Error Serialization for Frontend Mapping
DESCRIPTION: Demonstrates an advanced custom error handling pattern where a Rust error enum is serialized into a structured object (e.g., `{ kind: 'io', message: '...' }`) using `serde` attributes. This allows for more precise error handling and mapping in the frontend (TypeScript).
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/develop/calling-rust.mdx#_snippet_13

LANGUAGE: rust
CODE:
```
#[derive(Debug, thiserror::Error)]
enum Error {
  #[error(transparent)]
  Io(#[from] std::io::Error),
  #[error("failed to parse as string: {0}")]
  Utf8(#[from] std::str::Utf8Error),
}

#[derive(serde::Serialize)]
#[serde(tag = "kind", content = "message")]
#[serde(rename_all = "camelCase")]
enum ErrorKind {
  Io(String),
  Utf8(String),
}

impl serde::Serialize for Error {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::ser::Serializer,
  {
    let error_message = self.to_string();
    let error_kind = match self {
      Self::Io(_) => ErrorKind::Io(error_message),
      Self::Utf8(_) => ErrorKind::Utf8(error_message),
    };
    error_kind.serialize(serializer)
  }
}

#[tauri::command]
fn read() -> Result<Vec<u8>, Error> {
  let data = std::fs::read("/path/to/file")?;
	Ok(data)
}
```

LANGUAGE: typescript
CODE:
```
type ErrorKind = {
  kind: 'io' | 'utf8';
  message: string;
};

invoke('read').catch((e: ErrorKind) => {});
```

----------------------------------------

TITLE: Base GitHub Actions Workflow for Tauri Application Publishing
DESCRIPTION: This YAML snippet outlines a standard GitHub Actions workflow for publishing Tauri applications across multiple operating systems (macOS, Ubuntu, Windows). It includes essential steps for checking out code, setting up Node.js and Rust, installing platform-specific dependencies, building the application, and utilizing the `tauri-action` for release creation.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/distribute/Sign/windows.mdx#_snippet_5

LANGUAGE: yaml
CODE:
```
name: 'publish'
on:
  push:
    branches:
      - release

jobs:
  publish-tauri:
    strategy:
      fail-fast: false
      matrix:
        platform: [macos-latest, ubuntu-latest, windows-latest]

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v2
      - name: setup node
        uses: actions/setup-node@v1
        with:
          node-version: 12
      - name: install Rust stable
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - name: install webkit2gtk (ubuntu only)
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y webkit2gtk-4.0
      - name: install app dependencies and build it
        run: yarn && yarn build
      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: app-v\_\_VERSION\_\_ # the action automatically replaces \_\_VERSION\_\_ with the app version
          releaseName: 'App v\_\_VERSION\_\_'
          releaseBody: 'See the assets to download this version and install.'
          releaseDraft: true
          prerelease: false
```

----------------------------------------

TITLE: Defining a Basic Tauri Permission
DESCRIPTION: This TOML snippet defines a basic permission with an identifier, description, allowed commands, and scope rules. It demonstrates how to grant specific command access and define file system access patterns (allow and deny) for a Tauri application.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/security/permissions.mdx#_snippet_0

LANGUAGE: toml
CODE:
```
[[permission]]
identifier = "my-identifier"
description = "This describes the impact and more."
commands.allow = [
    "read_file"
]

[[scope.allow]]
my-scope = "$HOME/*"

[[scope.deny]]
my-scope = "$HOME/secret"
```

----------------------------------------

TITLE: Configuring Vite for Tauri Integration
DESCRIPTION: This JavaScript snippet defines the `vite.config.js` file, configuring Vite for optimal integration with Tauri. It sets `clearScreen` to false to prevent obscuring Rust errors, configures the development server with a fixed port (1420), strict port checking, and dynamic host/HMR based on `TAURI_DEV_HOST`. It also ignores the `src-tauri` directory from watching, defines environment variable prefixes, and sets build targets, minification, and sourcemap generation based on Tauri environment variables for different platforms and debug modes.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/start/frontend/vite.mdx#_snippet_5

LANGUAGE: javascript
CODE:
```
import { defineConfig } from 'vite';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  // prevent vite from obscuring rust errors
  clearScreen: false,
  server: {
    port: 1420,
    // Tauri expects a fixed port, fail if that port is not available
    strictPort: true,
    // if the host Tauri is expecting is set, use it
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,

    watch: {
      // tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
  // Env variables starting with the item of `envPrefix` will be exposed in tauri's source code through `import.meta.env`.
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target:
      process.env.TAURI_ENV_PLATFORM == 'windows'
        ? 'chrome105'
        : 'safari13',
    // don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});
```

----------------------------------------

TITLE: Returning Data from Tauri Commands to JavaScript
DESCRIPTION: Shows how a Rust command handler can return a value, and how the JavaScript `invoke` function returns a Promise that resolves with this data. Returned data must implement `serde::Serialize`.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/develop/calling-rust.mdx#_snippet_8

LANGUAGE: rust
CODE:
```
#[tauri::command]
fn my_custom_command() -> String {
	"Hello from Rust!".into()
}
```

LANGUAGE: javascript
CODE:
```
invoke('my_custom_command').then((message) => console.log(message));
```

----------------------------------------

TITLE: Upgrading Tauri Dependencies
DESCRIPTION: This snippet provides commands to update Tauri CLI and API dependencies using various JavaScript package managers (npm, yarn, pnpm) and Rust's cargo tool. It ensures your project uses the latest stable versions of Tauri components.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/blog/tauri-1-6.mdx#_snippet_0

LANGUAGE: npm
CODE:
```
npm install @tauri-apps/cli@latest @tauri-apps/api@latest
```

LANGUAGE: yarn
CODE:
```
yarn upgrade @tauri-apps/cli @tauri-apps/api --latest
```

LANGUAGE: pnpm
CODE:
```
pnpm update @tauri-apps/cli @tauri-apps/api --latest
```

LANGUAGE: Rust
CODE:
```
cargo update
```

----------------------------------------

TITLE: Tauri Application Creation Output
DESCRIPTION: This snippet shows the interactive prompts and successful output from `create-tauri-app`, guiding the user through project name, frontend language, package manager, UI template, and UI flavor selection. It also provides instructions for getting started with the newly created project.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/learn/Security/using-plugin-permissions.mdx#_snippet_1

LANGUAGE: shell
CODE:
```
✔ Project name · plugin-permission-demo
✔ Choose which language to use for your frontend · TypeScript / JavaScript - (pnpm, yarn, npm, bun)
✔ Choose your package manager · pnpm
✔ Choose your UI template · Vanilla
✔ Choose your UI flavor · TypeScript

Template created! To get started run:
cd plugin-permission-demo
pnpm install
pnpm tauri dev
```

----------------------------------------

TITLE: Creating a Tauri Application with pnpm
DESCRIPTION: This command initializes a new Tauri project using `create-tauri-app` with `pnpm` as the package manager. It sets up the basic project structure for a frontend application.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/learn/Security/using-plugin-permissions.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
pnpm create tauri-app
```

----------------------------------------

TITLE: Sending GET Request with Tauri HTTP Plugin in JavaScript
DESCRIPTION: This JavaScript code demonstrates how to use the `fetch` method from `@tauri-apps/plugin-http` to send a GET request to a specified URL. It logs the response status and status text, mimicking the standard Web API `fetch` behavior.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/plugin/http-client.mdx#_snippet_3

LANGUAGE: javascript
CODE:
```
import { fetch } from '@tauri-apps/plugin-http';

// Send a GET request
const response = await fetch('http://test.tauri.app/data.json', {
  method: 'GET',
});
console.log(response.status); // e.g. 200
console.log(response.statusText); // e.g. "OK"
```

----------------------------------------

TITLE: Starting Tauri Development Server with npm
DESCRIPTION: This snippet navigates into the newly created Tauri project directory, installs its dependencies using npm, and then starts the Tauri development server. This allows for live reloading and debugging during application development.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/start/create-project.mdx#_snippet_0

LANGUAGE: Shell
CODE:
```
cd tauri-app
npm install
npm run tauri dev
```

----------------------------------------

TITLE: Define a basic Tauri command in Rust
DESCRIPTION: This Rust code defines a simple command `my_custom_command` using the `#[tauri::command]` attribute. When invoked from JavaScript, it prints a message to the console. Command names must be unique and cannot be `pub` when defined directly in `lib.rs`.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/develop/calling-rust.mdx#_snippet_0

LANGUAGE: Rust
CODE:
```
#[tauri::command]
fn my_custom_command() {
	println!("I was invoked from JavaScript!");
}
```

----------------------------------------

TITLE: Tauri Core Plugins: Simplified Default Permissions Configuration
DESCRIPTION: This JSON snippet presents a simplified approach to configuring default permissions for all core plugins in Tauri 2.0 release candidate. By using `core:default`, developers can include all standard core plugin permissions with a single entry in `tauri.conf.json`, reducing boilerplate.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/start/migrate/from-tauri-2-beta.mdx#_snippet_3

LANGUAGE: json
CODE:
```
...
"permissions": [
    "core:default"
]
...
```

----------------------------------------

TITLE: Managing Mutable Application State with Rust Mutex in Tauri
DESCRIPTION: Illustrates how to use `std::sync::Mutex` to wrap application state, enabling safe mutable access across threads in a Tauri application. The `Mutex` ensures data integrity by allowing only one thread to modify the state at a time.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/develop/state-management.mdx#_snippet_2

LANGUAGE: rust
CODE:
```
use std::sync::Mutex;

use tauri::{Builder, Manager};

#[derive(Default)]
struct AppState {
  counter: u32,
}

fn main() {
  Builder::default()
    .setup(|app| {
      app.manage(Mutex::new(AppState::default()));
      Ok(())
    })
    .run(tauri::generate_context!())
    .unwrap();
}
```

----------------------------------------

TITLE: Example Tauri Application Configuration
DESCRIPTION: These examples illustrate common Tauri application configuration settings, including development server setup, bundling options, window properties, and updater plugin details. They demonstrate how to define build commands, application icons, window titles, and updater endpoints in both JSON5 and TOML formats, highlighting their respective syntax and comment support.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/develop/configuration-files.mdx#_snippet_1

LANGUAGE: JSON5
CODE:
```
{
  build: {
    devUrl: 'http://localhost:3000',
    // start the dev server
    beforeDevCommand: 'npm run dev',
  },
  bundle: {
    active: true,
    icon: ['icons/app.png'],
  },
  app: {
    windows: [
      {
        title: 'MyApp',
      },
    ],
  },
  plugins: {
    updater: {
      pubkey: 'updater pub key',
      endpoints: ['https://my.app.updater/{{target}}/{{current_version}}'],
    },
  },
}
```

LANGUAGE: TOML
CODE:
```
[build]
dev-url = "http://localhost:3000"
# start the dev server
before-dev-command = "npm run dev"

[bundle]
active = true
icon = ["icons/app.png"]

[[app.windows]]
title = "MyApp"

[plugins.updater]
pubkey = "updater pub key"
endpoints = ["https://my.app.updater/{{target}}/{{current_version}}"]
```

----------------------------------------

TITLE: Running Tauri Application Context - Rust
DESCRIPTION: This Rust code snippet shows how to run the Tauri application's generated context. It uses `.expect()` to handle any errors that occur during the application's startup, ensuring the program exits gracefully if an issue arises.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/learn/window-menu.mdx#_snippet_11

LANGUAGE: Rust
CODE:
```
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

----------------------------------------

TITLE: Defining a Simple Tauri Command - Rust
DESCRIPTION: Defines a basic Tauri command `greet` that takes a `name` string as input and returns a formatted greeting string. This demonstrates a simple inter-process communication (IPC) from the frontend to the backend, allowing the UI to interact with Rust logic.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/learn/splashscreen.mdx#_snippet_8

LANGUAGE: Rust
CODE:
```
#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello {name} from Rust!")
}
```

----------------------------------------

TITLE: Invoke a Tauri command from JavaScript frontend
DESCRIPTION: This JavaScript code demonstrates how to call the `my_custom_command` from the frontend. It shows two methods: using the `@tauri-apps/api/core` npm package's `invoke` function, or using the global `window.__TAURI__.core.invoke` if the npm package is not used and `app.withGlobalTauri` is enabled.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/develop/calling-rust.mdx#_snippet_2

LANGUAGE: JavaScript
CODE:
```
// When using the Tauri API npm package:
import { invoke } from '@tauri-apps/api/core';

// When using the Tauri global script (if not using the npm package)
// Be sure to set `app.withGlobalTauri` in `tauri.conf.json` to true
const invoke = window.__TAURI__.core.invoke;

// Invoke the command
invoke('my_custom_command');
```

----------------------------------------

TITLE: Calling a Tauri Plugin Command from Frontend (JavaScript)
DESCRIPTION: This JavaScript code demonstrates how to invoke a command on a Tauri plugin from the frontend. It uses the `invoke` function from `@tauri-apps/api/tauri` to call the `ping` command of the `example` plugin, passing a `value` and logging the resolved response.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/blog/tauri-2-0-0-alpha-4.mdx#_snippet_6

LANGUAGE: javascript
CODE:
```
import { invoke } from '@tauri-apps/api/tauri';
invoke('plugin:example|ping', { value: 'Tauri' }).then(({ value }) =>
  console.log('Response', value)
);
```

----------------------------------------

TITLE: Initializing Tauri Application with State and Setup Hook - Rust
DESCRIPTION: The main entry point for the Tauri application, configuring it with state management (`Mutex<SetupState>`), registering commands (`greet`, `set_complete`), and utilizing a `setup` hook to run asynchronous background tasks before the main window is displayed. It ensures the setup task doesn't block the UI, improving user experience.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/learn/splashscreen.mdx#_snippet_7

LANGUAGE: Rust
CODE:
```
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Don't write code before Tauri starts, write it in the
    // setup hook instead!
    tauri::Builder::default()
        // Register a `State` to be managed by Tauri
        // We need write access to it so we wrap it in a `Mutex`
        .manage(Mutex::new(SetupState {
            frontend_task: false,
            backend_task: false,
        }))
        // Add a command we can use to check
        .invoke_handler(tauri::generate_handler![greet, set_complete])
        // Use the setup hook to execute setup related tasks
        // Runs before the main loop, so no windows are yet created
        .setup(|app| {
            // Spawn setup as a non-blocking task so the windows can be
            // created and ran while it executes
            spawn(setup(app.handle().clone()));
            // The hook expects an Ok result
            Ok(())
        })
        // Run the app
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

----------------------------------------

TITLE: Configuring Tauri Core Plugin Permissions (Tauri 2.0)
DESCRIPTION: This JSON snippet demonstrates the new, namespaced approach for defining core plugin permissions in Tauri 2.0. Core plugins are now prefixed with `core:` to prevent naming collisions and clearly distinguish them from external plugins, enhancing clarity and build stability.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/blog/tauri-2-0-0-release-candidate.mdx#_snippet_2

LANGUAGE: JSON
CODE:
```
...
"permissions": [
    "core:path:default",
    "core:event:default",
    "core:window:default",
    "core:app:default",
    "core:image:default",
    "core:resources:default",
    "core:menu:default",
    "core:tray:default"
]
...
```

----------------------------------------

TITLE: Publishing Tauri App with GitHub Actions Workflow
DESCRIPTION: This GitHub Actions workflow automates the build and release of a Tauri application across multiple platforms (Linux x64, Windows x64, macOS x64, macOS Arm64). It triggers on pushes to the `release` branch or manually via `workflow_dispatch`. The workflow installs necessary system dependencies, sets up Node.js and Rust, caches build artifacts, installs frontend dependencies, and uses `tauri-apps/tauri-action` to build the app and create a draft GitHub release with the generated artifacts.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/distribute/Pipelines/github.mdx#_snippet_1

LANGUAGE: YAML
CODE:
```
name: 'publish'

on:
  workflow_dispatch:
  push:
    branches:
      - release

jobs:
  publish-tauri:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: 'macos-latest' # for Arm based macs (M1 and above).
            args: '--target aarch64-apple-darwin'
          - platform: 'macos-latest' # for Intel based macs.
            args: '--target x86_64-apple-darwin'
          - platform: 'ubuntu-22.04'
            args: ''
          - platform: 'windows-latest'
            args: ''

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: install dependencies (ubuntu only)
        if: matrix.platform == 'ubuntu-22.04' # This must match the platform value defined above.
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

      - name: setup node
        uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: 'yarn' # Set this to npm, yarn or pnpm.

      - name: install Rust stable
        uses: dtolnay/rust-toolchain@stable # Set this to dtolnay/rust-toolchain@nightly
        with:
          # Those targets are only used on macos runners so it's in an `if` to slightly speed up windows and linux builds.
          targets: ${{ matrix.platform == 'macos-latest' && 'aarch64-apple-darwin,x86_64-apple-darwin' || '' }}

      - name: Rust cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: './src-tauri -> target'

      - name: install frontend dependencies
        # If you don't have `beforeBuildCommand` configured you may want to build your frontend here too.
        run: yarn install # change this to npm or pnpm depending on which one you use.

      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: app-v__VERSION__ # the action automatically replaces \_\_VERSION\_\_ with the app version.
          releaseName: 'App v__VERSION__'
          releaseBody: 'See the assets to download this version and install.'
          releaseDraft: true
          prerelease: false
          args: ${{ matrix.args }}
```

----------------------------------------

TITLE: Updating Menu Item Status in Tauri (JavaScript)
DESCRIPTION: This JavaScript snippet demonstrates how to create and dynamically update various types of menu items (CheckMenuItem, IconMenuItem, MenuItem) in a Tauri application. It shows how to change text, icons, and checked states, and how to set an application menu.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/learn/window-menu.mdx#_snippet_9

LANGUAGE: JavaScript
CODE:
```
import {
  Menu,
  CheckMenuItem,
  IconMenuItem,
  MenuItem,
} from '@tauri-apps/api/menu';
import { Image } from '@tauri-apps/api/image';

let currentLanguage = 'en';

const check_sub_item_en = await CheckMenuItem.new({
  id: 'en',
  text: 'English',
  checked: currentLanguage === 'en',
  action: () => {
    currentLanguage = 'en';
    check_sub_item_en.setChecked(currentLanguage === 'en');
    check_sub_item_zh.setChecked(currentLanguage === 'cn');
    console.log('English pressed');
  },
});

const check_sub_item_zh = await CheckMenuItem.new({
  id: 'zh',
  text: 'Chinese',
  checked: currentLanguage === 'zh',
  action: () => {
    currentLanguage = 'zh';
    check_sub_item_en.setChecked(currentLanguage === 'en');
    check_sub_item_zh.setChecked(currentLanguage === 'zh');
    check_sub_item_zh.setAccelerator('Ctrl+L');
    console.log('Chinese pressed');
  },
});

// Load icon from path
const icon = await Image.fromPath('../src/icon.png');
const icon2 = await Image.fromPath('../src/icon-2.png');

const icon_item = await IconMenuItem.new({
  id: 'icon_item',
  text: 'Icon Item',
  icon: icon,
  action: () => {
    icon_item.setIcon(icon2);
    console.log('icon pressed');
  },
});

const text_item = await MenuItem.new({
  id: 'text_item',
  text: 'Text Item',
  action: () => {
    text_item.setText('Text Item Changed');
    console.log('text pressed');
  },
});

const menu = await Menu.new({
  items: [
    {
      id: 'change menu',
      text: 'change_menu',
      items: [text_item, check_sub_item_en, check_sub_item_zh, icon_item],
    },
  ],
});

await menu.setAsAppMenu();
```

----------------------------------------

TITLE: Configuring Tauri Updater Endpoints and Public Key
DESCRIPTION: This configuration snippet demonstrates the basic `tauri.conf.json` structure for enabling the updater, specifying the public key for signature verification, and defining update endpoint URLs. It shows how to use dynamic variables like `{{target}}`, `{{arch}}`, and `{{current_version}}` for server-side update determination, and also includes an example for a static GitHub JSON file endpoint.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/plugin/updater.mdx#_snippet_23

LANGUAGE: JSON
CODE:
```
{
  "bundle": {
    "createUpdaterArtifacts": true
  },
  "plugins": {
    "updater": {
      "pubkey": "CONTENT FROM PUBLICKEY.PEM",
      "endpoints": [
        "https://releases.myapp.com/{{target}}/{{arch}}/{{current_version}}",
        "https://github.com/user/repo/releases/latest/download/latest.json"
      ]
    }
  }
}
```

----------------------------------------

TITLE: Migrating Tauri Project with npm
DESCRIPTION: This command sequence updates the Tauri CLI to the next major version using npm and then executes the automated migration command for the project. It's crucial for adapting existing Tauri 1.x projects to the new v2 structure.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/blog/tauri-2.0.mdx#_snippet_0

LANGUAGE: npm
CODE:
```
npm install @tauri-apps/cli@next
    npm run tauri migrate
```

----------------------------------------

TITLE: Creating Tauri App with Bash
DESCRIPTION: This command uses Bash to download and execute a shell script from the Tauri website, which initializes a new Tauri application project.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/_fragments/cta.mdx#_snippet_0

LANGUAGE: Bash
CODE:
```
sh <(curl https://create.tauri.app/sh)
```

----------------------------------------

TITLE: Creating Tauri App with Deno
DESCRIPTION: This command uses the Deno runtime to execute the create-tauri-app package directly from npm, requiring all permissions (-A) to scaffold a new Tauri project.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/_fragments/cta.mdx#_snippet_6

LANGUAGE: Deno
CODE:
```
deno run -A npm:create-tauri-app
```

----------------------------------------

TITLE: Installing Tauri CLI with Cargo
DESCRIPTION: Installs a specific version of the Tauri CLI globally using Cargo, Rust's package manager. The --locked flag ensures that the exact version specified is used, preventing dependency resolution issues.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/reference/_cli.mdx#_snippet_4

LANGUAGE: Rust
CODE:
```
cargo install tauri-cli --version "^2.0.0" --locked
```

----------------------------------------

TITLE: Static Update Manifest JSON Structure
DESCRIPTION: This JSON structure defines the required format for a static update manifest file used by Tauri. It includes version information, release notes, publication date, and platform-specific download URLs and signatures for different operating systems and architectures. The `version`, `platforms.[target].url`, and `platforms.[target].signature` fields are mandatory.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/plugin/updater.mdx#_snippet_25

LANGUAGE: json
CODE:
```
{
  "version": "",
  "notes": "",
  "pub_date": "",
  "platforms": {
    "linux-x86_64": {
      "signature": "",
      "url": ""
    },
    "windows-x86_64": {
      "signature": "",
      "url": ""
    },
    "darwin-x86_64": {
      "signature": "",
      "url": ""
    }
  }
}
```

----------------------------------------

TITLE: Making HTTP Fetch Request (JavaScript)
DESCRIPTION: This JavaScript code demonstrates how to make an HTTP GET request using the `fetch` function from the `@tauri-apps/plugin-http`. It fetches a remote JSON file, showcasing the basic usage of the plugin for network operations.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/start/migrate/from-tauri-1.mdx#_snippet_36

LANGUAGE: JavaScript
CODE:
```
import { fetch } from '@tauri-apps/plugin-http';
const response = await fetch(
  'https://raw.githubusercontent.com/tauri-apps/tauri/dev/package.json'
);
```

----------------------------------------

TITLE: Creating Predefined System Menus in Rust
DESCRIPTION: This Rust snippet illustrates how to construct an application menu using Tauri's built-in `PredefinedMenuItem`s. It leverages `MenuBuilder` methods like `.copy()`, `.separator()`, `.undo()`, `.redo()`, `.cut()`, `.paste()`, and `.select_all()` to quickly add common system menu items.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/learn/window-menu.mdx#_snippet_8

LANGUAGE: rust
CODE:
```
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::menu::{MenuBuilder, PredefinedMenuItem};

fn main() {
  tauri::Builder::default()
        .setup(|app| {
      let menu = MenuBuilder::new(app)
                .copy()
                .separator()
                .undo()
                .redo()
                .cut()
                .paste()
                .select_all()
                .item(&PredefinedMenuItem::copy(app, Some("custom text"))?)
                .build()?;
            app.set_menu(menu)?;

            Ok(())
        })
}
```

----------------------------------------

TITLE: Implementing Plugin Setup Lifecycle Hook in Tauri Rust
DESCRIPTION: This Rust snippet demonstrates how to use the `setup` lifecycle hook within a Tauri plugin. It shows managing application state by registering a `DummyStore` and spawning a background thread to emit a 'tick' event every second, useful for initialization and background tasks.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/develop/Plugins/index.mdx#_snippet_4

LANGUAGE: rust
CODE:
```
use tauri::{Manager, plugin::Builder};
use std::{collections::HashMap, sync::Mutex, time::Duration};

struct DummyStore(Mutex<HashMap<String, String>>);

Builder::new("<plugin-name>")
  .setup(|app, api| {
    app.manage(DummyStore(Default::default()));

    let app_ = app.clone();
    std::thread::spawn(move || {
      loop {
        app_.emit("tick", ());
        std::thread::sleep(Duration::from_secs(1));
      }
    });

    Ok(())
  })
```

----------------------------------------

TITLE: Implementing Manual Window Dragging with Tauri API (JavaScript)
DESCRIPTION: This JavaScript snippet adds a `mousedown` event listener to a custom titlebar element. It checks for a primary mouse button click and, if it's a double-click, toggles window maximization; otherwise, it initiates window dragging using `appWindow.startDragging()`, providing fine-grained control over drag behavior.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/learn/window-customization.mdx#_snippet_6

LANGUAGE: javascript
CODE:
```
// ...
document.getElementById('titlebar')?.addEventListener('mousedown', (e) => {
  if (e.buttons === 1) {
    // Primary (left) button
    e.detail === 2
      ? appWindow.toggleMaximize() // Maximize on double click
      : appWindow.startDragging(); // Else start dragging
  }
});
```

----------------------------------------

TITLE: Creating Ok/Cancel Dialog (JavaScript)
DESCRIPTION: This snippet demonstrates the `confirm` function from `@tauri-apps/plugin-dialog`, which creates a dialog with 'Ok' and 'Cancel' buttons. Similar to `ask`, it's an asynchronous function that returns a boolean, useful for confirming actions before proceeding.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/plugin/dialog.mdx#_snippet_3

LANGUAGE: javascript
CODE:
```
import { confirm } from '@tauri-apps/plugin-dialog';
// when using `"withGlobalTauri": true`, you may use
// const { confirm } = window.__TAURI__.dialog;

// Creates a confirmation Ok/Cancel dialog
const confirmation = await confirm(
  'This action cannot be reverted. Are you sure?',
  { title: 'Tauri', kind: 'warning' }
);

console.log(confirmation);
// Prints boolean to the console
```

----------------------------------------

TITLE: Scaffolding a New Tauri Project
DESCRIPTION: This command-line utility, typically run via `npx` or globally installed, quickly sets up a new Tauri application project. It provides a guided setup for various frontend frameworks, streamlining the initial development environment configuration.
SOURCE: https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/blog/tauri-1-0.md#_snippet_0

LANGUAGE: Shell
CODE:
```
create-tauri-app
```