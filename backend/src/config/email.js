import nodemailer from 'nodemailer';
import { config } from 'dotenv';
config();

let transporter;

// Initialize email transporter based on service
const initializeTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';

  if (emailService === 'sendgrid') {
    // SendGrid configuration
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else if (emailService === 'gmail') {
    // Gmail configuration
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Generic SMTP configuration
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  return transporter;
};

// Email templates
const emailTemplates = {
  welcome: (name) => ({
    subject: 'Welcome to Cenopie!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0BC0DF;">Welcome to Cenopie, ${name}!</h1>
        <p>Thank you for joining our professional networking platform.</p>
        <p>Get started by:</p>
        <ul>
          <li>Completing your profile</li>
          <li>Connecting with professionals</li>
          <li>Exploring job opportunities</li>
        </ul>
        <a href="${process.env.CLIENT_ORIGIN}/profile" 
           style="display: inline-block; padding: 12px 24px; background: #0BC0DF; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
          Complete Your Profile
        </a>
        <p style="margin-top: 30px; color: #666;">
          Best regards,<br>
          The Cenopie Team
        </p>
      </div>
    `
  }),

  passwordReset: (name, resetToken) => ({
    subject: 'Reset Your Password - Cenopie',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0BC0DF;">Password Reset Request</h1>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <a href="${process.env.CLIENT_ORIGIN}/auth/reset-password?token=${resetToken}" 
           style="display: inline-block; padding: 12px 24px; background: #0BC0DF; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
          Reset Password
        </a>
        <p style="margin-top: 20px;">This link will expire in 1 hour.</p>
        <p style="color: #666;">If you didn't request this, please ignore this email.</p>
        <p style="margin-top: 30px; color: #666;">
          Best regards,<br>
          The Cenopie Team
        </p>
      </div>
    `
  }),

  emailVerification: (name, verificationToken) => ({
    subject: 'Verify Your Email - Cenopie',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0BC0DF;">Verify Your Email</h1>
        <p>Hi ${name},</p>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${process.env.CLIENT_ORIGIN}/auth/verify-email?token=${verificationToken}" 
           style="display: inline-block; padding: 12px 24px; background: #0BC0DF; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
          Verify Email
        </a>
        <p style="margin-top: 20px;">This link will expire in 24 hours.</p>
        <p style="margin-top: 30px; color: #666;">
          Best regards,<br>
          The Cenopie Team
        </p>
      </div>
    `
  }),

  jobApplication: (candidateName, jobTitle, companyName) => ({
    subject: `New Application for ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0BC0DF;">New Job Application</h1>
        <p>You have received a new application for <strong>${jobTitle}</strong>.</p>
        <p><strong>Candidate:</strong> ${candidateName}</p>
        <a href="${process.env.CLIENT_ORIGIN}/company/applications" 
           style="display: inline-block; padding: 12px 24px; background: #0BC0DF; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
          View Application
        </a>
        <p style="margin-top: 30px; color: #666;">
          Best regards,<br>
          The Cenopie Team
        </p>
      </div>
    `
  }),

  connectionRequest: (senderName, senderProfile) => ({
    subject: `${senderName} wants to connect with you`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0BC0DF;">New Connection Request</h1>
        <p><strong>${senderName}</strong> wants to connect with you on Cenopie.</p>
        <a href="${process.env.CLIENT_ORIGIN}/network" 
           style="display: inline-block; padding: 12px 24px; background: #0BC0DF; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
          View Request
        </a>
        <p style="margin-top: 30px; color: #666;">
          Best regards,<br>
          The Cenopie Team
        </p>
      </div>
    `
  }),

  newMessage: (senderName) => ({
    subject: `New message from ${senderName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0BC0DF;">New Message</h1>
        <p>You have a new message from <strong>${senderName}</strong>.</p>
        <a href="${process.env.CLIENT_ORIGIN}/messages" 
           style="display: inline-block; padding: 12px 24px; background: #0BC0DF; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
          Read Message
        </a>
        <p style="margin-top: 30px; color: #666;">
          Best regards,<br>
          The Cenopie Team
        </p>
      </div>
    `
  })
};

// Send email function
export const sendEmail = async (to, templateName, templateData) => {
  try {
    if (!transporter) {
      transporter = initializeTransporter();
    }

    // Verify transporter
    await transporter.verify();

    // Get template
    const template = emailTemplates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const { subject, html } = template(...Object.values(templateData));

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Cenopie" <noreply@cenopie.com>',
      to,
      subject,
      html
    });

    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Bulk email function
export const sendBulkEmail = async (recipients, templateName, templateData) => {
  const results = await Promise.allSettled(
    recipients.map(recipient => sendEmail(recipient, templateName, templateData))
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;

  console.log(`📧 Bulk email: ${successful} sent, ${failed} failed`);
  return { successful, failed, total: results.length };
};

export default {
  sendEmail,
  sendBulkEmail,
  emailTemplates
};
