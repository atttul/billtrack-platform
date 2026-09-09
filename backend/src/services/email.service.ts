import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export interface SendReminderParams {
  toEmail: string;
  userName: string;
  billName: string;
  amount: number;
  currency: string;
  dueDate: Date;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
      auth:
        env.EMAIL_USER && env.EMAIL_PASSWORD
          ? {
              user: env.EMAIL_USER,
              pass: env.EMAIL_PASSWORD,
            }
          : undefined,
    });
  }

  async sendReminderEmail(params: SendReminderParams): Promise<boolean> {
    const formattedDate = params.dueDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">Bill Reminder Alert 🔔</h2>
        <p>Hello <strong>${params.userName}</strong>,</p>
        <p>This is a friendly reminder that your upcoming bill payment is due soon:</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Bill:</strong> ${params.billName}</p>
          <p style="margin: 5px 0;"><strong>Amount Due:</strong> ${params.currency} ${params.amount.toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${formattedDate}</p>
        </div>

        <p>Please log in to your BillTrack dashboard to manage this payment.</p>
        <p style="color: #64748b; font-size: 0.9em; margin-top: 30px;">Thank you for using BillTrack Platform.</p>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to: params.toEmail,
        subject: `Reminder: ${params.billName} payment of ${params.currency} ${params.amount} is due on ${formattedDate}`,
        html: htmlContent,
      });

      logger.info({ messageId: info.messageId, recipient: params.toEmail }, 'Email sent successfully');
      return true;
    } catch (error) {
      logger.error({ error, recipient: params.toEmail }, 'Failed to send email');
      throw error;
    }
  }
}

export const emailService = new EmailService();
