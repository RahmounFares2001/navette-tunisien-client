import nodemailer from "nodemailer";
import { config } from "dotenv";

config(); // Load environment variables

// Validate environment variables
const MAILER_USER = process.env.MAILER_USER;
const MAILER_PASSWORD = process.env.MAILER_PASSWORD;

if (!MAILER_USER || !MAILER_PASSWORD) {
  throw new Error("Missing MAILER_USER or MAILER_PASSWORD environment variables. Please check your .env file.");
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
transporter.verify((error) => {
  if (error) {
    console.error("SMTP configuration error:", error);
  }
});

// Function to generate HTML content for contact form
const generateContactHtml = ({ fullName, email, phone, subject, message }) => {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Nouveau message de contact</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 22px;
          color: #007bff;
        }
        .content p {
          margin-bottom: 10px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nouveau message de contact</h1>
        </div>
        <div class="content">
          <p><strong>Nom complet :</strong> ${fullName}</p>
          <p><strong>Email :</strong> ${email}</p>
          <p><strong>Téléphone :</strong> ${phone || "Non fourni"}</p>
          <p><strong>Sujet :</strong> ${subject}</p>
          <p><strong>Message :</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
        </div>
        <div class="footer">
          <p>Challenge Rent A Car | Tunis, Tunisie</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Function to send contact email
export const sendContactEmail = async ({ fullName, email, phone, subject, message }) => {
  try {
    if (!fullName || !email || !subject || !message) {
      throw new Error("Missing required contact form fields");
    }

    const htmlContent = generateContactHtml({ fullName, email, phone, subject, message });

    const mailOptions = {
      from: `Challenge Rent A Car <${MAILER_USER}>`,
      to: MAILER_USER, // Admin inbox
      subject: `Contact - ${subject}`,
      html: htmlContent,
      replyTo: email,
    };

    const mailResponse = await transporter.sendMail(mailOptions);
    return mailResponse;
  } catch (error) {
    console.error("Error sending contact email:", error);
    throw error;
  }
};
