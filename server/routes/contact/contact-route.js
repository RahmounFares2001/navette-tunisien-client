import express from "express";
import { sendContactEmail } from "../../utils/mailer/sendContactConfig.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { fullName, email, phone, subject, message } = req.body;

    await sendContactEmail({ fullName, email, phone, subject, message });

    res.status(200).json({
      success: true,
      message: "Votre message a été envoyé avec succès.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Impossible d'envoyer votre message.",
    });
  }
});

export default router;
