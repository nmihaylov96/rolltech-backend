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

const contactSchema = z.object({
  name: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  service: z.string().min(1),
  message: z.string().min(1)
});

app.post("/api/contact", async (req, res) => {
  try {
    const data = contactSchema.parse(req.body);
    
    console.log('='.repeat(60));
    console.log('📩 НОВО ЗАПИТВАНЕ ОТ УЕБСАЙТА:');
    console.log('='.repeat(60));
    console.log(`👤 Име: ${data.name} ${data.lastName}`);
    console.log(`📧 Имейл: ${data.email}`);
    console.log(`📱 Телефон: ${data.phone}`);
    console.log(`🔧 Услуга: ${getServiceInBulgarian(data.service)}`);
    console.log(`💬 Съобщение: ${data.message}`);
    console.log('='.repeat(60));
    
    const transporter = createTransporter();
    
    if (transporter) {
      try {
        await Promise.race([
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
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
        ]);
        console.log('✅ Email изпратен успешно!');
      } catch (err) {
        console.log('⚠️ Email грешка, но запитването е записано');
      }
    } else {
      console.log('⚠️ Email не е конфигуриран - добавете GMAIL_USER и GMAIL_PASSWORD');
    }
    
    console.log('='.repeat(60));
    
    res.status(201).json({
      success: true,
      message: "Contact request submitted successfully"
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({
      success: false,
      message: error instanceof z.ZodError ? "Invalid form data" : "Internal server error"
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

const port = parseInt(process.env.PORT || "3000", 10);
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Backend running on port ${port}`);
  console.log(`📧 Email: ${process.env.GMAIL_USER || 'NOT SET'}`);
});
