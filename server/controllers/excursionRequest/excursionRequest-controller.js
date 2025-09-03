import mongoose from 'mongoose';
import { ExcursionRequest, Excursion } from '../../models/models.js';
import { verifyAdmin } from '../../utils/verifyAdmin.js';
import { sendConfirmationEmail, sendRejectionEmail } from '../../utils/mailer/sendClientMail.js';

// Create a new excursion request (no verifyAdmin)
export const createExcursionRequest = async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      clientPhone,
      excursionDate,
      excursionTime,
      numberOfAdults,
      numberOfChildren,
      numberOfBabies,
      message,
      excursionId,
      status,
      paymentPercentage,
      withGuide,
      driverLanguages,
    } = req.body;

    // Validate required fields
    if (
      !clientName ||
      !clientEmail ||
      !clientPhone ||
      !excursionDate ||
      !excursionTime ||
      numberOfAdults === undefined ||
      numberOfChildren === undefined ||
      numberOfBabies === undefined ||
      !excursionId
    ) {
      return res.status(400).json({ success: false, message: 'Tous les champs obligatoires doivent être remplis' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      return res.status(400).json({ success: false, message: 'Format d\'email invalide' });
    }

    // Validate excursionDate
    if (isNaN(new Date(excursionDate).getTime())) {
      return res.status(400).json({ success: false, message: 'Format de date d\'excursion invalide' });
    }

    // Validate driverLanguages if withGuide is true
    if (withGuide && !driverLanguages) {
      return res.status(400).json({ success: false, message: 'Les langues du guide doivent être spécifiées' });
    }

    // Calculate total number of people
    const totalPeople = Number(numberOfAdults) + Number(numberOfChildren) + Number(numberOfBabies);

    // Validate total number of people
    if (totalPeople < 1 || totalPeople > 8) {
      return res.status(400).json({ success: false, message: 'Le nombre total de personnes doit être entre 1 et 8' });
    }

    // Validate individual counts
    if (
      numberOfAdults < 0 ||
      numberOfChildren < 0 ||
      numberOfBabies < 0 ||
      numberOfAdults > 8 ||
      numberOfChildren > 8 ||
      numberOfBabies > 8
    ) {
      return res.status(400).json({ success: false, message: 'Les nombres d\'adultes, d\'enfants et de bébés doivent être entre 0 et 8' });
    }

    // Validate excursionId
    if (!mongoose.isValidObjectId(excursionId)) {
      return res.status(400).json({ success: false, message: 'ID d\'excursion invalide' });
    }

    const excursion = await Excursion.findById(excursionId);
    if (!excursion) {
      return res.status(404).json({ success: false, message: 'Excursion non trouvée' });
    }

    // Validate paymentPercentage
    if (paymentPercentage !== undefined && ![0, 100].includes(Number(paymentPercentage))) {
      return res.status(400).json({ success: false, message: 'Le pourcentage de paiement doit être 0 ou 100' });
    }

    // Calculate price based on total number of people
    let price;
    if (totalPeople >= 1 && totalPeople <= 4) {
      price = excursion.prices.oneToFour;
    } else if (totalPeople >= 5 && totalPeople <= 6) {
      price = excursion.prices.fiveToSix;
    } else if (totalPeople >= 7 && totalPeople <= 8) {
      price = excursion.prices.sevenToEight;
    }

    // Add 200 TND if withGuide is true
    if (withGuide === true) {
      price += 200;
    }

    const excursionRequestData = {
      clientName,
      clientEmail,
      clientPhone,
      excursionDate,
      excursionTime,
      numberOfAdults,
      numberOfChildren,
      numberOfBabies,
      message,
      excursionId,
      price,
      paymentPercentage: paymentPercentage || 0,
      withGuide: withGuide || false,
      driverLanguages: withGuide == true ? driverLanguages : '',
      status: status || 'pending',
    };

    const excursionRequest = new ExcursionRequest(excursionRequestData);

    let emailWarning = null;
    // Send email if status is 'confirmed' or 'rejected'
    if (status && (status === 'confirmed' || status === 'rejected')) {
      console.log(`Creating excursion request with status ${status}, attempting to send email to ${excursionRequestData.clientEmail}`);
      if (status === 'confirmed') {
        if (!excursionRequestData.clientEmail || !excursionRequestData.clientName || !excursionRequestData.excursionDate) {
          emailWarning = 'Missing required fields for confirmation email';
          console.error(emailWarning);
        } else {
          const emailResult = await sendConfirmationEmail({
            email: excursionRequestData.clientEmail,
            clientName: excursionRequestData.clientName,
            date: excursionRequestData.excursionDate,
            type: 'excursion',
            details: {
              excursionTitle: excursion.title,
            },
          });
          if (!emailResult.success) {
            emailWarning = emailResult.message;
          }
        }
      } else if (status === 'rejected') {
        if (!excursionRequestData.clientEmail || !excursionRequestData.clientName || !excursionRequestData.excursionDate) {
          emailWarning = 'Missing required fields for rejection email';
          console.error(emailWarning);
        } else {
          const emailResult = await sendRejectionEmail({
            email: excursionRequestData.clientEmail,
            clientName: excursionRequestData.clientName,
            date: excursionRequestData.excursionDate,
            type: 'excursion',
          });
          if (!emailResult.success) {
            emailWarning = emailResult.message;
          }
        }
      }
    } else {
      console.log(`No email sent - Status: ${status || 'pending'}`);
    }

    await excursionRequest.save();
    const response = {
      success: true,
      data: excursionRequest,
      message: 'Demande d\'excursion créée avec succès',
    };
    if (emailWarning) {
      response.warning = emailWarning;
    }
    res.json(response);
  } catch (err) {
    console.error(`Error in createExcursionRequest: ${err.message}`);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
};

// Get all excursion requests
export const getAllExcursionRequests = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const status = req.query.status;
      const paymentPercentage = req.query.paymentPercentage ? parseInt(req.query.paymentPercentage) : undefined;
      const search = req.query.search;

      const query = {};

      if (status && ['pending', 'confirmed', 'completed', 'rejected'].includes(status)) {
        query.status = status;
      }

      if (paymentPercentage === 0 || paymentPercentage === 100) {
        query.paymentPercentage = paymentPercentage;
        if (!query.status) {
          query.status = 'confirmed';
        }
      }

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { clientName: searchRegex },
          { clientEmail: searchRegex },
          { 'excursionId.title': searchRegex },
        ];
      }

      const totalItems = await ExcursionRequest.countDocuments(query);
      const excursionRequests = await ExcursionRequest.find(query)
        .populate('excursionId', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      res.json({
        success: true,
        data: excursionRequests,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  });
};

// Get a single excursion request by ID
export const getExcursionRequestById = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'ID de demande d\'excursion invalide' });
      }

      const excursionRequest = await ExcursionRequest.findById(id).populate('excursionId');
      if (!excursionRequest) {
        return res.status(404).json({ success: false, message: 'Demande d\'excursion non trouvée' });
      }

      res.json({ success: true, data: excursionRequest });
    } catch (err) {
      console.error('getExcursionRequestById error:', err);
      res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  });
};

// Update an excursion request
export const updateExcursionRequest = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const { id } = req.params;
      const {
        clientName,
        clientEmail,
        clientPhone,
        excursionDate,
        excursionTime,
        numberOfAdults,
        numberOfChildren,
        numberOfBabies,
        message,
        excursionId,
        status,
        paymentPercentage,
        withGuide,
        driverLanguages,
      } = req.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'ID de demande d\'excursion invalide' });
      }

      const excursionRequest = await ExcursionRequest.findById(id);
      if (!excursionRequest) {
        return res.status(404).json({ success: false, message: 'Demande d\'excursion non trouvée' });
      }

      // Store the original status before any updates
      const originalStatus = excursionRequest.status;

      // Validate email format if provided
      if (clientEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(clientEmail)) {
          return res.status(400).json({ success: false, message: 'Format d\'email invalide' });
        }
      }

      // Validate excursionDate if provided
      if (excursionDate && isNaN(new Date(excursionDate).getTime())) {
        return res.status(400).json({ success: false, message: 'Format de date d\'excursion invalide' });
      }

      // Validate driverLanguages if withGuide is true
      if (withGuide && !driverLanguages) {
        return res.status(400).json({ success: false, message: 'Les langues du guide doivent être spécifiées' });
      }

      // Validate excursionId if provided
      let targetExcursionId = excursionRequest.excursionId;
      if (excursionId) {
        if (!mongoose.isValidObjectId(excursionId)) {
          return res.status(400).json({ success: false, message: 'ID d\'excursion invalide' });
        }
        const excursion = await Excursion.findById(excursionId);
        if (!excursion) {
          return res.status(404).json({ success: false, message: 'Excursion non trouvée' });
        }
        targetExcursionId = excursionId;
      }

      // Calculate total number of people if any count is provided
      let totalPeople;
      if (numberOfAdults !== undefined || numberOfChildren !== undefined || numberOfBabies !== undefined) {
        totalPeople =
          (numberOfAdults !== undefined ? Number(numberOfAdults) : excursionRequest.numberOfAdults) +
          (numberOfChildren !== undefined ? Number(numberOfChildren) : excursionRequest.numberOfChildren) +
          (numberOfBabies !== undefined ? Number(numberOfBabies) : excursionRequest.numberOfBabies);

        // Validate total number of people
        if (totalPeople < 1 || totalPeople > 8) {
          return res.status(400).json({ success: false, message: 'Le nombre total de personnes doit être entre 1 et 8' });
        }

        // Validate individual counts
        if (
          (numberOfAdults !== undefined && (numberOfAdults < 0 || numberOfAdults > 8)) ||
          (numberOfChildren !== undefined && (numberOfChildren < 0 || numberOfChildren > 8)) ||
          (numberOfBabies !== undefined && (numberOfBabies < 0 || numberOfBabies > 8))
        ) {
          return res.status(400).json({ success: false, message: 'Les nombres d\'adultes, d\'enfants et de bébés doivent être entre 0 et 8' });
        }
      }

      // Update price if numberOfAdults, numberOfChildren, numberOfBabies, excursionId, or withGuide is provided
      if (numberOfAdults !== undefined || numberOfChildren !== undefined || numberOfBabies !== undefined || excursionId || withGuide !== undefined) {
        const excursion = await Excursion.findById(targetExcursionId);
        if (!excursion) {
          return res.status(404).json({ success: false, message: 'Excursion non trouvée' });
        }
        totalPeople =
          totalPeople ||
          excursionRequest.numberOfAdults + excursionRequest.numberOfChildren + excursionRequest.numberOfBabies;
        let newPrice;
        if (totalPeople >= 1 && totalPeople <= 4) {
          newPrice = excursion.prices.oneToFour;
        } else if (totalPeople >= 5 && totalPeople <= 6) {
          newPrice = excursion.prices.fiveToSix;
        } else if (totalPeople >= 7 && totalPeople <= 8) {
          newPrice = excursion.prices.sevenToEight;
        }
        // Add 200 TND if withGuide is true
        excursionRequest.price = newPrice + (withGuide !== undefined ? (withGuide ? 200 : 0) : (excursionRequest.withGuide ? 200 : 0));
      }

      // Validate status if provided
      if (status && !['pending', 'confirmed', 'completed', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Statut invalide' });
      }

      // Validate paymentPercentage
      let validPaymentPercentage = excursionRequest.paymentPercentage ?? 0;
      if (status && status === 'confirmed') {
        if (paymentPercentage === undefined || (paymentPercentage !== 0 && paymentPercentage !== 100)) {
          return res.status(400).json({ success: false, message: 'Pourcentage de paiement doit être 0 ou 100 pour une excursion confirmée' });
        }
        validPaymentPercentage = Number(paymentPercentage);
      } else if (paymentPercentage !== undefined && paymentPercentage !== 0) {
        return res.status(400).json({ success: false, message: 'Pourcentage de paiement doit être 0 pour un statut non confirmé' });
      }

      // Update fields if provided
      if (clientName) excursionRequest.clientName = clientName;
      if (clientEmail) excursionRequest.clientEmail = clientEmail;
      if (clientPhone) excursionRequest.clientPhone = clientPhone;
      if (excursionDate) excursionRequest.excursionDate = excursionDate;
      if (excursionTime) excursionRequest.excursionTime = excursionTime;
      if (numberOfAdults !== undefined) excursionRequest.numberOfAdults = numberOfAdults;
      if (numberOfChildren !== undefined) excursionRequest.numberOfChildren = numberOfChildren;
      if (numberOfBabies !== undefined) excursionRequest.numberOfBabies = numberOfBabies;
      if (message !== undefined) excursionRequest.message = message;
      if (status) excursionRequest.status = status;
      if (paymentPercentage !== undefined) excursionRequest.paymentPercentage = validPaymentPercentage;
      if (excursionId) excursionRequest.excursionId = excursionId;
      if (withGuide !== undefined) excursionRequest.withGuide = withGuide;
      if (driverLanguages !== undefined) excursionRequest.driverLanguages = withGuide ? driverLanguages : '';

      let emailWarning = null;
      // Check if status changed and is either 'confirmed' or 'rejected'
      if (status && originalStatus !== status && (status === 'confirmed' || status === 'rejected')) {
        console.log(`Status changed from ${originalStatus} to ${status}, attempting to send email to ${excursionRequest.clientEmail}`);
        if (status === 'confirmed') {
          if (!excursionRequest.clientEmail || !excursionRequest.clientName || !excursionRequest.excursionDate) {
            emailWarning = 'Missing required fields for confirmation email';
            console.error(emailWarning);
          } else {
            const excursion = await Excursion.findById(excursionRequest.excursionId);
            if (!excursion) {
              emailWarning = 'Excursion not found for confirmation email';
              console.error(emailWarning);
            } else {
              const emailResult = await sendConfirmationEmail({
                email: excursionRequest.clientEmail,
                clientName: excursionRequest.clientName,
                date: excursionRequest.excursionDate,
                type: 'excursion',
                details: {
                  excursionTitle: excursion.title,
                },
              });
              if (!emailResult.success) {
                emailWarning = emailResult.message;
              }
            }
          }
        } else if (status === 'rejected') {
          if (!excursionRequest.clientEmail || !excursionRequest.clientName || !excursionRequest.excursionDate) {
            emailWarning = 'Missing required fields for rejection email';
            console.error(emailWarning);
          } else {
            const emailResult = await sendRejectionEmail({
              email: excursionRequest.clientEmail,
              clientName: excursionRequest.clientName,
              date: excursionRequest.excursionDate,
              type: 'excursion',
            });
            if (!emailResult.success) {
              emailWarning = emailResult.message;
            }
          }
        }
      } else {
        console.log(`No email sent - Status: ${originalStatus} → ${status || originalStatus}`);
      }

      await excursionRequest.save();
      const response = {
        success: true,
        data: excursionRequest,
        message: 'Demande d\'excursion mise à jour avec succès',
      };
      if (emailWarning) {
        response.warning = emailWarning;
      }
      res.json(response);
    } catch (err) {
      console.error(`Error in updateExcursionRequest: ${err.message}`);
      res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  });
};

// Delete an excursion request
export const deleteExcursionRequest = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'ID de demande d\'excursion invalide' });
      }

      const excursionRequest = await ExcursionRequest.findByIdAndDelete(id);
      if (!excursionRequest) {
        return res.status(404).json({ success: false, message: 'Demande d\'excursion non trouvée' });
      }

      res.json({ success: true, message: 'Demande d\'excursion supprimée avec succès' });
    } catch (err) {
      console.error('deleteExcursionRequest error:', err);
      res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  });
};