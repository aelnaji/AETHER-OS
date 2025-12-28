# Project Aether - AI OS

A revolutionary AI-powered operating system experience built with Next.js 14, featuring a desktop environment with windowed applications, an AI chat interface, and a sophisticated design system.

## 🚀 Current Status: Phase 1 Complete

### ✨ Completed Features

- ✅ Next.js 14 with App Router & TypeScript
- ✅ Tailwind CSS with custom Warmwind design system
- ✅ Zustand state management (Window, FileSystem, UI stores)
- ✅ Comprehensive type definitions
- ✅ Glassmorphism & animation framework
- ✅ Project structure and architecture foundation

## 🏗️ Architecture

### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + Custom Warmwind Design System
- **State Management**: Zustand
- **Animations**: Framer Motion + Custom CSS animations
- **Icons**: Lucide React
- **AI Integration**: Vercel AI SDK (Phase 2)

### Project Structure

```
project-aether/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with fonts & metadata
│   ├── page.tsx                 # Desktop entry point
│   └── api/                     # API routes (Phase 2)
├── components/                   # React components
│   ├── desktop/                 # Desktop environment components
│   ├── windows/                 # Window management components
│   ├── ui/                      # Reusable UI components
│   └── common/                  # Common/shared components
├── lib/
│   ├── stores/                  # Zustand stores
│   │   ├── windowStore.ts       # Window management state
│   │   ├── fileSystemStore.ts   # Virtual file system state
│   │   ├── uiStore.ts           # UI/theme state
│   │   └── index.ts             # Store exports
│   ├── types/                   # TypeScript definitions
│   │   ├── window.ts            # Window-related types
│   │   ├── file-system.ts       # File system types
│   │   └── app.ts               # App/tool types
│   └── utils/                   # Utility functions
├── styles/
│   ├── globals.css              # Warmwind global styles
│   └── animations.css           # Animation definitions
├── public/                       # Static assets
└── package.json
```

## 🎨 Warmwind Design System

### Color Palette

```css
/* Deep Backgrounds */
--warmwind-deep-black: #0f0f0f    /* Main canvas */
--warmwind-charcoal: #171717       /* Sidebar, components */
--warmwind-dark-gray: #1a1a1a      /* Input fields, cards */

/* Warm Primary Colors */
--warmwind-amber-500: #f59e0b      /* Primary actions */
--warmwind-orange-500: #f97316     /* Accents */
--warmwind-rose-500: #f43f5e       /* Highlights */

/* Text */
White/Gray-200 for main text
Gray-300/400 for secondary text
```

### Design Principles

1. **Glassmorphism**: Translucent panels with backdrop blur
2. **Ambient Lighting**: Soft glows using warm colors (amber, rose, orange)
3. **Smooth Transitions**: 250ms for quick interactions, 350ms for animations
4. **Typography**: Inter (primary), Geist Sans (fallback)
5. **Subtle Borders**: `border-white/10` for definition without harshness

### Utility Classes

```css
.glass              /* Glassmorphic panel */
.glass-hover        /* Interactive glass element */
.glow-amber         /* Ambient amber glow */
.glow-rose          /* Ambient rose glow */
.btn-primary        /* Primary button style */
.btn-secondary      /* Secondary button style */
.card               /* Content card */
.window             /* Window container */
.sidebar            /* Sidebar styling */
```

## 📦 State Management

### Window Store (`useWindowStore`)

Manages the windowing system with support for:
- Opening/closing windows
- Minimizing/maximizing windows
- Window focus and z-index management
- Position and size updates
- Multi-window support

**Key Methods:**
- `openWindow(config)` - Creates a new window
- `closeWindow(id)` - Closes a window
- `minimizeWindow(id)` - Minimizes to taskbar
- `maximizeWindow(id)` - Toggles fullscreen
- `focusWindow(id)` - Brings window to front
- `updateWindowPosition(id, x, y)` - Updates position
- `updateWindowSize(id, width, height)` - Updates size

### File System Store (`useFileSystemStore`)

Virtual in-memory file system for:
- File/directory management
- App installation tracking
- Current directory navigation

**Key Methods:**
- `writeFile(path, content)` - Creates/updates file
- `readFile(path)` - Reads file content
- `deleteFile(path)` - Deletes file
- `createDirectory(path)` - Creates directory
- `listDirectory(path)` - Lists directory contents
- `installApp(id, name, icon)` - Registers installed app
- `uninstallApp(id)` - Removes app
- `getInstalledApps()` - Returns all installed apps

### UI Store (`useUIStore`)

Global UI state for:
- Sidebar visibility
- Start menu state
- App selection
- Theme management

**Key Methods:**
- `toggleSidebar()` - Shows/hides sidebar
- `toggleStartMenu()` - Opens/closes start menu
- `selectApp(id)` - Sets active app
- `setTheme(theme)` - Changes theme (dark/light)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

## 🧪 Testing the Stores

The home page includes a test button to verify Zustand stores are working correctly. Check the browser console for initialization messages and state updates.

## 📋 Next Steps (Phase 2)

- [ ] Chat UI with streaming support
- [ ] NVIDIA API integration
- [ ] AI function calling for window management
- [ ] Desktop component with taskbar
- [ ] Window rendering system
- [ ] File explorer application
- [ ] Settings application

## 🎯 Success Criteria

- ✅ Project builds without errors
- ✅ Development server runs
- ✅ All Zustand stores accessible
- ✅ TypeScript strict mode with no errors
- ✅ Tailwind CSS compiles with Warmwind config
- ✅ Global styles render correctly
- ✅ Next.js App Router working

## 📝 Development Notes

### Code Style
- Use TypeScript strict mode
- Follow existing conventions
- Prefer functional components with hooks
- Use Tailwind utility classes
- Implement smooth transitions (250ms/350ms)

### Git Workflow
- Branch: `feat-aether-phase1-next14-ts-tailwind-warmwind-zustand-setup`
- Commit messages should be clear and descriptive
- Break changes into logical commits

## 📄 License

[Add your license here]

## 👥 Contributors

[Add contributors here]

---

**Built with ❤️ using Next.js 14, TypeScript, and the Warmwind Design System**
