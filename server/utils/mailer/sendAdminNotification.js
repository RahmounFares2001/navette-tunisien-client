import nodemailer from "nodemailer";
import { config } from 'dotenv';
import mongoose from 'mongoose';

config();

// Validate environment variables
const MAILER_USER = process.env.MAILER_USER;
const MAILER_PASSWORD = process.env.MAILER_PASSWORD;
const ADMIN_EMAIL = process.env.MAILER_USER;

if (!MAILER_USER || !MAILER_PASSWORD || !ADMIN_EMAIL) {
  throw new Error('Missing MAILER_USER, MAILER_PASSWORD, or ADMIN_EMAIL environment variables. Please check your .env file.');
}

// Configure transporter
const transporter = nodemailer.createTransport({
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
  }
});

// Function to generate HTML content for admin notification email
const generateAdminNotificationHtmlContent = ({ type, details }) => {
  const formattedDate = new Date(details.travelDate || details.excursionDate).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const title = type === 'transfer' ? 'Nouvelle Réservation de Transfert' : 'Nouvelle Demande d\'Excursion';
  let detailsHtml = '';
  if (type === 'transfer') {
    detailsHtml = `
      <p><strong>Client :</strong> ${details.clientName}</p>
      <p><strong>Email :</strong> ${details.clientEmail}</p>
      <p><strong>Téléphone :</strong> ${details.clientPhone}</p>
      <p><strong>Type de trajet :</strong> ${details.tripType}</p>
      <p><strong>Lieu de départ :</strong> ${details.departureLocation}</p>
      ${details.departureAddress ? `<p><strong>Adresse de départ :</strong> ${details.departureAddress}</p>` : ''}
      <p><strong>Destination :</strong> ${details.destination}</p>
      ${details.destinationAddress ? `<p><strong>Adresse de destination :</strong> ${details.destinationAddress}</p>` : ''}
      <p><strong>Date de voyage :</strong> ${formattedDate}</p>
      <p><strong>Heure de départ :</strong> ${details.departureTime}</p>
      ${details.flightNumber ? `<p><strong>Numéro de vol :</strong> ${details.flightNumber}</p>` : ''}
      <p><strong>Passagers :</strong> ${details.numberOfAdults} adulte(s), ${details.numberOfChildren || 0} enfant(s)</p>
      <p><strong>Valises :</strong> ${details.numberOfSuitcases || 0}</p>
      <p><strong>Langues du chauffeur :</strong> ${details.driverLanguage?.length ? details.driverLanguage.join(', ') : 'Aucune'}</p>
      ${details.comment ? `<p><strong>Commentaire :</strong> ${details.comment}</p>` : ''}
      <p><strong>Prix :</strong> ${details.price} TND</p>
      <p><strong>Véhicule :</strong> ${details.vehicleName || 'Non spécifié'}</p>
      <p><strong>Statut :</strong> ${details.status}</p>
      <p><strong>Pourcentage de paiement :</strong> ${details.paymentPercentage}%</p>
      <p><strong>Créé le :</strong> ${new Date(details.createdAt).toLocaleString('fr-FR')}</p>
    `;
  } else {
    detailsHtml = `
      <p><strong>Client :</strong> ${details.clientName}</p>
      <p><strong>Email :</strong> ${details.clientEmail}</p>
      <p><strong>Téléphone :</strong> ${details.clientPhone}</p>
      <p><strong>Excursion :</strong> ${details.excursionTitle}</p>
      <p><strong>Date de l'excursion :</strong> ${formattedDate}</p>
      <p><strong>Heure de départ :</strong> ${details.excursionTime}</p>
      <p><strong>Passagers :</strong> ${details.numberOfAdults} adulte(s), ${details.numberOfChildren || 0} enfant(s), ${details.numberOfBabies || 0} bébé(s)</p>
      <p><strong>Guide :</strong> ${details.withGuide ? 'Oui' : 'Non'}</p>
      ${details.withGuide && details.driverLanguages ? `<p><strong>Langues du guide :</strong> ${details.driverLanguages}</p>` : ''}
      ${details.message ? `<p><strong>Message :</strong> ${details.message}</p>` : ''}
      <p><strong>Prix :</strong> ${details.price} TND</p>
      <p><strong>Statut :</strong> ${details.status}</p>
      <p><strong>Pourcentage de paiement :</strong> ${details.paymentPercentage}%</p>
      <p><strong>Créé le :</strong> ${new Date(details.createdAt).toLocaleString('fr-FR')}</p>
    `;
  }

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
          <p>Bonjour,</p>
          <p>Une nouvelle ${type === 'transfer' ? 'réservation de transfert' : 'demande d\'excursion'} a été créée.</p>
          ${detailsHtml}
          <p>Veuillez examiner cette demande dans le panneau d'administration.</p>
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

// Function to send admin notification email
export const sendAdminNotification = async ({ type, details }) => {
  try {
    if (!type || !details) {
      console.error(`Missing required fields for admin notification: type=${type}, details=${JSON.stringify(details)}`);
      return { success: false, message: 'Missing required fields for admin notification' };
    }

    if (type !== 'transfer' && type !== 'excursion') {
      console.error(`Invalid type for admin notification: ${type}`);
      return { success: false, message: `Invalid type: ${type}` };
    }

    if (type === 'transfer' && (!details.clientName || !details.clientEmail || !details.clientPhone || !details.tripType || 
        !details.departureLocation || !details.destination || !details.travelDate || !details.departureTime || 
        !details.vehicleId || !details.price)) {
      console.error(`Missing required transfer fields: ${JSON.stringify(details)}`);
      return { success: false, message: 'Missing required transfer fields' };
    }

    if (type === 'excursion' && (!details.clientName || !details.clientEmail || !details.clientPhone || 
        !details.excursionDate || !details.excursionTime || !details.excursionId || !details.excursionTitle || 
        !details.price)) {
      console.error(`Missing required excursion fields: ${JSON.stringify(details)}`);
      return { success: false, message: 'Missing required excursion fields' };
    }

    if (isNaN(new Date(details.travelDate || details.excursionDate).getTime())) {
      console.error(`Invalid date format: ${details.travelDate || details.excursionDate}`);
      return { success: false, message: `Invalid date format: ${details.travelDate || details.excursionDate}` };
    }

    // Test SMTP connection before sending
    await new Promise((resolve, reject) => {
      transporter.verify((error) => {
        if (error) {
          console.error(`SMTP verification failed before sending admin notification: ${error.message}`);
          reject(new Error(`SMTP verification failed: ${error.message}`));
        } else {
          resolve();
        }
      });
    });

    const htmlContent = generateAdminNotificationHtmlContent({ type, details });

    const mailOptions = {
      from: `Navette Tunisie <${MAILER_USER}>`,
      to: ADMIN_EMAIL,
      subject: `Nouvelle ${type === 'transfer' ? 'Réservation de Transfert' : 'Demande d\'Excursion'} - Navette Tunisie`,
      html: htmlContent,
    };

    const mailResponse = await transporter.sendMail(mailOptions);
    return { success: true, message: `Admin notification email sent: ${mailResponse.messageId}` };
  } catch (error) {
    console.error(`Failed to send admin notification email: ${error.message}`);
    return { success: false, message: `Failed to send admin notification email: ${error.message}` };
  }
};