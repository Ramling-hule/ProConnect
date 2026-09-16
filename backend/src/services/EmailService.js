import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
    this.transporter.verify((error) => {
      if (error) {
        logger.error("EmailService: SMTP connection failed — emails will NOT send", {
          smtpError  : error.message,
          smtpCode   : error.code,
          smtpCommand: error.command,
          smtpUser   : env.smtpUser,
          hint       : "Make sure SMTP_PASS is correctly set (e.g. your Brevo SMTP key).",
        });
      } else {
        logger.info("EmailService: SMTP connection verified ✓", { smtpUser: env.smtpUser });
      }
    });
  }

  async sendEmail({ to, subject, text, html }) {
    try {
      const info = await this.transporter.sendMail({
        from: `"ProConnect" <${env.emailFrom || env.smtpUser}>`,
        to,
        subject,
        text,
        html,
      });
      logger.info("Email sent", { to, subject, messageId: info.messageId });
    } catch (error) {
      logger.error("EmailService: Failed to send email", {
        to,
        subject,
        smtpError: error.message,
        smtpCode: error.code,
        smtpCommand: error.command,
        responseCode: error.responseCode,
        response: error.response,
      });
      const friendly = new Error("Email sending failed");
      friendly.status = 503;
      friendly.cause = error;
      throw friendly;
    }
  }

  async sendOtpEmail(to, otp) {
    await this.sendEmail({
      to,
      subject: "Your ProConnect Verification OTP",
      text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#4f46e5">ProConnect — Verify your email</h2>
          <p>Use the code below to complete your registration:</p>
          <div style="font-size:2rem;font-weight:bold;letter-spacing:8px;color:#4f46e5;padding:16px 0">
            ${otp}
          </div>
          <p style="color:#666;font-size:0.875rem">This code expires in <strong>10 minutes</strong>. Do not share it.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(to, resetUrl) {
    await this.sendEmail({
      to,
      subject: "ProConnect — Password Reset Request",
      text: `Reset your password here: ${resetUrl}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#4f46e5">ProConnect — Reset your password</h2>
          <p>Click the button below to set a new password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:8px">
            Reset Password
          </a>
          <p style="color:#666;font-size:0.875rem;margin-top:16px">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetOtpEmail(to, otp) {
    await this.sendEmail({
      to,
      subject: "ProConnect — Password Reset OTP",
      text: `Your password reset OTP is: ${otp}. It expires in 15 minutes.`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#4f46e5">ProConnect — Reset your password</h2>
          <p>Use the code below to reset your password:</p>
          <div style="font-size:2rem;font-weight:bold;letter-spacing:8px;color:#4f46e5;padding:16px 0">
            ${otp}
          </div>
          <p style="color:#666;font-size:0.875rem">This code expires in <strong>15 minutes</strong>. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  }
}

export default new EmailService();
