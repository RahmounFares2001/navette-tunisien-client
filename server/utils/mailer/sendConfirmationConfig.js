import nodemailer from "nodemailer";
import htmlPdf from 'html-pdf-node';
import { writeFileSync, mkdirSync, readFileSync, unlinkSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname and __filename for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure transporter 
export const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com", 
  port: 465, 
  secure: true,
  auth: {
    user: process.env.MAILER_USER, 
    pass: process.env.MAILER_PASSWORD 
  },
});

// Function to generate HTML content
const generateHtmlContent = ({
  dateDebut,
  dateFin,
  modelVoiture,
  locataire,
  totaliteLoyer,
  avance,
  resteAPayer,
  dateEmission
}) => {
  const cachetPath = path.join(__dirname, '..', '..', 'public', 'cachet', 'cachet.png');
  const logoPath = path.join(__dirname, '..', '..', 'public', 'logo.png');
  let cachetBase64 = '';
  let logoBase64 = '';
  
  try {
    const cachetBuffer = readFileSync(cachetPath);
    cachetBase64 = `data:image/png;base64,${cachetBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error loading cachet image:', error);
    cachetBase64 = '';
  }
  
  try {
    const logoBuffer = readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error loading logo image:', error);
    logoBase64 = '';
  }

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmation de Réservation</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          background-color: white;
          line-height: 1.4;
          direction: ltr;
        }
        .container {
          width: 100%;
          height: 100%;
          background-color: white;
          position: relative;
          padding-top: 20px;
        }
        .logo-container {
          position: absolute;
          top: 3rem;
          left: 1rem;
          z-index: 10;
        }
        .logo-image {
          width: 6rem;
          height: auto;
          display: block;
        }
        .document {
          padding: 2rem;
          font-family: 'Times New Roman', Times, serif;
          color: black;
        }
        .header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .header h3 {
          font-weight: 650;
          font-weight: bold;
          margin-bottom: 1rem;
          color: black;
        }
        .content {
          font-size: 0.875rem;
          line-height: 1.5;
          color: black;
        }
        .content p {
          margin-bottom: 0.5rem;
          text-align: justify;
          margin-bottom: 0.25rem;
          line-height: 1.5; 
        }
        .payment-section {
          margin-top: 1.2rem;
          margin-left: auto;
          width: 50%;
          padding: 0.5rem;
        }
        .payment-details {
          margin-bottom: 0.5rem;
          width: 20rem;
          margin-left: auto;
        }
        .payment-details h3 {
          font-weight: 600;
          margin-bottom: 0.25rem;
          text-align: left;
        }
        .payment-list {
          display: block;
          margin-left: auto;
          width: 20rem;
        }
        .payment-list p {
          text-align: left;
          margin-bottom: 0.25rem;
        }
        .location-info {
          display: block;
          margin-left: auto;
          width: 20rem;
        }
        .location-info p {
          text-align: left;
          margin-bottom: 0.25rem;
        }
        .signature-section {
          width: 20rem;
          display: block;
          margin-left: auto;
          margin-top: 0.5rem;
        }
        .signature-title {
          margin-top: 1.2rem;
          margin-left: auto;
          width: 80%;
          padding: 0.25rem;
        }
        .signature-title p {
          font-weight: 600;
        }
        .cachet-image {
          width: 20rem;
          height: auto;
          display: block;
          margin-left: auto;
        }
        @media print {
          .payment-section,
          .payment-details,
          .payment-list,
          .location-info,
          .signature-section,
          .signature-title {
            width: 16rem;
          }
          .cachet-image {
            width: 16rem;
          }
          .logo-image {
            width: 6rem;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo-container">
          <img src="${logoBase64}" alt="CHALLENGE RENT A CAR Logo" class="logo-image" />
        </div>
        <div class="document">
          <div class="header">  
            <h3>CONFIRMATION DE RÉSERVATION</h3>
          </div>
          <div class="content">
            <p>
              Faisant suite à votre demande pour la location d'une voiture, nous tenons d'abord à
              vous remercier de l'intérêt accordé à <strong>CHALLENGE RENT A CAR</strong>. Et c'est avec
              plaisir que nous vous communiquons la confirmation de votre réservation du
              ${dateDebut || '…./…./2025'} jusqu'au le ${dateFin || '..../..../2025'} pour une voiture ${modelVoiture || '...................(Model Voiture)'}
              au nom de ${locataire || '........................(Locataire)'}.
            </p>
            <div class="payment-section">
              <div class="payment-details">
                <h3>Détail du règlement :</h3>
                <div class="payment-list">
                  <p>Totalité du loyer : ${totaliteLoyer || '.......................'}</p>
                  <p>Avance : ${avance || '.......................'}</p>
                  <p>Reste à Payer : ${resteAPayer || '.......................'}</p>
                </div>
              </div>
              <div class="location-info">
                <p>Fait à Tunis le ${dateEmission || '..../..../2025'}</p>
                <p>Merci et à très bientôt</p>
              </div>
            </div>
            <div class="signature-section">
              <div class="signature-title">
                <p>Signature et cachet</p>
              </div>
              <img src="${cachetBase64}" alt="Cachet de l'entreprise" class="cachet-image" />
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Function to generate PDF from HTML using html-pdf-node
const generatePDF = async (htmlContent, outputPath) => {
  const outputDir = path.join(__dirname, 'temp');
  
  // Ensure temp directory exists
  mkdirSync(outputDir, { recursive: true });

  // Configure html-pdf-node options
  const options = {
    format: 'A5',
    width: '148mm',
    height: '210mm',
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm'
    },
    printBackground: true,
    preferCSSPageSize: true,
  };

  const file = { content: htmlContent };

  try {
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    writeFileSync(outputPath, pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

// Function to send email via Hostinger SMTP
export const sendConfirmationEmail = async ({
  name,
  email,
  subject,
  dateDebut,
  dateFin,
  modelVoiture,
  locataire,
  totaliteLoyer,
  avance,
  resteAPayer,
  dateEmission
}) => {
  try {
    
    // Generate HTML content
    const htmlContent = generateHtmlContent({
      dateDebut,
      dateFin,
      modelVoiture,
      locataire,
      totaliteLoyer,
      avance,
      resteAPayer,
      dateEmission,
    });

    // Generate PDF
    const pdfPath = path.join(__dirname, 'temp', `Confirmation_${Date.now()}.pdf`);
    await generatePDF(htmlContent, pdfPath);

    // Email content
    const mailOptions = {
      from: process.env.MAILER_USER,
      to: email,
      subject: subject || "CONFIRMATION DE RÉSERVATION - CHALLENGE RENT A CAR",
      text: 'Veuillez trouver ci-joint la confirmation de votre réservation.',
      attachments: [
        {
          filename: 'Confirmation.pdf',
          path: pdfPath,
        },
      ],
    };

    // Send the email
    const mailResponse = await transporter.sendMail(mailOptions);
    
    // Clean up temporary PDF file
    try {
      unlinkSync(pdfPath);
    } catch (cleanupError) {
      console.warn('Could not clean up temporary PDF:', cleanupError.message);
    }
    
    return mailResponse;
  } catch (ersror) {
    console.error("Email send error:", error);
    throw error;
  }
};