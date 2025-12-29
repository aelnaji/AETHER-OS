# AETHER-OS - Phase 3: Bytebot Integration

## Overview

AETHER-OS is now integrated with Bytebot backend using NVIDIA API for LLM access. This setup provides real command execution, file management, and terminal access through a Dockerized environment.

## Quick Start (3 Steps)

### Step 1: Get NVIDIA API Key

1. Go to https://build.nvidia.com/
2. Sign up / Log in
3. Navigate to API keys
4. Create new API key
5. Copy the key

### Step 2: Start Docker Stack

```bash
# Clone/navigate to Bytebot monorepo with AETHER-OS integrated
cd bytebot

# Set your NVIDIA API key
export NVIDIA_API_KEY=your_nvidia_api_key_here

# Start all services
docker-compose -f docker/docker-compose.yml up -d

# Wait for services to start (~30 seconds)
# Check status: docker-compose ps
```

### Step 3: Open AETHER-OS

```
Open browser: http://localhost:3000

You'll see:
- AETHER-OS desktop with AETHER CHAT window
- Settings icon in top-right
```

### Step 4: Configure LLM (First Time)

1. Click ⚙️ Settings icon
2. Paste your NVIDIA API key in "API Key" field
3. Select model: meta/llama-3.1-405b-instruct (default recommended)
4. Click "Test Connection" → Should show ✓ Connected
5. Click "Save Settings"
6. Close Settings panel
7. Start chatting with A.E!

### Step 5: A.E Starts Working

Example interactions:
- "Create a Python script to count files"
- "Install VS Code and open it"
- "Clone a GitHub repo and run npm install"
- "List all files in the current directory"
- "Create a hello-world.js file"

A.E will autonomously execute commands via Bytebot backend!

## Architecture

```
AETHER-OS Frontend
    ↓ (Socket.IO / HTTP)
Bytebot Backend Services (NestJS)
    ↓ (HTTP)
NVIDIA API (https://integrate.api.nvidia.com/v1)
    ↓
LLM Response (real AI decision-making via Llama/Mistral)
    ↓ (tool calls)
Bytebotd / File System / Code Execution
    ↓
Real operating system control & results
    ↓ (Socket.IO)
AETHER-OS Frontend (display results)
```

## Docker Services

- **PostgreSQL**: Database for Bytebot persistence
- **Bytebot Agent**: Main orchestration service (NestJS)
- **Bytebotd**: Desktop control & terminal service
- **AETHER-OS**: Next.js frontend with real terminal integration

## Features

✅ **Real Command Execution**: Commands execute on actual Bytebot backend
✅ **NVIDIA Cloud Models**: Access to Llama 3.1 405B, Mistral Large, etc.
✅ **Real Terminal**: Full terminal access with real output
✅ **File System Integration**: Real file operations
✅ **Settings Panel**: Configure NVIDIA API and LLM parameters
✅ **Socket.IO Integration**: Real-time communication with Bytebot

## Development

### Install Dependencies

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm run start
```

## Configuration

Create a `.env.local` file based on `.env.local.example`:

```env
# NVIDIA API Configuration
NVIDIA_API_KEY=your_nvidia_api_key_here
NEXT_PUBLIC_LLM_ENDPOINT=https://integrate.api.nvidia.com/v1
NEXT_PUBLIC_DEFAULT_MODEL=meta/llama-3.1-405b-instruct

# Bytebot Backend
NEXT_PUBLIC_BYTEBOT_ENDPOINT=http://localhost:3001

# Database
DATABASE_URL=postgresql://aether:aether_local@localhost:5432/bytebot

# Node Environment
NODE_ENV=development
```

## Available NVIDIA Models

- `meta/llama-3.1-405b-instruct` (recommended)
- `mistralai/mistral-large`
- `meta/llama-3.1-70b-instruct`
- `qwen/qwen-1.5-32b-chat`
- `mistralai/mistral-7b-instruct`

## Troubleshooting

### Connection Issues

- Ensure Docker is running
- Check that all services are healthy: `docker-compose ps`
- Verify NVIDIA API key is correct
- Check browser console for errors

### Terminal Not Working

- Ensure Bytebotd service is running
- Check Socket.IO connection in browser dev tools
- Verify terminal output is being streamed

## License

MIT License - See LICENSE file for details.