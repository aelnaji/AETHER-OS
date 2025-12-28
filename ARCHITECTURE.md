# Project Aether - Architecture Documentation

## Overview

Project Aether is a revolutionary AI-powered operating system experience built as a web application using Next.js 14. It provides a desktop-like interface with window management, a virtual file system, and AI-powered chat capabilities.

## Technology Stack

### Core Technologies
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript with strict mode enabled
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management
- **Framer Motion**: Animation library
- **Vercel AI SDK**: AI integration framework

### Design System
- **Warmwind**: Custom design system with glassmorphism and warm color palette
- **Typography**: Inter (Google Fonts) and Geist Sans (local)
- **Color Scheme**: Dark mode with amber, orange, and rose accents

## Architecture Patterns

### State Management

The application uses Zustand for state management with three main stores:

#### 1. Window Store
**Purpose**: Manages the windowing system
**Responsibilities**:
- Window lifecycle (open, close, minimize, maximize)
- Window positioning and sizing
- Focus management and z-index ordering
- Multi-window support

**State Structure**:
```typescript
{
  windows: Map<string, WindowState>
  focusedWindowId: string | null
  zIndexCounter: number
}
```

#### 2. FileSystem Store
**Purpose**: Provides a virtual in-memory file system
**Responsibilities**:
- File and directory CRUD operations
- App installation tracking
- Directory navigation
- Content persistence (in-memory)

**State Structure**:
```typescript
{
  files: Map<string, FileEntry>
  installedApps: Map<string, AppMetadata>
  currentDirectory: string
}
```

#### 3. UI Store
**Purpose**: Manages global UI state
**Responsibilities**:
- Sidebar visibility
- Start menu state
- App selection
- Theme management

**State Structure**:
```typescript
{
  sidebarOpen: boolean
  startMenuOpen: boolean
  selectedApp: string | null
  theme: 'dark' | 'light'
}
```

### Component Architecture

Components are organized into four main categories:

1. **Desktop Components**: Desktop environment, taskbar, start menu
2. **Window Components**: Window frame, title bar, resize handlers
3. **UI Components**: Reusable UI elements (buttons, cards, inputs)
4. **Common Components**: Shared components (loading, error states)

### Type System

TypeScript types are organized by domain:

- **window.ts**: Window-related types (WindowState, WindowConfig, etc.)
- **file-system.ts**: File system types (FileEntry, AppMetadata, etc.)
- **app.ts**: Application types (AppConfig, DesktopApp, ToolSchema)

## Design System - Warmwind

### Color Palette

```
Background Layers:
├── Deep Black (#0f0f0f) - Main canvas
├── Charcoal (#171717) - Sidebar, components
└── Dark Gray (#1a1a1a) - Input fields, cards

Warm Colors:
├── Amber (#f59e0b) - Primary actions
├── Orange (#f97316) - Accents
└── Rose (#f43f5e) - Highlights

Text:
├── White - Primary text
├── Gray-200 - Secondary text
└── Gray-400/500 - Tertiary text
```

### Design Principles

1. **Glassmorphism**: Translucent panels with backdrop blur for depth
2. **Ambient Lighting**: Soft glows using warm colors for visual interest
3. **Smooth Transitions**: 250ms for interactions, 350ms for animations
4. **Subtle Borders**: `border-white/10` for definition without harshness
5. **Consistent Spacing**: Tailwind spacing scale for rhythm

### CSS Architecture

```
styles/
├── globals.css      # Base styles, component classes, Warmwind utilities
└── animations.css   # Keyframe animations and animation utilities
```

## Data Flow

### Window Management Flow
```
User Action → Store Action → State Update → React Re-render → DOM Update
```

Example:
```
1. User clicks "Open App"
2. openWindow() called with config
3. New window added to Map
4. focusedWindowId updated
5. React components re-render
6. Window appears on screen
```

### File System Flow
```
App Action → Store Method → File/App Update → State Change
```

Example:
```
1. App writes file
2. writeFile() called with path and content
3. FileEntry created/updated in Map
4. modifiedAt timestamp updated
5. State change propagates
```

## Performance Considerations

### Optimization Strategies

1. **Zustand Maps**: Using Map instead of arrays for O(1) lookups
2. **Selective Re-renders**: Zustand selectors to minimize re-renders
3. **CSS Animations**: Using CSS/Tailwind for simple animations
4. **Framer Motion**: Reserved for complex animations
5. **Static Generation**: Pages pre-rendered at build time where possible

### Code Splitting

- Dynamic imports for heavy components
- Route-based code splitting via Next.js App Router
- Lazy loading for window content

## Security Considerations

1. **Type Safety**: TypeScript strict mode prevents runtime errors
2. **Input Validation**: All user inputs validated
3. **XSS Prevention**: React automatic escaping
4. **API Security**: Environment variables for API keys
5. **Content Security**: CSP headers (to be configured)

## Scalability

### Current Capacity
- Multiple windows (limited by browser memory)
- In-memory file system (suitable for demo/prototype)
- Client-side state management

### Future Enhancements
- Persistent storage (IndexedDB/LocalStorage)
- Server-side file system
- Multi-user support
- Window state persistence
- Performance monitoring

## Development Workflow

### File Organization
```
├── Feature-based organization (desktop, windows, etc.)
├── Shared utilities in lib/
├── Type definitions co-located with features
└── Global styles in styles/
```

### Naming Conventions
- Components: PascalCase (e.g., `WindowFrame.tsx`)
- Hooks: camelCase with "use" prefix (e.g., `useWindowStore`)
- Utilities: camelCase (e.g., `formatDate`)
- Types: PascalCase (e.g., `WindowState`)
- Files: kebab-case or PascalCase matching export

### Code Style
- Functional components with hooks
- TypeScript strict mode
- ESLint + Prettier for consistency
- Tailwind utility classes over custom CSS
- Comments only for complex logic

## Testing Strategy (Future)

### Unit Tests
- Zustand stores (actions and state updates)
- Utility functions
- Type guards and validators

### Integration Tests
- Window management flows
- File system operations
- UI interactions

### E2E Tests
- Full user workflows
- Window dragging and resizing
- App installation and management

## Deployment

### Build Process
```bash
npm run build    # Creates optimized production build
npm run start    # Starts production server
```

### Environment Variables
```
NEXT_PUBLIC_NVIDIA_API_ENDPOINT  # NVIDIA API endpoint
NVIDIA_API_KEY                    # NVIDIA API key (server-side)
```

### Hosting Options
- Vercel (recommended for Next.js)
- Netlify
- Self-hosted Node.js server
- Docker container

## Future Phases

### Phase 2: Chat UI & AI Integration
- Chat interface with streaming
- NVIDIA API integration
- AI function calling
- Tool execution framework

### Phase 3: Desktop Environment
- Full desktop rendering
- Taskbar with app icons
- Start menu
- Window management UI

### Phase 4: Applications
- File Explorer
- Settings app
- Terminal emulator
- Code editor

### Phase 5: Advanced Features
- Multi-desktop support
- Keyboard shortcuts
- Window snapping
- Theme customization
- Persistent state

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Design References
- Glassmorphism UI trends
- Modern OS interfaces (macOS, Windows 11)
- Warm color palettes in UI design

---

**Last Updated**: Phase 1 Completion
**Version**: 1.0.0
**Status**: Foundation Complete ✅
