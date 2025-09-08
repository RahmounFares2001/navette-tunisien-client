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

// Verify transporter configuration at startup
transporter.verify((error, success) => {
  if (error) {
    console.error(`SMTP configuration error: ${error.message} (MAILER_USER: ${MAILER_USER})`);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

// Function to generate HTML content for confirmation email
const generateConfirmationHtmlContent = ({ clientName, date, type, details, price }) => {
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const title = type === 'transfer' ? 'Confirmation de Votre Transfert' : 'Confirmation de Votre Demande d\'Excursion';
  const detailsHtml = type === 'transfer'
    ? `<p><strong>Trajet :</strong> ${details.tripType} de ${details.departureLocation} à ${details.destination}</p>`
    : `<p><strong>Excursion :</strong> ${details.excursionTitle}</p>`;

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
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
          <h1>${title}</h1>
        </div>
        <div class="content">
          <p>Bonjour ${clientName},</p>
          <p>Nous sommes ravis de confirmer votre ${type === 'transfer' ? 'transfert' : 'demande d\'excursion'} pour le ${formattedDate}.</p>
          ${detailsHtml}
          <p>Prix : ${price} DT</p>
          <p>Merci d'avoir choisi Navette Tunisie. Nous vous contacterons pour toute information supplémentaire.</p>
          <p>Cordialement,</p>
          <p>L'équipe Navette Tunisie</p>
        </div>
        <div class="footer">
          <p>Navette Tunisie | Tunis, Tunisie</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Function to generate HTML content for rejection email
const generateRejectionHtmlContent = ({ clientName, date, type }) => {
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const title = type === 'transfer' ? 'Rejet de Votre Demande de Transfert' : 'Rejet de Votre Demande d\'Excursion';
  const resource = type === 'transfer' ? 'véhicule' : 'excursion';

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
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
          <h1>${title}</h1>
        </div>
        <div class="content">
          <p>Bonjour ${clientName},</p>
          <p>Nous sommes désolés de vous informer que votre demande de ${type === 'transfer' ? 'transfert' : 'excursion'} pour le ${formattedDate} a été rejetée.</p>
          <p>Raison : Le ${resource} n'est pas disponible pour les dates demandées en raison d'une autre réservation.</p>
          <p>Nous vous invitons à créer une nouvelle demande avec d'autres dates ou options si nécessaire.</p>
          <p>Merci de votre compréhension,</p>
          <p>L'équipe Navette Tunisie</p>
        </div>
        <div class="footer">
          <p>Navette Tunisie | Tunis, Tunisie</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Function to send confirmation email
export const sendConfirmationEmail = async ({ email, clientName, date, type, details, price }) => {
  try {
    if (!email || !clientName || !date || !type || !details || price === undefined) {
      console.error(`Missing required fields for confirmation email: email=${email}, clientName=${clientName}, date=${date}, type=${type}, details=${JSON.stringify(details)}, price=${price}`);
      return { success: false, message: 'Missing required fields for confirmation email' };
    }

    if (isNaN(new Date(date).getTime())) {
      console.error(`Invalid date format: ${date}`);
      return { success: false, message: `Invalid date format: ${date}` };
    }

    // Test SMTP connection before sending
    await new Promise((resolve, reject) => {
      transporter.verify((error) => {
        if (error) {
          console.error(`SMTP verification failed before sending confirmation email: ${error.message}`);
          reject(new Error(`SMTP verification failed: ${error.message}`));
        } else {
          console.log('SMTP connection verified before sending confirmation email');
          resolve();
        }
      });
    });

    const htmlContent = generateConfirmationHtmlContent({ clientName, date, type, details, price });

    const mailOptions = {
      from: `Navette Tunisie <${MAILER_USER}>`,
      to: email,
      subject: `Confirmation de Votre ${type === 'transfer' ? 'Transfert' : 'Demande d\'Excursion'} - Navette Tunisie`,
      html: htmlContent,
    };

    const mailResponse = await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent: ${mailResponse.messageId} to ${email}`);
    return { success: true, message: `Confirmation email sent: ${mailResponse.messageId}` };
  } catch (error) {
    console.error(`Failed to send confirmation email to ${email}: ${error.message}`);
    return { success: false, message: `Failed to send confirmation email: ${error.message}` };
  }
};

// Function to send rejection email
export const sendRejectionEmail = async ({ email, clientName, date, type }) => {
  try {
    if (!email || !clientName || !date || !type) {
      console.error(`Missing required fields for rejection email: email=${email}, clientName=${clientName}, date=${date}, type=${type}`);
      return { success: false, message: 'Missing required fields for rejection email' };
    }

    if (isNaN(new Date(date).getTime())) {
      console.error(`Invalid date format: ${date}`);
      return { success: false, message: `Invalid date format: ${date}` };
    }

    // Test SMTP connection before sending
    await new Promise((resolve, reject) => {
      transporter.verify((error) => {
        if (error) {
          console.error(`SMTP verification failed before sending rejection email: ${error.message}`);
          reject(new Error(`SMTP verification failed: ${error.message}`));
        } else {
          console.log('SMTP connection verified before sending rejection email');
          resolve();
        }
      });
    });

    const htmlContent = generateRejectionHtmlContent({ clientName, date, type });

    const mailOptions = {
      from: `Navette Tunisie <${MAILER_USER}>`,
      to: email,
      subject: `Rejet de Votre Demande de ${type === 'transfer' ? 'Transfert' : 'Excursion'} - Navette Tunisie`,
      html: htmlContent,
    };

    const mailResponse = await transporter.sendMail(mailOptions);
    console.log(`Rejection email sent: ${mailResponse.messageId} to ${email}`);
    return { success: true, message: `Rejection email sent: ${mailResponse.messageId}` };
  } catch (error) {
    console.error(`Failed to send rejection email to ${email}: ${error.message}`);
    return { success: false, message: `Failed to send rejection email: ${error.message}` };
  }
};