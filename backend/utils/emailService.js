// backend/utils/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const PROVIDER = process.env.MAIL_PROVIDER || 'smtp';
const MAIL_FROM = process.env.MAIL_FROM || process.env.MAIL_USER || 'no-reply@example.com';

let transporter = null;

async function createGmailTransport() {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  // Use port 465 for secure SSL, or 587 for STARTTLS
  const port = Number(process.env.MAIL_PORT || 465);
  const secure = port === 465;

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
  });
}

async function createSmtpTransport() {
  const host = process.env.MAIL_HOST;
  const port = Number(process.env.MAIL_PORT || 587);
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
    tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });
}

export async function initEmail() {
  try {
    if (PROVIDER === 'gmail') {
      transporter = await createGmailTransport();
    } else {
      transporter = await createSmtpTransport();
    }
    await transporter.verify();
    console.log(`[emailService] transporter ready (provider=${PROVIDER})`);
  } catch (err) {
    console.error('[emailService] transporter verification failed', err);
  }
}

// initialize on import (best effort)
initEmail();

export async function sendEmail(to, subject, html, opts = {}) {
  if (!transporter) {
    await initEmail();
    if (!transporter) throw new Error('Email transporter not initialized');
  }

  const mailOptions = {
    from: MAIL_FROM,
    to,
    subject,
    html,
    ...opts,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[emailService] email sent', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
    return info;
  } catch (err) {
    console.error('[emailService] sendMail error', err);
    throw err;
  }
}
