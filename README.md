# Rolltech Backend API

Production-ready backend API for Rolltech garage door website.

## Deployment на Render.com

**ВАЖНО:** Използвайте тези настройки:

### Build Command
```
npm install
```

### Start Command
```
node index.js
```

### Environment Variables
```
HOSTINGER_EMAIL=info@your-domain.com
HOSTINGER_PASSWORD=your-email-password
NODE_ENV=production
PORT=3000
```

## Production Features

- ✅ Само Express API (без Vite dependencies)
- ✅ CORS configured за Hostinger frontend
- ✅ Email service през Hostinger SMTP
- ✅ Health check endpoint: GET /health
- ✅ Request logging
- ✅ Error handling

## API Endpoints

### Contact Form
- POST /api/contact - Изпраща контактна форма

### Health Check
- GET /health - Server status

## Local Testing

```bash
npm install
node index.js
```

Backend ще стартира на: http://localhost:3000
