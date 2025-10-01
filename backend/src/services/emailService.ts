import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import env from '@/config/env';
import logger from '@/config/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const canSendRealEmail = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD);

const transporter = canSendRealEmail
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: Boolean(env.SMTP_SECURE),
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD
      }
    })
  : null;

const emailLogFile = path.join(process.cwd(), 'logs', 'emails.log');

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  if (transporter) {
    await transporter.sendMail({
      from: env.EMAIL_FROM || 'no-reply@client-portal.local',
      to,
      subject,
      html
    });
    logger.info('Email sent', { to, subject });
    return;
  }

  const payload = `\n--- EMAIL ---\nTO: ${to}\nSUBJECT: ${subject}\n${html}\n-------------\n`;
  await fs.promises.mkdir(path.dirname(emailLogFile), { recursive: true });
  await fs.promises.appendFile(emailLogFile, payload, 'utf8');
  logger.info('Email captured to log file', { to, subject });
};
