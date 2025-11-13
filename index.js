import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import { z } from "zod";

const app = express();

app.use(cors({
  origin: ['https://rolltech-doors.com', 'https://www.rolltech-doors.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Прост middleware за логване на всички заявки (не чупи нищо) ---
app.use((req, res, next) => {
  const now = new Date().toISOString();
  // лога е кратък, но дава време, ip, метод и url
  console.log(`[${now}] ${req.ip} ${req.method} ${req.originalUrl}`);
  // за POST /api/contact можем да логнем и body (само ако е необходимо)
  if (req.method === 'POST' && req.originalUrl === '/api/contact') {
    console.log('Payload:', JSON.stringify(req.body).slice(0, 1000)); // ограничение за големи тела
  }
  next();
});

// --- Transporter factory (взима GMAIL_USER и GMAIL_PASSWORD от env) ---
const createTransporter = () => {
  if (process.env.GMAIL_USER && process.env.GMAIL_PASSWORD) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
      }
    });
  }
  return null;
};

// --- Помощна функция за показване на услугата на български ---
const getServiceInBulgarian = (service) => {
  const serviceMap = {
    'sectional': 'Секционни врати',
    'roller': 'Ролетни врати',
    'berry': 'Врати Berry',
    'installation': 'Монтаж',
    'repair': 'Ремонт',
    'maintenance': 'Поддръжка',
    'consultation': 'Консултация'
  };
  return serviceMap[service] || service;
};

// --- Валидация със Zod ---
const contactSchema = z.object({
  name: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  service: z.string().min(1),
  message: z.string().min(1)
});

// --- Contact endpoint (с timeout за sendMail и безопасно поведение ако няма конфиг) ---
app.post("/api/contact", async (req, res) => {
  try {
    const data = contactSchema.parse(req.body);

    console.log('='.repeat(60));
    console.log('📩 НОВО ЗАПИТВАНЕ ОТ УЕБСАЙТА:');
    console.log(`👤 Име: ${data.name} ${data.lastName}`);
    console.log(`📧 Имейл: ${data.email}`);
    console.log(`📱 Телефон: ${data.phone}`);
    console.log(`🔧 Услуга: ${getServiceInBulgarian(data.service)}`);
    console.log(`💬 Съобщение: ${data.message}`);
    console.log('='.repeat(60));

    const transporter = createTransporter();

    if (transporter) {
      try {
        // timeout (10s) за да не блокира заявката ако SMTP откаже да отговори
        const info = await Promise.race([
          transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: 'rolltech2020@gmail.com',
            subject: `Ново запитване от ${data.name} ${data.lastName} - RollTech`,
            html: `
              <h2>Ново запитване от уебсайта</h2>
              <p><strong>Име:</strong> ${data.name} ${data.lastName}</p>
              <p><strong>Имейл:</strong> ${data.email}</p>
              <p><strong>Телефон:</strong> ${data.phone}</p>
              <p><strong>Услуга:</strong> ${getServiceInBulgarian(data.service)}</p>
              <p><strong>Съобщение:</strong></p>
              <p>${data.message}</p>
            `
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout sending email')), 10000))
        ]);

        // логваме резултата от sendMail (informативно)
        console.log('✅ Email изпратен!', {
          messageId: info?.messageId,
          accepted: info?.accepted,
          rejected: info?.rejected,
          response: info?.response
        });
      } catch (err) {
        // не прекъсваме потока — заявката е приета, но имейлът не е пратен
        console.error('⚠️ Email грешка (заявката е приета, но имейл не е пратен):', {
          name: err?.name,
          message: err?.message
        });
      }
    } else {
      console.warn('⚠️ Email не е конфигуриран - добавете GMAIL_USER и GMAIL_PASSWORD в .env (или използвайте друг SMTP).');
    }

    return res.status(201).json({ success: true, message: 'Contact request submitted successfully' });
  } catch (error) {
    console.error('❌ Contact error:', {
      type: error?.constructor?.name,
      message: error?.message,
      issues: error?.issues
    });
    return res.status(400).json({
      success: false,
      message: error instanceof z.ZodError ? 'Invalid form data' : 'Internal server error'
    });
  }
});

// --- Health endpoint за проверка на статуса ---
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    emailConfigured: !!(process.env.GMAIL_USER && process.env.GMAIL_PASSWORD)
  });
});

const port = parseInt(process.env.PORT || "3000", 10);
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Backend running on port ${port}`);
  console.log(`📧 Email: ${process.env.GMAIL_USER || 'NOT SET'}`);
});
