# Dyad Web Platform & PWA

This document describes the web platform port of Dyad with Progressive Web App (PWA) functionality.

## Overview

Dyad has been ported to run as a web application with PWA capabilities, allowing it to be:

- Accessed from any modern web browser
- Installed as a standalone app on desktop and mobile devices
- Used offline with cached resources
- Self-hosted on your own infrastructure

## Architecture

The web version maintains a similar architecture to the Electron app but adapts to web constraints:

### Frontend (React)

- Same React UI components as desktop version
- Platform detection layer (`src/lib/platform.ts`)
- Adapter layers for IPC, FileSystem, and Database
- Service Worker for offline capability and caching

### Backend (Node.js/Express)

- REST API replacing Electron IPC handlers
- WebSocket support for real-time communication
- Session-based authentication
- File storage abstraction (local or cloud)
- Database support (PostgreSQL/MySQL or IndexedDB)

### Key Differences from Desktop

| Feature      | Desktop (Electron)      | Web (PWA)                           |
| ------------ | ----------------------- | ----------------------------------- |
| IPC          | Native Electron IPC     | REST API + WebSocket                |
| File System  | Node.js fs module       | File System Access API / Virtual FS |
| Database     | SQLite (better-sqlite3) | IndexedDB / PostgreSQL              |
| Updates      | Auto-updater            | Service Worker updates              |
| Installation | Platform installers     | PWA install prompt                  |

## Quick Start

### Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start development servers:**

   ```bash
   # Terminal 1: Backend server
   npm run server:dev

   # Terminal 2: Frontend dev server
   npm run web:dev
   ```

3. **Access the app:**
   - Open `http://localhost:3000`

### Production Build

```bash
# Build both frontend and backend
npm run build:web

# Start production server
npm run start:web
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.web.yml up -d
```

## Features

### PWA Capabilities

- ✅ **Installable**: Add to home screen on mobile, install as app on desktop
- ✅ **Offline Support**: Service Worker caches assets and API responses
- ✅ **Auto-Updates**: Automatic updates via Service Worker
- ✅ **Responsive**: Works on desktop, tablet, and mobile devices
- ✅ **App-like Experience**: Standalone display mode, custom splash screen

### Platform Adapters

The web version uses adapter layers to abstract platform differences:

#### IPC Adapter (`src/adapters/ipc-adapter.ts`)

- Automatically routes between Electron IPC and HTTP API
- Supports both invoke (request/response) and send (fire and forget)
- WebSocket support for real-time events

#### FileSystem Adapter (`src/adapters/filesystem-adapter.ts`)

- **Electron**: Native Node.js fs module
- **Modern Browsers**: File System Access API
- **Fallback**: Virtual in-memory file system

#### Database Adapter (`src/adapters/database-adapter.ts`)

- **Electron**: SQLite with better-sqlite3
- **Web**: IndexedDB for client-side storage
- **Server**: PostgreSQL/MySQL for server-side storage

## Configuration

### Environment Variables

Copy `.env.web.example` to `.env.web` and configure:

```bash
# Server
PORT=8080
NODE_ENV=production
SESSION_SECRET=your-secret-key

# Database (optional, uses IndexedDB by default)
DATABASE_URL=postgresql://user:pass@host/db

# Storage (optional, for cloud file storage)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket
```

## Deployment Options

### 1. Self-Hosted (Docker)

Best for complete control and privacy:

```bash
docker-compose -f docker-compose.web.yml up -d
```

Includes:

- Dyad web app
- PostgreSQL database
- Nginx reverse proxy

### 2. Cloud Platforms

#### Vercel

```bash
vercel --prod
```

#### Netlify

```bash
netlify deploy --prod
```

#### Railway / Render / Fly.io

See `docs/deployment-web.md` for detailed guides.

### 3. Traditional VPS

Deploy to Ubuntu/Debian server:

```bash
# Install dependencies
npm ci --production

# Build
npm run build:web

# Start with PM2
pm2 start dist-server/index.js --name dyad-web
```

## API Endpoints

The web server exposes these endpoints:

- `GET /health` - Health check
- `POST /api/:method` - IPC method calls
- `WS /ws/:channel` - WebSocket connections for real-time events

## Browser Support

### Minimum Requirements

- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

### Recommended Features

- File System Access API (Chrome 86+, Edge 86+)
- Service Workers (all modern browsers)
- IndexedDB (all modern browsers)

## Limitations

Compared to the desktop version, the web version has these limitations:

1. **File System Access**: Limited by browser security. Users must explicitly grant access to directories.
2. **Local Process Management**: Cannot run local development servers like the desktop version.
3. **System Integration**: No native window management or system tray integration.
4. **Performance**: May be slower for large projects due to browser constraints.

## Development

### Project Structure

```
dyad/
├── src/
│   ├── web/              # Web-specific entry points
│   │   ├── index.tsx     # Web app entry
│   │   └── service-worker.ts
│   ├── server/           # Backend API server
│   │   ├── index.ts      # Express server
│   │   └── package.json
│   ├── adapters/         # Platform adapters
│   │   ├── ipc-adapter.ts
│   │   ├── filesystem-adapter.ts
│   │   └── database-adapter.ts
│   └── lib/
│       └── platform.ts   # Platform detection
├── public/               # PWA assets
│   ├── manifest.json     # PWA manifest
│   └── sw.js            # Service worker
├── vite.config.web.ts   # Web build config
├── Dockerfile.web       # Docker image
└── docker-compose.web.yml
```

### Adding New Features

When adding features that work on both platforms:

1. Use platform detection: `isElectron()` or `isWeb()`
2. Use adapters for platform-specific operations
3. Test on both platforms

Example:

```typescript
import { isElectron } from "@/lib/platform";
import { ipcClient } from "@/adapters/ipc-adapter";

// Works on both platforms
const result = await ipcClient.invoke("some-method", data);
```

## Security

### Best Practices

1. **HTTPS**: Always use HTTPS in production
2. **Environment Variables**: Never commit secrets
3. **CORS**: Configure allowed origins properly
4. **Session Security**: Use secure session cookies
5. **Rate Limiting**: Implement API rate limiting
6. **Input Validation**: Validate all user inputs

### Content Security Policy

The app includes a strict CSP. Modify in `src/server/index.ts` if needed.

## Monitoring

Recommended monitoring setup:

- **Application**: Sentry for error tracking
- **Performance**: Lighthouse CI for PWA metrics
- **Uptime**: UptimeRobot or similar
- **Analytics**: PostHog (already integrated)

## Contributing

When contributing to the web platform:

1. Test on both Electron and Web platforms
2. Use platform adapters for platform-specific code
3. Ensure PWA features work correctly
4. Test offline functionality
5. Verify responsive design

## Troubleshooting

### Service Worker Not Registering

- Check browser console for errors
- Ensure HTTPS (required for SW except localhost)
- Clear browser cache and reload

### File System Access Not Working

- Only works in Chrome/Edge 86+
- User must grant permissions
- Falls back to virtual FS in other browsers

### WebSocket Connection Issues

- Check firewall rules
- Verify proxy configuration for WS upgrade
- Check CORS settings

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [File System Access API](https://web.dev/file-system-access/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

## License

Same as main Dyad project - see [LICENSE](../LICENSE)
