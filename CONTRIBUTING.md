# Contributing to Project Aether

Thank you for your interest in contributing to Project Aether! This document provides guidelines and instructions for contributing to the project.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- A code editor (VS Code recommended)

### Setup

1. Clone the repository
```bash
git clone <repository-url>
cd project-aether
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.local.example .env.local
# Edit .env.local with your API keys
```

4. Start the development server
```bash
npm run dev
```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feat/*` - Feature branches
- `fix/*` - Bug fix branches
- `docs/*` - Documentation updates

### Commit Messages

Follow the Conventional Commits specification:

```
feat: add new window resize handler
fix: resolve z-index issue with overlapping windows
docs: update README with new features
style: format code according to prettier rules
refactor: simplify window store logic
test: add unit tests for file system store
chore: update dependencies
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Code Style

#### TypeScript

- Use TypeScript strict mode
- Define types explicitly (avoid `any`)
- Use interfaces for object shapes
- Use type aliases for unions/primitives
- Export types from centralized locations

Example:
```typescript
// Good
interface WindowProps {
  id: string;
  title: string;
  onClose: () => void;
}

// Avoid
function MyComponent(props: any) { ... }
```

#### React Components

- Use functional components with hooks
- Use "use client" directive for client components
- Keep components focused and single-responsibility
- Extract reusable logic into custom hooks
- Use meaningful prop names

Example:
```typescript
"use client";

import { useState } from "react";

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export function Button({ label, onClick, variant = "primary" }: ButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={variant === "primary" ? "btn-primary" : "btn-secondary"}
    >
      {label}
    </button>
  );
}
```

#### Styling

- Use Tailwind utility classes
- Follow Warmwind design system
- Use semantic class names for complex components
- Maintain consistent spacing (Tailwind scale)
- Use design tokens from globals.css

Example:
```typescript
// Good - Using Tailwind utilities
<div className="glass p-6 rounded-xl">
  <h2 className="text-warmwind-amber-500">Title</h2>
</div>

// Avoid - Inline styles
<div style={{ padding: "24px", borderRadius: "12px" }}>
```

#### State Management

- Use Zustand stores for global state
- Keep local state in components when appropriate
- Avoid prop drilling (use stores instead)
- Name actions clearly and consistently

Example:
```typescript
// Good
const { openWindow, closeWindow } = useWindowStore();

// Avoid
const { doThing1, doThing2 } = useStore();
```

### File Organization

#### Component Structure

```
ComponentName/
├── index.ts              # Export
├── ComponentName.tsx     # Component
├── ComponentName.test.tsx # Tests (future)
└── types.ts              # Component-specific types
```

#### Naming Conventions

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils: `camelCase.ts`
- Types: `kebab-case.ts` or co-located
- Constants: `SCREAMING_SNAKE_CASE`

### Testing (Future Implementation)

```bash
npm run test          # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

Write tests for:
- Zustand store actions
- Utility functions
- Complex component logic
- Critical user flows

### Performance Guidelines

1. **Optimize Re-renders**
   - Use Zustand selectors
   - Memoize expensive calculations
   - Use React.memo for pure components

2. **Code Splitting**
   - Dynamic imports for heavy components
   - Lazy load window content
   - Split by route

3. **Asset Optimization**
   - Optimize images
   - Use Next.js Image component
   - Lazy load non-critical assets

### Accessibility

- Use semantic HTML
- Provide ARIA labels where needed
- Ensure keyboard navigation works
- Maintain sufficient color contrast
- Test with screen readers

### Pull Request Process

1. **Create a Feature Branch**
```bash
git checkout -b feat/your-feature-name
```

2. **Make Your Changes**
   - Write clean, well-documented code
   - Follow the style guide
   - Add tests if applicable

3. **Test Locally**
```bash
npm run build    # Ensure it builds
npm run lint     # Check for linting errors
npm run dev      # Test functionality
```

4. **Commit Your Changes**
```bash
git add .
git commit -m "feat: add your feature description"
```

5. **Push to Your Fork**
```bash
git push origin feat/your-feature-name
```

6. **Create a Pull Request**
   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - Wait for review and address feedback

### PR Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Build passes
```

## Warmwind Design System Guidelines

### Colors

Use design tokens:
- `warmwind-deep-black` - Main background
- `warmwind-charcoal` - Components
- `warmwind-dark-gray` - Inputs
- `warmwind-amber-500` - Primary actions
- `warmwind-orange-500` - Accents
- `warmwind-rose-500` - Highlights

### Spacing

Use Tailwind spacing scale:
- `p-2` (8px) - Tight spacing
- `p-4` (16px) - Default spacing
- `p-6` (24px) - Comfortable spacing
- `p-8` (32px) - Loose spacing

### Typography

- Headings: Use `<h1>` through `<h6>` with default styles
- Body: Use `<p>` with `text-gray-300`
- Links: Automatically styled with amber hover

### Components

Use pre-built utility classes:
- `.glass` - Glassmorphic panel
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.card` - Content card
- `.window` - Window container

## Questions?

If you have questions about contributing:
1. Check existing documentation
2. Search closed issues
3. Open a new discussion
4. Reach out to maintainers

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow
- Maintain a positive community

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Project documentation

Thank you for contributing to Project Aether! 🚀
