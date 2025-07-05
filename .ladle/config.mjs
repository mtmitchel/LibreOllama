/**
 * Ladle Configuration for LibreOllama Design System
 * 
 * This configuration integrates Ladle with our existing Vite setup
 * and ensures our design system CSS variables are available in stories.
 */
export default {
  stories: "src/**/*.stories.{js,jsx,ts,tsx}",
  addons: {
    width: {
      enabled: true,
      options: {
        xsmall: 414,
        small: 640,
        medium: 768,
        large: 1024,
        xlarge: 1280,
      },
    },
    theme: {
      enabled: true,
      defaultState: "dark",
    },
    controls: {
      enabled: true,
    },
    action: {
      enabled: true,
    },
  },
  viteConfig: "./vite.config.ts",
  // Custom head content to include our design system styles
  head: `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
        margin: 0;
        padding: 0;
      }
    </style>
  `,
  // Enable hot reload for better development experience
  hmr: true,
  // Set the port to avoid conflicts
  port: 61000,
}; 