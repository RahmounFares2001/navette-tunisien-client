import nodemailer from "nodemailer";
import { config } from 'dotenv';

config(); // Load environment variables

// Validate environment variables
const MAILER_USER = process.env.MAILER_USER;
const MAILER_PASSWORD = process.env.MAILER_PASSWORD;

if (!MAILER_USER || !MAILER_PASSWORD) {
  throw new Error('Missing MAILER_USER or MAILER_PASSWORD environment variables. Please check your .env file.');
}

// Configure transporter
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: MAILER_USER,
    pass: MAILER_PASSWORD,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP configuration error:', error);
  } else {
    ('SMTP server is ready to send emails');
  }
});

// Function to generate HTML content for password reset email
const generateHtmlContent = ({ resetLink }) => {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Réinitialisation du mot de passe</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Arial', sans-serif;
          background-color: #f4f4f4;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
        .content {
          font-size: 16px;
          line-height: 1.5;
          color: #333;
        }
        .content p {
          margin-bottom: 15px;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #007bff;
          color: #ffffff;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
        }
        .button:hover {
          background-color: #0056b3;
        }
                  a {
            color: white !important;
        }
        a.button {
            color: white !important;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: #777;
        }
        @media (max-width: 600px) {
          .container {
            padding: 15px;
          }
          .header h1 {
            font-size: 20px;
          }
          .content {
            font-size: 14px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Réinitialisation du mot de passe</h1>
        </div>
        <div class="content">
          <p>Bonjour,</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte administrateur chez <strong>Navette</strong>.</p>
          <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe. Ce lien expirera dans 15 minutes :</p>
          <p style="text-align: center;">
            <a href="${resetLink}" class="button">Réinitialiser le mot de passe</a>
          </p>
          <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail.</p>
          <p>Merci,</p>
          <p>L'équipe Navette</p>
        </div>
        <div class="footer">
          <p>Navette | Tunis, Tunisie</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Function to send password reset email
export const sendResetPasswordEmail = async ({ email, resetLink }) => {
  try {
    // Validate inputs
    if (!email || !resetLink) {
      throw new Error('Email and reset link are required');
    }

    // Generate HTML content
    const htmlContent = generateHtmlContent({ resetLink });

    // Email content
    const mailOptions = {
      from: `Navette <${MAILER_USER}>`,
      to: email,
      subject: "Réinitialisation du mot de passe - Navette",
      html: htmlContent,
    };

    // Send the email
    const mailResponse = await transporter.sendMail(mailOptions);
    ('Reset password email sent successfully:', mailResponse.messageId);
    return mailResponse;
  } catch (error) {
    console.error("Reset password email send error:", error);
    throw error;
  }
};