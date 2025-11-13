// server/index.ts
import dotenv from "dotenv";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { z } from "zod";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  users;
  contactRequests;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.contactRequests = /* @__PURE__ */ new Map();
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async createContactRequest(insertRequest) {
    const id = randomUUID();
    const contactRequest = {
      ...insertRequest,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.contactRequests.set(id, contactRequest);
    return contactRequest;
  }
  async getContactRequests() {
    return Array.from(this.contactRequests.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var contactRequests = pgTable("contact_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  service: text("service").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertContactRequestSchema = createInsertSchema(contactRequests).pick({
  name: true,
  lastName: true,
  phone: true,
  email: true,
  service: true,
  message: true
});

// server/email.ts
import nodemailer from "nodemailer";
var createTransporter = () => {
  if (process.env.HOSTINGER_EMAIL && process.env.HOSTINGER_PASSWORD) {
    return nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 587,
      secure: false,
      // true for 465, false for other ports
      auth: {
        user: process.env.HOSTINGER_EMAIL,
        pass: process.env.HOSTINGER_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  if (process.env.SMTP2GO_API_KEY) {
    return nodemailer.createTransport({
      host: "mail.smtp2go.com",
      port: 2525,
      auth: {
        user: process.env.SMTP2GO_USERNAME,
        pass: process.env.SMTP2GO_API_KEY
      }
    });
  }
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }
  if (process.env.GMAIL_USER && process.env.GMAIL_PASSWORD) {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return null;
};
var getServiceInBulgarian = (service) => {
  const serviceMap = {
    "sectional": "\u0421\u0435\u043A\u0446\u0438\u043E\u043D\u043D\u0438 \u0432\u0440\u0430\u0442\u0438",
    "roller": "\u0420\u043E\u043B\u0435\u0442\u043D\u0438 \u0432\u0440\u0430\u0442\u0438",
    "berry": "\u0412\u0440\u0430\u0442\u0438 Berry",
    "installation": "\u041C\u043E\u043D\u0442\u0430\u0436",
    "repair": "\u0420\u0435\u043C\u043E\u043D\u0442",
    "maintenance": "\u041F\u043E\u0434\u0434\u0440\u044A\u0436\u043A\u0430",
    "consultation": "\u041A\u043E\u043D\u0441\u0443\u043B\u0442\u0430\u0446\u0438\u044F"
  };
  return serviceMap[service] || service;
};
var sendContactNotification = async (contactData) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log("=".repeat(50));
      console.log("\u041D\u041E\u0412\u041E \u0417\u0410\u041F\u0418\u0422\u0412\u0410\u041D\u0415 \u041E\u0422 \u0423\u0415\u0411\u0421\u0410\u0419\u0422\u0410:");
      console.log("=".repeat(50));
      console.log(`\u0418\u043C\u0435: ${contactData.name} ${contactData.lastName}`);
      console.log(`\u0418\u043C\u0435\u0439\u043B: ${contactData.email}`);
      console.log(`\u0422\u0435\u043B\u0435\u0444\u043E\u043D: ${contactData.phone}`);
      console.log(`\u0423\u0441\u043B\u0443\u0433\u0430: ${getServiceInBulgarian(contactData.service)}`);
      console.log(`\u0421\u044A\u043E\u0431\u0449\u0435\u043D\u0438\u0435: ${contactData.message}`);
      console.log("=".repeat(50));
      console.log("\u0417\u0410 \u0418\u0417\u041F\u0420\u0410\u0429\u0410\u041D\u0415 \u041D\u0410 \u0418\u041C\u0415\u0419\u041B\u0418 \u0414\u041E\u0411\u0410\u0412\u0415\u0422\u0415 EMAIL \u041D\u0410\u0421\u0422\u0420\u041E\u0419\u041A\u0418");
      console.log("=".repeat(50));
      return true;
    }
    const mailOptions = {
      from: process.env.HOSTINGER_EMAIL || process.env.GMAIL_USER || process.env.SMTP2GO_USERNAME || "noreply@rolltech.bg",
      to: "rolltech2020@gmail.com",
      subject: `\u041D\u043E\u0432\u043E \u0437\u0430\u043F\u0438\u0442\u0432\u0430\u043D\u0435 \u043E\u0442 ${contactData.name} ${contactData.lastName} - RollTech`,
      html: `
        <h2>\u041D\u043E\u0432\u043E \u0437\u0430\u043F\u0438\u0442\u0432\u0430\u043D\u0435 \u043E\u0442 \u0443\u0435\u0431\u0441\u0430\u0439\u0442\u0430</h2>
        <p><strong>\u0418\u043C\u0435:</strong> ${contactData.name} ${contactData.lastName}</p>
        <p><strong>\u0418\u043C\u0435\u0439\u043B:</strong> ${contactData.email}</p>
        <p><strong>\u0422\u0435\u043B\u0435\u0444\u043E\u043D:</strong> ${contactData.phone}</p>
        <p><strong>\u0423\u0441\u043B\u0443\u0433\u0430:</strong> ${getServiceInBulgarian(contactData.service)}</p>
        <p><strong>\u0421\u044A\u043E\u0431\u0449\u0435\u043D\u0438\u0435:</strong></p>
        <p>${contactData.message}</p>
        <hr>
        <p><small>\u0418\u0437\u043F\u0440\u0430\u0442\u0435\u043D\u043E \u043E\u0442 RollTech \u0443\u0435\u0431\u0441\u0430\u0439\u0442</small></p>
      `
    };
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to rolltech2020@gmail.com");
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    console.log("=".repeat(50));
    console.log("\u041D\u041E\u0412\u041E \u0417\u0410\u041F\u0418\u0422\u0412\u0410\u041D\u0415 (EMAIL \u041D\u0415\u0423\u0421\u041F\u0415\u0428\u0415\u041D):");
    console.log("=".repeat(50));
    console.log(`\u0418\u043C\u0435: ${contactData.name} ${contactData.lastName}`);
    console.log(`\u0418\u043C\u0435\u0439\u043B: ${contactData.email}`);
    console.log(`\u0422\u0435\u043B\u0435\u0444\u043E\u043D: ${contactData.phone}`);
    console.log(`\u0423\u0441\u043B\u0443\u0433\u0430: ${getServiceInBulgarian(contactData.service)}`);
    console.log(`\u0421\u044A\u043E\u0431\u0449\u0435\u043D\u0438\u0435: ${contactData.message}`);
    console.log("=".repeat(50));
    return false;
  }
};

// server/routes.ts
async function registerRoutes(app2) {
  app2.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactRequestSchema.parse(req.body);
      const contactRequest = await storage.createContactRequest(validatedData);
      const emailSent = await sendContactNotification({
        name: contactRequest.name,
        lastName: contactRequest.lastName,
        email: contactRequest.email,
        phone: contactRequest.phone,
        service: contactRequest.service,
        message: contactRequest.message
      });
      console.log("New contact request received:", {
        id: contactRequest.id,
        name: contactRequest.name,
        email: contactRequest.email,
        service: contactRequest.service,
        emailSent,
        createdAt: contactRequest.createdAt
      });
      res.status(201).json({
        success: true,
        message: "Contact request submitted successfully",
        id: contactRequest.id
      });
    } catch (error) {
      console.error("Error creating contact request:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Invalid form data",
          errors: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error"
        });
      }
    }
  });
  app2.get("/api/contact-requests", async (req, res) => {
    try {
      const requests = await storage.getContactRequests();
      res.json({
        success: true,
        requests
      });
    } catch (error) {
      console.error("Error fetching contact requests:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
dotenv.config();
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.HOST || "0.0.0.0";
  server.listen(port, host, () => {
    log(`Serving on http://${host}:${port}`);
  });
})();
