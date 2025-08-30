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
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
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

// Function to generate HTML content for payment link email
const generateHtmlContent = ({ paymentLink, carBrand, carModel, newDropoffDate, additionalCost, additionalDays }) => {
  const dateFormatter = (date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Demande de Paiement pour Prolongation</title>
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
          <h1>Demande de Paiement pour Prolongation</h1>
        </div>
        <div class="content">
          <p>Bonjour,</p>
          <p>Votre demande de prolongation pour la réservation du véhicule <strong>${carBrand} ${carModel}</strong> jusqu'au <strong>${dateFormatter(newDropoffDate)}</strong> a été acceptée.</p>
          <p>Coût supplémentaire : <strong>${additionalCost} TND</strong> pour <strong>${additionalDays} jour${additionalDays > 1 ? 's' : ''}</strong>.</p>
          <p>Veuillez effectuer le paiement dans les <strong>1 heure</strong> en cliquant sur le bouton ci-dessous :</p>
          <p style="text-align: center;">
            <a href="${paymentLink}" class="button">Payer Maintenant</a>
          </p>
          <p>Si vous ne payez pas dans les 1 heure, la demande de prolongation sera annulée.</p>
          <p>Merci,</p>
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

// Function to send payment link email for prolongation
export const sendPaymentLinkEmail = async ({ email, paymentLink, carBrand, carModel, newDropoffDate, additionalCost, additionalDays }) => {
  try {
    // Validate inputs
    if (!email || !paymentLink || !carBrand || !carModel || !newDropoffDate || !additionalCost || !additionalDays) {
      throw new Error('All required fields (email, paymentLink, carBrand, carModel, newDropoffDate, additionalCost, additionalDays) are required');
    }

    // Generate HTML content
    const htmlContent = generateHtmlContent({ paymentLink, carBrand, carModel, newDropoffDate, additionalCost, additionalDays });

    // Email content
    const mailOptions = {
      from: `Challenge Rent A Car <${MAILER_USER}>`,
      to: email,
      subject: "Demande de Paiement pour Prolongation - Challenge Rent A Car",
      html: htmlContent,
    };

    // Send the email
    const mailResponse = await transporter.sendMail(mailOptions);
    ('Payment link email sent successfully:', mailResponse.messageId);
    return mailResponse;
  } catch (error) {
    console.error("Payment link email send error:", error);
    throw error;
  }
};