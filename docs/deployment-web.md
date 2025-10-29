# Deployment Guide - Dyad Web Platform

## Prerequisites

- Node.js 20 or higher
- npm or yarn
- Optional: PostgreSQL database (for server-side storage)
- Optional: S3-compatible storage (for file storage)

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and configure:

```bash
cp .env.web.example .env.web
```

Edit `.env.web` with your configuration.

### 3. Build the Web Version

```bash
npm run build:web
```

### 4. Start the Development Server

```bash
# Terminal 1: Start backend server
npm run server:dev

# Terminal 2: Start frontend dev server
npm run web:dev
```

The application will be available at `http://localhost:3000`

## Production Deployment

### Option 1: Docker Deployment

```bash
# Build Docker image
docker build -f Dockerfile.web -t dyad-web .

# Run container
docker run -p 8080:8080 -e NODE_ENV=production dyad-web
```

### Option 2: Vercel Deployment

1. Install Vercel CLI: `npm install -g vercel`
2. Configure `vercel.json`
3. Deploy: `vercel --prod`

### Option 3: Traditional Server (Ubuntu/Debian)

```bash
# Install dependencies
npm ci --production

# Build
npm run build:web

# Start with PM2
npm install -g pm2
pm2 start src/server/index.js --name dyad-web
pm2 save
pm2 startup
```

## Configuration

### Database Setup

For production, configure a PostgreSQL database:

```bash
# Set in .env.web
DATABASE_URL=postgresql://user:password@localhost:5432/dyad

# Run migrations
npm run db:migrate
```

### File Storage

Configure cloud storage for user files:

```bash
# AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=dyad-files

# Or use another S3-compatible service (Backblaze B2, DigitalOcean Spaces, etc.)
```

### SSL/HTTPS

For production, use a reverse proxy (Nginx/Caddy) with SSL:

```nginx
server {
    listen 443 ssl http2;
    server_name dyad.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

## Environment Variables

See `.env.web.example` for all available configuration options.

## Security Considerations

1. Always use HTTPS in production
2. Set strong `SESSION_SECRET`
3. Configure CORS properly
4. Use environment variables for sensitive data
5. Implement rate limiting
6. Regular security updates

## Monitoring

Consider adding monitoring tools:
- Application: PM2, New Relic, or Sentry
- Infrastructure: Prometheus, Grafana
- Logs: ELK Stack or CloudWatch

## Scaling

For high traffic:
1. Use load balancer (Nginx, HAProxy)
2. Scale horizontally with multiple instances
3. Use Redis for session storage
4. CDN for static assets
5. Database read replicas

## Troubleshooting

### Port already in use
```bash
# Find process using port 8080
lsof -i :8080
# Kill process
kill -9 <PID>
```

### WebSocket connection issues
- Check firewall rules
- Verify proxy configuration for WebSocket upgrade
- Check CORS settings

### Database connection errors
- Verify DATABASE_URL
- Check database server is running
- Verify credentials and permissions
