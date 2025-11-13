import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertContactRequestSchema } from "@shared/schema";
import { sendContactNotification } from "./email";

export async function registerRoutes(app: Express): Promise<Server> {
  // Contact form submission endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      // Validate the request body
      const validatedData = insertContactRequestSchema.parse(req.body);
      
      // Create the contact request
      const contactRequest = await storage.createContactRequest(validatedData);
      
      // Send email notification
      const emailSent = await sendContactNotification({
        name: contactRequest.name,
        lastName: contactRequest.lastName,
        email: contactRequest.email,
        phone: contactRequest.phone,
        service: contactRequest.service,
        message: contactRequest.message,
      });
      
      console.log('New contact request received:', {
        id: contactRequest.id,
        name: contactRequest.name,
        email: contactRequest.email,
        service: contactRequest.service,
        emailSent: emailSent,
        createdAt: contactRequest.createdAt,
      });

      res.status(201).json({
        success: true,
        message: "Contact request submitted successfully",
        id: contactRequest.id,
      });
    } catch (error) {
      console.error("Error creating contact request:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Invalid form data",
          errors: error.errors,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  });

  // Get all contact requests (admin endpoint)
  app.get("/api/contact-requests", async (req, res) => {
    try {
      const requests = await storage.getContactRequests();
      res.json({
        success: true,
        requests,
      });
    } catch (error) {
      console.error("Error fetching contact requests:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
