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
npm start
```

### Environment Variables (добавете в Render)
```
HOSTINGER_EMAIL=info@your-domain.com
HOSTINGER_PASSWORD=your-email-password
NODE_ENV=production
PORT=3000
```

## Production Features

- ✅ TypeScript изпълнение с tsx loader (БЕЗ bundling проблеми)
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
npm start
```

Backend ще стартира на: http://localhost:3000
