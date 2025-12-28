# AETHER-OS

Project Aether is a production-ready AI OS experience built with Next.js 14 and the "Warmwind" design system.

## Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Project Structure
- `/app`: Next.js App Router (layouts, pages, API routes)
- `/components`: UI components (Desktop, Windows, UI primitives)
- `/lib`:
  - `/stores`: Zustand store definitions
  - `/types`: TypeScript interfaces and types
  - `/utils`: Helper functions
- `/styles`: Global CSS, Tailwind config, and animation presets

### Warmwind Design System
The "Warmwind" aesthetic focuses on a deep, dark canvas with warm accents (Amber, Orange, Rose) and glassmorphism effects.

- **Background**: Deep Black (#0f0f0f)
- **UI Elements**: Glassmorphism (Backdrop blur, semi-transparent backgrounds, subtle borders)
- **Typography**: Inter / Geist Sans
- **Transitions**: Smooth 250ms/350ms presets

## Getting Started

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Environment Variables
Copy `.env.local.example` to `.env.local` and fill in your API keys:
```bash
cp .env.local.example .env.local
```
