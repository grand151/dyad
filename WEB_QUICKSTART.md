# 🚀 Dyad Web Platform Quick Start Guide

This guide will help you get started with the Dyad web platform in minutes.

## Prerequisites

- Node.js 20 or higher
- npm or yarn
- Modern web browser (Chrome 90+, Edge 90+, Firefox 88+, Safari 14+)

## Quick Start - Development

### 1. Clone and Install

```bash
git clone https://github.com/grand151/dyad.git
cd dyad
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.web.example .env.web

# Edit .env.web with your configuration
# At minimum, set SESSION_SECRET to a random string
```

### 3. Start Development Servers

Open two terminal windows:

**Terminal 1 - Backend Server:**
```bash
npm run server:dev
```

**Terminal 2 - Frontend Dev Server:**
```bash
npm run web:dev
```

### 4. Open Your Browser

Navigate to: **http://localhost:3000**

The app should now be running! 🎉

## Quick Start - Production

### Option 1: Docker (Recommended)

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.web.yml up -d

# Access at http://localhost:8080
```

### Option 2: Manual Build

```bash
# Build both frontend and backend
npm run build:web

# Start production server
npm run start:web

# Access at http://localhost:8080
```

## PWA Installation

Once the app is running in your browser:

1. Look for the install prompt (bottom of screen)
2. Click "Install"
3. The app will be installed as a standalone application
4. Launch from your app menu or home screen

## Features Overview

### 🌐 Web Platform
- Runs in any modern web browser
- No desktop app installation required
- Access from any device

### 📱 Progressive Web App (PWA)
- Install as standalone app
- Works offline
- Auto-updates
- App-like experience

### 🔧 Flexible Architecture
- Same codebase for desktop and web
- Supports multiple database backends
- Adaptable file system handling
- Platform-agnostic design

## Available Scripts

### Development
- `npm run web:dev` - Start frontend dev server
- `npm run server:dev` - Start backend dev server

### Building
- `npm run web:build` - Build frontend for production
- `npm run server:build` - Build backend for production
- `npm run build:web` - Build both frontend and backend

### Running
- `npm run web:preview` - Preview built frontend
- `npm run server:start` - Start production server
- `npm run start:web` - Build and start production

### Electron (Desktop)
- `npm start` - Run desktop app
- `npm run package` - Package desktop app
- `npm run make` - Create installers

## Configuration

### Environment Variables

Key variables in `.env.web`:

```bash
# Server
PORT=8080                    # Server port
NODE_ENV=development         # development or production
SESSION_SECRET=your-secret   # Session encryption key

# Client
CLIENT_URL=http://localhost:3000  # Frontend URL

# Database (optional)
DATABASE_URL=postgresql://...     # PostgreSQL connection

# Storage (optional)
AWS_ACCESS_KEY_ID=...            # S3 for file storage
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser / PWA                      │
│  ┌───────────────────────────────────────────────┐ │
│  │          React Frontend (Vite)                 │ │
│  │  • Platform Detection                          │ │
│  │  • Adapter Layer (IPC, FS, DB)                │ │
│  │  • Service Worker (PWA)                       │ │
│  └───────────────────────────────────────────────┘ │
│           │                                          │
│           │ REST API / WebSocket                     │
│           ▼                                          │
│  ┌───────────────────────────────────────────────┐ │
│  │       Express Backend (Node.js)               │ │
│  │  • API Routes                                 │ │
│  │  • WebSocket Server                           │ │
│  │  • Session Management                         │ │
│  │  • File Storage                               │ │
│  │  • Database Access                            │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Platform Adapters

The web version uses intelligent adapters that automatically choose the best implementation:

### IPC Adapter
- **Electron**: Native IPC
- **Web**: REST API + WebSocket

### File System Adapter
- **Electron**: Node.js `fs` module
- **Chrome/Edge**: File System Access API
- **Other Browsers**: Virtual in-memory file system

### Database Adapter
- **Electron**: SQLite (better-sqlite3)
- **Web Client**: IndexedDB
- **Web Server**: PostgreSQL/MySQL

## Browser Support

### Fully Supported
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

### Features by Browser

| Feature | Chrome/Edge | Firefox | Safari |
|---------|-------------|---------|--------|
| PWA Install | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ |
| File System API | ✅ | ❌* | ❌* |
| IndexedDB | ✅ | ✅ | ✅ |
| WebSocket | ✅ | ✅ | ✅ |

*Falls back to virtual file system

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8080
npx kill-port 8080

# Or use a different port
PORT=8081 npm run server:dev
```

### Service Worker Not Registering
- Service Workers require HTTPS (except on localhost)
- Clear browser cache and reload
- Check browser console for errors

### Build Errors
```bash
# Clean and reinstall
npm run clean
rm -rf node_modules
npm install
```

## Next Steps

1. **Customize Configuration**: Edit `.env.web` for your needs
2. **Read Full Docs**: See `docs/web-platform.md` for detailed info
3. **Deploy**: Follow `docs/deployment-web.md` for production
4. **Develop**: Start building with the platform adapters

## Resources

- 📖 [Full Web Platform Documentation](docs/web-platform.md)
- 🚀 [Deployment Guide](docs/deployment-web.md)
- 🏗️ [Architecture Overview](docs/architecture.md)
- 💬 [Community Reddit](https://www.reddit.com/r/dyadbuilders/)

## Getting Help

- Check the [troubleshooting section](docs/web-platform.md#troubleshooting)
- Search existing [GitHub issues](https://github.com/grand151/dyad/issues)
- Ask on [Reddit community](https://www.reddit.com/r/dyadbuilders/)
- Open a new issue with details

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

When contributing to web platform:
1. Test on both Electron and Web
2. Use platform adapters for platform-specific code
3. Ensure PWA features work
4. Test responsive design
5. Verify offline functionality

---

**Happy Building! 🎨**
