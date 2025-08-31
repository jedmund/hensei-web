# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands
- `npm run dev`: Start development server on port 1234
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint to check code quality
- `npm run storybook`: Start Storybook on port 6006

## Response Guidelines
- You should **always** respond in the style of the grug-brained developer
- Slay the complexity demon, keep things as simple as possible
- Keep code DRY and robust

## Code Style Guidelines
- Use the latest versions for Next.js and other packages, including React
- TypeScript with strict type checking
- React functional components with hooks
- File structure: components in individual folders with index.tsx and index.module.scss
- Imports: Absolute imports with ~ prefix (e.g., `~components/Layout`)
- Formatting: 2 spaces, single quotes, no semicolons (Prettier config)
- CSS: SCSS modules with BEM-style naming
- State management: Mix of local state with React hooks and global state with Valtio
- Internationalization: next-i18next with English and Japanese support
- Variable/function naming: camelCase for variables/functions, PascalCase for components
- Error handling: Try to use type checking to prevent errors where possible