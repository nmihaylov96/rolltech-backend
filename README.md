# Rolltech Backend

Backend API за Rolltech garage door website.

## Deployment в Render.com

1. Push това repo в GitHub
2. В Render: New Web Service → Connect repo
3. Настройки:
   - Build Command: `npm install`
   - Start Command: `node index.js`
   - Environment Variables:
     - HOSTINGER_EMAIL
     - HOSTINGER_PASSWORD
     - NODE_ENV=production
     - PORT=3000

## Local Development

```bash
npm install
npm run dev
```

## Environment Variables

```
HOSTINGER_EMAIL=info@your-domain.com
HOSTINGER_PASSWORD=your-email-password
NODE_ENV=development
PORT=3000
```
