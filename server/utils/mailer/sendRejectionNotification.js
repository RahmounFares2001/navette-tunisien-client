import nodemailer from "nodemailer";
import { config } from 'dotenv';

config();

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

// Function to generate HTML content for prolongation rejection email
const generateRejectionHtmlContent = () => {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rejet de Demande de Prolongation</title>
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
          <h1>Rejet de Demande de Prolongation</h1>
        </div>
        <div class="content">
          <p>Bonjour,</p>
          <p>Votre demande de prolongation a été rejetée.</p>
          <p>Raison : Le véhicule n'est pas disponible pour les dates demandées en raison d'une autre réservation.</p>
          <p>Nous vous invitons à créer une nouvelle réservation avec une autre immatriculation ou un autre véhicule si nécessaire.</p>
          <p>Merci de votre compréhension,</p>
          <p>L'équipe Challenge Rent A Car</p>
        </div>
        <div class="footer">
          <p>Challenge Rent A Car | Tunis, Tunisie</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Function to send prolongation rejection email
export const sendProlongationRejectionEmail = async ({ email }) => {
  try {
    // Validate inputs
    if (!email) {
      throw new Error('Email is required');
    }

    // Generate HTML content
    const htmlContent = generateRejectionHtmlContent();

    // Email content
    const mailOptions = {
      from: `Challenge Rent A Car <${MAILER_USER}>`,
      to: email,
      subject: "Rejet de Demande de Prolongation - Challenge Rent A Car",
      html: htmlContent,
    };

    // Send the email
    const mailResponse = await transporter.sendMail(mailOptions);
    return mailResponse;
  } catch (error) {
    throw error;
  }
};