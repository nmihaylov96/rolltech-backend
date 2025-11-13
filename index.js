import dotenv from "dotenv";
dotenv.config();
 
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import { z } from "zod";
 
const app = express();
 
/* ---------------------------- BASIC MIDDLEWARE ---------------------------- */
 
app.use(
  cors({
    origin: ["https://rolltech-doors.com", "https://www.rolltech-doors.com"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
 
// кратък request logger
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl}`);
  if (req.method === "POST" && req.originalUrl === "/api/contact") {
    console.log("Payload:", JSON.stringify(req.body).slice(0, 1000));
  }
  next();
});
 
/* ------------------------------- TRANSPORTER ------------------------------ */
 
function createTransporter() {
  const { GMAIL_USER, GMAIL_PASSWORD } = process.env;
 
  if (!GMAIL_USER || !GMAIL_PASSWORD) {
    console.warn("⚠️  Липсва GMAIL_USER или GMAIL_PASSWORD");
    return null;
  }
 
  console.log("📧 Създавам SMTP транспортер за:", GMAIL_USER);
 
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // SSL
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASSWORD,
    },
    connectionTimeout: 20000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    family: 4, // IPv4 само (Render често има IPv6 проблеми)
    logger: true,
    debug: true,
    tls: {
      servername: "smtp.gmail.com",
    },
  });
}
 
/* ------------------------------ HELPER FUNCS ------------------------------ */
 
const getServiceInBulgarian = (service) => {
  const map = {
    sectional: "Секционни врати",
    roller: "Ролетни врати",
    berry: "Врати Berry",
    installation: "Монтаж",
    repair: "Ремонт",
    maintenance: "Поддръжка",
    consultation: "Консултация",
  };
  return map[service] || service;
};
 
const contactSchema = z.object({
  name: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  service: z.string().min(1),
  message: z.string().min(1),
});
 
/* ------------------------------ API ENDPOINT ------------------------------ */
 
app.post("/api/contact", async (req, res) => {
  try {
    const data = contactSchema.parse(req.body);
 
    console.log("=".repeat(60));
    console.log("📩 НОВО ЗАПИТВАНЕ ОТ УЕБСАЙТА:");
    console.log(`👤 ${data.name} ${data.lastName}`);
    console.log(`📧 ${data.email}`);
    console.log(`📱 ${data.phone}`);
    console.log(`🔧 ${getServiceInBulgarian(data.service)}`);
    console.log(`💬 ${data.message}`);
    console.log("=".repeat(60));
 
    const transporter = createTransporter();
    if (transporter) {
      try {
        console.log("🔎 Проверявам SMTP връзка (verify)...");
        await transporter.verify();
        console.log("✅ SMTP връзката е активна. Изпращам имейл...");
 
        const info = await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: "rolltech2020@gmail.com",
          subject: `Ново запитване от ${data.name} ${data.lastName} - RollTech`,
          html: `
<h2>Ново запитване от уебсайта</h2>
<p><strong>Име:</strong> ${data.name} ${data.lastName}</p>
<p><strong>Имейл:</strong> ${data.email}</p>
<p><strong>Телефон:</strong> ${data.phone}</p>
<p><strong>Услуга:</strong> ${getServiceInBulgarian(data.service)}</p>
<p><strong>Съобщение:</strong></p>
<p>${data.message}</p>
          `,
        });
 
        console.log("✅ Имейл изпратен успешно!", {
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected,
          response: info.response,
        });
      } catch (err) {
        console.error("⚠️ Email грешка (заявката е приета, но имейл не е пратен):", {
          name: err?.name,
          code: err?.code,
          command: err?.command,
          response: err?.response?.toString?.() ?? err?.response,
          message: err?.message,
          stack: err?.stack,
        });
      }
    } else {
      console.warn(
        "⚠️ Email не е конфигуриран - добавете GMAIL_USER и GMAIL_PASSWORD в .env"
      );
    }
 
    return res
      .status(201)
      .json({ success: true, message: "Contact request submitted successfully" });
  } catch (error) {
    console.error("❌ Contact error:", {
      type: error?.constructor?.name,
      message: error?.message,
      issues: error?.issues,
    });
    return res.status(400).json({
      success: false,
      message:
        error instanceof z.ZodError ? "Invalid form data" : "Internal server error",
    });
  }
});
 
/* ------------------------------ HEALTH CHECK ------------------------------ */
 
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    emailConfigured: !!(process.env.GMAIL_USER && process.env.GMAIL_PASSWORD),
  });
});
 
/* ------------------------------ SERVER START ------------------------------ */
 
const port = parseInt(process.env.PORT || "3000", 10);
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Backend running on port ${port}`);
  console.log(`📧 Email: ${process.env.GMAIL_USER || "NOT SET"}`);
});
