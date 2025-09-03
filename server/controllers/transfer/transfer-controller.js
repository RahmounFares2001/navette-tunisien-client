import mongoose from 'mongoose';
import { Transfer, Vehicle } from '../../models/models.js';
import { verifyAdmin } from '../../utils/verifyAdmin.js';
import distances from '../../data/distances.json' assert { type: "json" };
import { sendConfirmationEmail, sendRejectionEmail } from '../../utils/mailer/sendClientMail.js';

export const createTransfer = async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      clientPhone,
      tripType,
      departureLocation,
      departureAddress,
      destination,
      destinationAddress,
      travelDate,
      departureTime,
      flightNumber,
      numberOfAdults,
      numberOfChildren,
      driverLanguage,
      comment,
      vehicleId,
      status,
      paymentPercentage,
    } = req.body;

    // Validate required fields
    if (
      !clientName ||
      !clientEmail ||
      !clientPhone ||
      !tripType ||
      !departureLocation ||
      !destination ||
      !travelDate ||
      !departureTime ||
      !numberOfAdults ||
      !vehicleId
    ) {
      return res.status(400).json({ success: false, message: 'Des champs obligatoires doivent être remplis' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      return res.status(400).json({ success: false, message: 'Format d\'email invalide' });
    }

    // Validate travelDate
    if (isNaN(new Date(travelDate).getTime())) {
      return res.status(400).json({ success: false, message: 'Format de date de voyage invalide' });
    }

    // Validate tripType
    if (!['aller simple', 'aller retour'].includes(tripType)) {
      return res.status(400).json({ success: false, message: 'Type de voyage doit être "aller simple" ou "aller retour"' });
    }

    // Validate vehicleId
    if (!mongoose.isValidObjectId(vehicleId)) {
      return res.status(400).json({ success: false, message: 'ID de véhicule invalide' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Véhicule non trouvé' });
    }

    // Validate status if provided
    if (status && !['pending', 'confirmed', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }

    // Validate paymentPercentage
    let validPaymentPercentage = 0; // Default per schema
    if (status === 'confirmed') {
      if (paymentPercentage === undefined || (paymentPercentage !== 0 && paymentPercentage !== 100)) {
        return res.status(400).json({ success: false, message: 'Pourcentage de paiement doit être 0 ou 100 pour un transfert confirmé' });
      }
      validPaymentPercentage = Number(paymentPercentage);
    } else if (paymentPercentage !== undefined && paymentPercentage !== 0) {
      return res.status(400).json({ success: false, message: 'Pourcentage de paiement doit être 0 pour un statut non confirmé' });
    }

    // Validate numberOfChildren
    if (numberOfChildren !== undefined && (typeof numberOfChildren !== 'number' || numberOfChildren < 0)) {
      return res.status(400).json({ success: false, message: 'Nombre d\'enfants doit être un nombre positif ou zéro' });
    }

    // Calculate distance and price
    let distance = distances.find(
      d => (d.from === departureLocation && d.to === destination) || (d.from === destination && d.to === departureLocation)
    )?.distance_km || 0;

    if (!distance) {
      return res.status(400).json({ success: false, message: 'Distance non trouvée pour ce trajet' });
    }

    const price = tripType === 'aller retour' ? distance * vehicle.pricePerKm * 2 : distance * vehicle.pricePerKm;

    const transferData = {
      clientName,
      clientEmail,
      clientPhone,
      tripType,
      departureLocation,
      departureAddress: departureAddress || undefined,
      destination,
      destinationAddress: destinationAddress || undefined,
      travelDate,
      departureTime,
      flightNumber: flightNumber || undefined,
      numberOfAdults,
      numberOfChildren: numberOfChildren ?? 0,
      driverLanguage: driverLanguage || [],
      comment: comment || undefined,
      vehicleId,
      price,
      status: status || 'pending',
      paymentPercentage: validPaymentPercentage,
    };

    const transfer = new Transfer(transferData);

    // Explicitly set paymentPercentage to ensure it's included
    transfer.paymentPercentage = validPaymentPercentage;

    let emailWarning = null;
    // Send email if status is 'confirmed' or 'rejected'
    if (status && (status === 'confirmed' || status === 'rejected')) {
      console.log(`Creating transfer with status ${status}, attempting to send email to ${transferData.clientEmail}`);
      if (status === 'confirmed') {
        if (!transferData.clientEmail || !transferData.clientName || !transferData.travelDate || !transferData.tripType || !transferData.departureLocation || !transferData.destination) {
          emailWarning = 'Missing required fields for confirmation email';
          console.error(emailWarning);
        } else {
          const emailResult = await sendConfirmationEmail({
            email: transferData.clientEmail,
            clientName: transferData.clientName,
            date: transferData.travelDate,
            type: 'transfer',
            details: {
              tripType: transferData.tripType,
              departureLocation: transferData.departureLocation,
              destination: transferData.destination,
            },
          });
          if (!emailResult.success) {
            emailWarning = emailResult.message;
          }
        }
      } else if (status === 'rejected') {
        if (!transferData.clientEmail || !transferData.clientName || !transferData.travelDate) {
          emailWarning = 'Missing required fields for rejection email';
          console.error(emailWarning);
        } else {
          const emailResult = await sendRejectionEmail({
            email: transferData.clientEmail,
            clientName: transferData.clientName,
            date: transferData.travelDate,
            type: 'transfer',
          });
          if (!emailResult.success) {
            emailWarning = emailResult.message;
          }
        }
      }
    } else {
      console.log(`No email sent - Status: ${status || 'pending'}`);
    }

    await transfer.save();
    
    // Verify document in DB
    const savedTransfer = await Transfer.findById(transfer._id).lean();

    const response = {
      success: true,
      data: transfer,
      message: 'Transfert créé avec succès',
    };
    if (emailWarning) {
      response.warning = emailWarning;
    }
    res.json(response);
  } catch (err) {
    console.error(`Error in createTransfer: ${err.message}`);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
};

export const getAllTransfers = async (req, res) => {
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
          { clientPhone: { $regex: search, $options: 'i' } },
        ];
      }

      const totalItems = await Transfer.countDocuments(query);
      const transfers = await Transfer.find(query)
        .populate('vehicleId', 'name')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

      res.json({
        success: true,
        data: transfers,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  });
};

export const getTransferById = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'ID de transfert invalide' });
      }

      const transfer = await Transfer.findById(id).populate('vehicleId');
      if (!transfer) {
        return res.status(404).json({ success: false, message: 'Transfert non trouvé' });
      }

      res.json({ success: true, data: transfer });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  });
};

export const updateTransfer = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const { id } = req.params;
      const {
        clientName,
        clientEmail,
        clientPhone,
        tripType,
        departureLocation,
        departureAddress,
        destination,
        destinationAddress,
        travelDate,
        departureTime,
        flightNumber,
        numberOfAdults,
        numberOfChildren,
        driverLanguage,
        comment,
        status,
        vehicleId,
        paymentPercentage,
      } = req.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'ID de transfert invalide' });
      }

      const transfer = await Transfer.findById(id);
      if (!transfer) {
        return res.status(404).json({ success: false, message: 'Transfert non trouvé' });
      }

      // Store the original status before any updates
      const originalStatus = transfer.status;

      // Validate email format if provided
      if (clientEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(clientEmail)) {
          return res.status(400).json({ success: false, message: 'Format d\'email invalide' });
        }
      }

      // Validate travelDate if provided
      if (travelDate && isNaN(new Date(travelDate).getTime())) {
        return res.status(400).json({ success: false, message: 'Format de date de voyage invalide' });
      }

      let price = transfer.price;
      if (vehicleId) {
        if (!mongoose.isValidObjectId(vehicleId)) {
          return res.status(400).json({ success: false, message: 'ID de véhicule invalide' });
        }
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
          return res.status(404).json({ success: false, message: 'Véhicule non trouvé' });
        }
        transfer.vehicleId = vehicleId;

        if (departureLocation || destination || tripType) {
          const newDeparture = departureLocation || transfer.departureLocation;
          const newDestination = destination || transfer.destination;
          const newTripType = tripType || transfer.tripType;

          const distance = distances.find(
            d => (d.from === newDeparture && d.to === newDestination) || (d.from === newDestination && d.to === newDeparture)
          )?.distance_km || 0;

          if (!distance) {
            return res.status(400).json({ success: false, message: 'Distance non trouvée pour ce trajet' });
          }

          price = newTripType === 'aller retour' ? distance * vehicle.pricePerKm * 2 : distance * vehicle.pricePerKm;
        }
      }

      if (tripType && !['aller simple', 'aller retour'].includes(tripType)) {
        return res.status(400).json({ success: false, message: 'Type de voyage doit être "aller simple" ou "aller retour"' });
      }

      if (status && !['pending', 'confirmed', 'completed', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Statut invalide' });
      }

      let validPaymentPercentage = transfer.paymentPercentage ?? 0;
      if (status && status === 'confirmed') {
        if (paymentPercentage === undefined || (paymentPercentage !== 0 && paymentPercentage !== 100)) {
          return res.status(400).json({ success: false, message: 'Pourcentage de paiement doit être 0 ou 100 pour un transfert confirmé' });
        }
        validPaymentPercentage = Number(paymentPercentage);
      } else if (paymentPercentage !== undefined && paymentPercentage !== 0) {
        return res.status(400).json({ success: false, message: 'Pourcentage de paiement doit être 0 pour un statut non confirmé' });
      }

      if (numberOfChildren !== undefined && (typeof numberOfChildren !== 'number' || numberOfChildren < 0)) {
        return res.status(400).json({ success: false, message: 'Nombre d\'enfants doit être un nombre positif ou zéro' });
      }

      const transferData = {
        clientName: clientName || transfer.clientName,
        clientEmail: clientEmail || transfer.clientEmail,
        clientPhone: clientPhone || transfer.clientPhone,
        tripType: tripType || transfer.tripType,
        departureLocation: departureLocation || transfer.departureLocation,
        departureAddress: departureAddress !== undefined ? departureAddress : transfer.departureAddress,
        destination: destination || transfer.destination,
        destinationAddress: destinationAddress !== undefined ? destinationAddress : transfer.destinationAddress,
        travelDate: travelDate || transfer.travelDate,
        departureTime: departureTime || transfer.departureTime,
        flightNumber: flightNumber !== undefined ? flightNumber : transfer.flightNumber,
        numberOfAdults: numberOfAdults || transfer.numberOfAdults,
        numberOfChildren: numberOfChildren !== undefined ? numberOfChildren : transfer.numberOfChildren,
        driverLanguage: driverLanguage || transfer.driverLanguage,
        comment: comment !== undefined ? comment : transfer.comment,
        status: status || transfer.status,
        paymentPercentage: validPaymentPercentage,
        price,
        vehicleId: vehicleId || transfer.vehicleId,
      };

      // Update the transfer object
      Object.assign(transfer, transferData);
      transfer.paymentPercentage = validPaymentPercentage;

      let emailWarning = null;
      
      // Check if status changed and is either 'confirmed' or 'rejected'
      if (status && originalStatus !== status && (status === 'confirmed' || status === 'rejected')) {
        console.log(`Status changed from ${originalStatus} to ${status}, attempting to send email to ${transferData.clientEmail}`);
        
        if (status === 'confirmed') {
          if (!transferData.clientEmail || !transferData.clientName || !transferData.travelDate || !transferData.tripType || !transferData.departureLocation || !transferData.destination) {
            emailWarning = 'Missing required fields for confirmation email';
            console.error(emailWarning);
          } else {
            const emailResult = await sendConfirmationEmail({
              email: transferData.clientEmail,
              clientName: transferData.clientName,
              date: transferData.travelDate,
              type: 'transfer',
              details: {
                tripType: transferData.tripType,
                departureLocation: transferData.departureLocation,
                destination: transferData.destination,
              },
            });
            if (!emailResult.success) {
              emailWarning = emailResult.message;
            }
          }
        } else if (status === 'rejected') {
          if (!transferData.clientEmail || !transferData.clientName || !transferData.travelDate) {
            emailWarning = 'Missing required fields for rejection email';
            console.error(emailWarning);
          } else {
            const emailResult = await sendRejectionEmail({
              email: transferData.clientEmail,
              clientName: transferData.clientName,
              date: transferData.travelDate,
              type: 'transfer',
            });
            if (!emailResult.success) {
              emailWarning = emailResult.message;
            }
          }
        }
      } else {
        console.log(`No email sent - Status: ${originalStatus} → ${status || originalStatus}`);
      }

      await transfer.save();
      const response = {
        success: true,
        data: transfer,
        message: 'Transfert mis à jour avec succès',
      };
      if (emailWarning) {
        response.warning = emailWarning;
      }
      res.json(response);
    } catch (err) {
      console.error(`Error in updateTransfer: ${err.message}`);
      res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  });
};

export const deleteTransfer = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'ID de transfert invalide' });
      }

      const transfer = await Transfer.findByIdAndDelete(id);
      if (!transfer) {
        return res.status(404).json({ success: false, message: 'Transfert non trouvé' });
      }

      res.json({ success: true, message: 'Transfert supprimé avec succès' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  });
};