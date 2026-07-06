import { createServerFn } from "@tanstack/react-start";
import nodemailer from "nodemailer";

interface EmailPayload {
  title: string;
  category: string;
  content: string;
  author: string;
  imageUrl?: string;
  subscribers: Array<{ email: string; displayName: string }>;
}

export const sendAnnouncementNotification = createServerFn({ method: "POST" })
  .validator((d: EmailPayload) => d)
  .handler(async ({ data }) => {
    const { title, category, content, author, imageUrl, subscribers } = data;

    if (subscribers.length === 0) {
      console.log("No newsletter subscribers to notify.");
      return { success: true, count: 0 };
    }

    // SMTP Configuration from environment variables
    const host = process.env.SMTP_HOST?.trim();
    const port = parseInt(process.env.SMTP_PORT?.trim() || "587");
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    const from = process.env.SMTP_FROM || (user ? `"AMOI" <${user}>` : `"AMOI" <no-reply@amoi.org>`);

    console.log(`Sending newsletter email for: "${title}" to ${subscribers.length} subscribers.`);

    // If SMTP is NOT configured, simulate sending by logging to console
    if (!host || !user || !pass) {
      console.log("\n=========================================");
      console.log("MOCK EMAIL DISPATCH (No SMTP Configured)");
      console.log(`From: ${from}`);
      console.log(`Subject: [AMOI] ${category}: ${title}`);
      console.log(`To (BCC): ${subscribers.map(s => s.email).join(", ")}`);
      console.log("HTML Content:");
      console.log(`  Title: ${title}`);
      console.log(`  Category: ${category}`);
      console.log(`  Author: ${author}`);
      if (imageUrl) console.log(`  Image: ${imageUrl.substring(0, 80)}...`);
      console.log(`  Body: ${content.substring(0, 150)}...`);
      console.log("=========================================\n");
      return { success: true, mock: true, count: subscribers.length };
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for 587/25
        auth: {
          user,
          pass,
        },
      });

      // Prepare HTML template matching AMOI design branding
      const htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; border-bottom: 2px solid #D4A017; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="color: #D4A017; margin: 0; font-family: Georgia, serif; font-size: 26px;">AMOI</h2>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Associação Ministério de Oração e Intercessão</p>
          </div>
          
          <span style="display: inline-block; padding: 4px 10px; font-size: 10px; font-weight: bold; background-color: rgba(212,160,23,0.15); color: #D4A017; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid rgba(212,160,23,0.3); margin-bottom: 15px;">
            ${category}
          </span>
          
          <h1 style="color: #111; font-size: 22px; margin: 0 0 15px 0;">${title}</h1>
          
          <p style="color: #444; font-size: 14px; line-height: 1.6; margin-bottom: 20px; white-space: pre-wrap;">
            ${content}
          </p>
          
          ${imageUrl ? `
            <div style="margin: 20px 0; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; max-height: 300px;">
              <img src="${imageUrl}" alt="${title}" style="width: 100%; height: auto; max-height: 300px; object-fit: cover; display: block;" />
            </div>
          ` : ""}
          
          <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 25px; color: #888; font-size: 11px;">
            <p style="margin: 0;">Publicado por: <strong>${author}</strong></p>
            <p style="margin: 5px 0 0 0;">Esta é uma notificação automática para os membros registados da AMOI. Se deseja cancelar a receção de comunicações, atualize as suas preferências no seu perfil de membro no portal.</p>
          </div>
        </div>
      `;

      const emailsList = subscribers.map(s => s.email);

      await transporter.sendMail({
        from: { name: "AMOI", address: user },
        to: user, // Send to self (raw email string)
        bcc: emailsList, // BCC all subscribers
        subject: `[AMOI] ${category}: ${title}`,
        html: htmlBody,
      });

      return { success: true, count: subscribers.length };
    } catch (e: any) {
      console.error("Nodemailer transport error:", e);
      return { success: false, error: e.message || "Failed to dispatch email" };
    }
  });
