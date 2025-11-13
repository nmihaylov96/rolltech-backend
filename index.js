import dotenv from "dotenv";
dotenv.config();
 
import express from "express";
import cors from "cors";
import { Resend } from "resend";
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
 
/* ------------------------------- RESEND INIT ------------------------------ */
 
// вземи API ключа от .env
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.warn("⚠️ Липсва RESEND_API_KEY в .env — имейлите няма да се пращат!");
}
const resend = new Resend(resendApiKey);
 
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
 
    if (!resendApiKey) {
      console.warn("⚠️ Имейл не е конфигуриран (липсва RESEND_API_KEY)");
    } else {
      try {
        // изпрати имейл чрез Resend API
        const response = await resend.emails.send({
          from: "RollTech <noreply@rolltech-doors.com>", // можеш да смениш домейна
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
 
        console.log("✅ Имейл изпратен успешно!", response);
      } catch (err) {
        console.error("⚠️ Грешка при изпращане на имейл (Resend):", {
          name: err?.name,
          message: err?.message,
          stack: err?.stack,
        });
      }
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
    emailConfigured: !!resendApiKey,
  });
});
 
/* ------------------------------ SERVER START ------------------------------ */
 
const port = parseInt(process.env.PORT || "3000", 10);
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Backend running on port ${port}`);
  console.log(`📧 Resend API Key: ${resendApiKey ? "SET" : "NOT SET"}`);
});
