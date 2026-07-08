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

interface ResetCodePayload {
  email: string;
  code: string;
}

export const sendResetCodeEmail = createServerFn({ method: "POST" })
  .validator((d: ResetCodePayload) => d)
  .handler(async ({ data }) => {
    const { email, code } = data;

    const host = process.env.SMTP_HOST?.trim();
    const port = parseInt(process.env.SMTP_PORT?.trim() || "587");
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    const from = process.env.SMTP_FROM || (user ? `"AMOI" <${user}>` : `"AMOI" <no-reply@amoi.org>`);

    console.log(`Sending password reset code: "${code}" to ${email}.`);

    if (!host || !user || !pass) {
      console.log("\n=========================================");
      console.log("MOCK RESET CODE EMAIL (No SMTP Configured)");
      console.log(`From: ${from}`);
      console.log(`To: ${email}`);
      console.log(`Subject: [AMOI] Recuperação de Palavra-passe`);
      console.log(`Code: ${code}`);
      console.log("=========================================\n");
      return { success: true, mock: true };
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });

      const htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; border-bottom: 2px solid #D4A017; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="color: #D4A017; margin: 0; font-family: Georgia, serif; font-size: 26px;">AMOI</h2>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Associação Ministério de Oração e Intercessão</p>
          </div>
          
          <h1 style="color: #111; font-size: 20px; margin: 0 0 15px 0; text-align: center;">Recuperação de Palavra-passe</h1>
          
          <p style="color: #444; font-size: 14px; line-height: 1.6; text-align: center; margin-bottom: 25px;">
            Recebemos um pedido para redefinir a palavra-passe da sua conta no portal AMOI. Utilize o código de confirmação abaixo para concluir o processo:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; padding: 12px 28px; font-size: 32px; font-weight: bold; background-color: #f9f9f9; color: #D4A017; border-radius: 12px; letter-spacing: 6px; border: 1px solid #eee;">
              ${code}
            </span>
          </div>
          
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 25px;">
            Este código é válido por 15 minutos. Se não solicitou esta alteração, por favor ignore este e-mail.
          </p>
          
          <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 30px; color: #888; font-size: 11px; text-align: center;">
            <p style="margin: 0;">Associação Ministério de Oração e Intercessão · Luanda, Angola</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: { name: "AMOI", address: user },
        to: email,
        subject: `[AMOI] Código de Recuperação: ${code}`,
        html: htmlBody,
      });

      return { success: true };
    } catch (e: any) {
      console.error("Nodemailer reset code error:", e);
      return { success: false, error: e.message || "Failed to send reset code email" };
    }
  });

interface ScaleEmailPayload {
  scaleTitle: string;
  pdfBase64: string;
  recipients: string[];
}

export const sendScalePdfEmail = createServerFn({ method: "POST" })
  .validator((d: ScaleEmailPayload) => d)
  .handler(async ({ data }) => {
    const { scaleTitle, pdfBase64, recipients } = data;

    if (recipients.length === 0) {
      return { success: false, error: "Nenhum destinatário especificado." };
    }

    const host = process.env.SMTP_HOST?.trim();
    const port = parseInt(process.env.SMTP_PORT?.trim() || "587");
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    const from = process.env.SMTP_FROM || (user ? `"AMOI" <${user}>` : `"AMOI" <no-reply@amoi.org>`);

    console.log(`Sending scale PDF email for: "${scaleTitle}" to ${recipients.length} recipients.`);

    if (!host || !user || !pass) {
      console.log("\n=========================================");
      console.log("MOCK SCALE PDF EMAIL DISPATCH (No SMTP Configured)");
      console.log(`From: ${from}`);
      console.log(`To: ${recipients.join(", ")}`);
      console.log(`Subject: [AMOI] Cronograma de Atividades: ${scaleTitle}`);
      console.log(`Attachment Name: escala_${scaleTitle.toLowerCase().replace(/\s+/g, "_")}.pdf`);
      console.log("=========================================\n");
      return { success: true, mock: true, count: recipients.length };
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });

      const htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; border-bottom: 2px solid #D4A017; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="color: #D4A017; margin: 0; font-family: Georgia, serif; font-size: 26px;">AMOI</h2>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Associação Ministério de Oração e Intercessão</p>
          </div>
          
          <h1 style="color: #111; font-size: 20px; margin: 0 0 15px 0;">Escala de Atividades / Cultos</h1>
          
          <p style="color: #444; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            Olá, saudações em Cristo Jesus.<br /><br />
            Anexamos a este e-mail o documento oficial em formato PDF do <strong>Cronograma de Atividades: ${scaleTitle}</strong>.
          </p>
          
          <p style="color: #444; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
            Por favor, verifique o ficheiro PDF em anexo para conferir as suas datas, momentos e intervenções programadas.
          </p>
          
          <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 30px; color: #888; font-size: 11px;">
            <p style="margin: 0;">Este é um e-mail automático enviado pela Secretaria Geral da AMOI.</p>
            <p style="margin: 5px 0 0 0;">Associação Ministério de Oração e Intercessão · Luanda, Angola</p>
          </div>
        </div>
      `;

      const cleanBase64 = pdfBase64.includes("base64,")
        ? pdfBase64.split("base64,")[1]
        : pdfBase64;

      const attachmentName = `escala_${scaleTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`;

      await transporter.sendMail({
        from: { name: "AMOI", address: user },
        to: user,
        bcc: recipients,
        subject: `[AMOI] Cronograma de Atividades: ${scaleTitle}`,
        html: htmlBody,
        attachments: [
          {
            filename: attachmentName,
            content: Buffer.from(cleanBase64, "base64"),
            contentType: "application/pdf"
          }
        ]
      });

      return { success: true, count: recipients.length };
    } catch (e: any) {
      console.error("Nodemailer scale PDF dispatch error:", e);
      return { success: false, error: e.message || "Falha ao enviar e-mail com a escala." };
    }
  });
