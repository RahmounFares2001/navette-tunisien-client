import mongoose from "mongoose";
import { verifyAdmin } from "../../utils/verifyAdmin.js";
import { Reservation, User, Car } from "../../models/models.js";
import { createMulter } from '../../utils/multerConfigUser.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createUser } from "../../utils/user/createUser.js";
import { isSameDay, parseISO, isValid, isAfter } from "date-fns";
import { sendConfirmationEmail } from "../../utils/mailer/sendConfirmationConfig.js";

export const getAllReservations = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      const query = {};

      if (status && status !== "all") {
        if (status === "confirmed payée 30%") {
          query.status = "confirmed";
          query.paymentPercentage = 30;
        } else if (status === "confirmed payée 100%") {
          query.status = "confirmed";
          query.paymentPercentage = 100;
        } else if (status === "payée (30%) en attente de confirmation") {
          query.status = "paid";
          query.paymentPercentage = 30;
        } else if (status === "payée (100%) en attente de confirmation") {
          query.status = "paid";
          query.paymentPercentage = 100;
        } else {
          query.status = status;
        }
      }

      if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        const matchingUsers = await User.find({
          $or: [
            { fullName: searchRegex },
            { email: searchRegex },
          ],
        }).select('_id');
        const matchingCars = await Car.find({
          $or: [
            { brand: searchRegex },
            { model: searchRegex },
          ],
        }).select('_id');

        const userIds = matchingUsers.map((user) => user._id);
        const carIds = matchingCars.map((car) => car._id);

        if (userIds.length === 0 && carIds.length === 0) {
          return res.json({
            success: true,
            data: [],
            total: 0,
            currentPage: Number(page),
            totalPages: 0,
          });
        }

        query.$or = [];
        if (userIds.length > 0) {
          query.$or.push({ user: { $in: userIds } });
        }
        if (carIds.length > 0) {
          query.$or.push({ car: { $in: carIds } });
        }
      }

      const reservations = await Reservation.find(query)
        .populate('user')
        .populate('car')
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean();

      const total = await Reservation.countDocuments(query);

      res.json({
        success: true,
        data: reservations,
        total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      });
    } catch (error) {
      console.error("getAllReservations error:", error);
      res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
    }
  });
};

export const getReservationById = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "ID invalide" });
      const reservation = await Reservation.findById(id)
        .populate("user")
        .populate("car")
        .lean();
      if (!reservation) return res.status(404).json({ message: "Réservation non trouvée" });
      res.json({ data: reservation });
    } catch (error) {
      console.error("getReservationById error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });
};

export const getActiveReservationByLicenseId = async (req, res) => {
  try {
    const { licenseIDNumber } = req.params;

    const user = await User.findOne({ licenseIDNumber });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé", data: null });
    }

    const reservations = await Reservation.find({
      user: user._id,
      status: { $in: ["confirmed"] },
    })
      .populate("user")
      .populate("car");

    if (!reservations) {
      return res.status(404).json({ message: "Aucune réservation active trouvée", data: null });
    }

    return res.status(200).json({ message: "Réservation active récupérée avec succès", data: reservations });
  } catch (error) {
    console.error("Error fetching active reservation:", error);
    return res.status(500).json({ message: "Erreur serveur", data: null });
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createReservation = async (req, res) => {
  verifyAdmin(req, res, async () => {
    const uploadPath = join(__dirname, '../../var/secure_docs/users');
    const upload = createMulter(uploadPath, 5 * 1024 * 1024);

    try {
      await new Promise((resolve, reject) => {
        upload(req, res, (err) => {
          if (err) {
            console.error('Multer error in createReservation:', err.message);
            return reject(new Error(`Multer error: ${err.message}`));
          }
          resolve();
        });
      });

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        let userData;
        if (req.body.user && typeof req.body.user === 'string') {
          try {
            userData = JSON.parse(req.body.user);
          } catch (error) {
            throw new Error('Invalid user data format');
          }
        } else if (req.body.userData) {
          try {
            userData = JSON.parse(req.body.userData);
          } catch (error) {
            throw new Error('Invalid userData format');
          }
        }

        const {
          isNewClient = req.body.isNewClient,
          car = req.body.car,
          matriculation = req.body.matriculation,
          pickupLocation = req.body.pickupLocation,
          dropoffLocation = req.body.dropoffLocation,
          pickupDate = req.body.pickupDate,
          dropoffDate = req.body.dropoffDate,
          pickupTime = req.body.pickupTime,
          dropoffTime = req.body.dropoffTime,
          status = req.body.status,
          paymentPercentage = req.body.paymentPercentage,
          totalPrice = req.body.totalPrice,
          amountPaid = req.body.amountPaid,
          flightNumber = req.body.flightNumber,
          userId = req.body.userId,
        } = req.body;

        if (
          (!userData && !userId) ||
          !car ||
          !matriculation ||
          !pickupLocation ||
          !dropoffLocation ||
          !pickupDate ||
          !dropoffDate ||
          !pickupTime ||
          !dropoffTime ||
          totalPrice == null
        ) {
          throw new Error('Tous les champs obligatoires doivent être fournis');
        }

        let finalUserId;
        if (isNewClient === 'true' || isNewClient === true) {
          if (
            !userData ||
            !userData.fullName ||
            !userData.email ||
            !userData.phone ||
            !userData.licenseIDNumber ||
            !req.files ||
            !req.files.identity ||
            !req.files.license
          ) {
            throw new Error('Tous les champs utilisateur et fichiers sont requis pour un nouveau client');
          }

          const newUser = await createUser(userData, req.files, session);
          finalUserId = newUser.data._id;
        } else {
          finalUserId = userId || userData?.id || userData?._id;
          if (!finalUserId) {
            throw new Error('ID utilisateur requis pour les clients existants');
          }
          if (!mongoose.Types.ObjectId.isValid(finalUserId)) {
            throw new Error('ID utilisateur invalide');
          }
          const userExists = await User.findById(finalUserId).session(session);
          if (!userExists) {
            throw new Error('Utilisateur non trouvé');
          }
        }

        if (!mongoose.Types.ObjectId.isValid(car)) {
          throw new Error('ID véhicule invalide');
        }

        const parseUTCDate = (dateStr) => {
          const [year, month, day] = dateStr.split('-').map(Number);
          return new Date(Date.UTC(year, month - 1, day));
        };

        const pickup = parseUTCDate(pickupDate);
        const dropoff = parseUTCDate(dropoffDate);
        const today = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));

        if (pickup >= dropoff) {
          throw new Error('La date de restitution doit être après la date de prise en charge');
        }

        const carDoc = await Car.findById(car).session(session);
        if (!carDoc) {
          throw new Error('Véhicule non trouvé');
        }

        const matriculationDoc = carDoc.matriculations.find(m => m.plateNumber === matriculation);
        if (!matriculationDoc) {
          throw new Error('Immatriculation non trouvée');
        }
        if (matriculationDoc.status === 'maintenance') {
          throw new Error("L'immatriculation sélectionnée est en maintenance");
        }

        matriculationDoc.unavailablePeriods = Array.isArray(matriculationDoc.unavailablePeriods)
          ? matriculationDoc.unavailablePeriods
          : [];

        const hasOverlap = matriculationDoc.unavailablePeriods.some(period => {
          try {
            const periodStart = parseUTCDate(period.startDate.toISOString().split('T')[0]);
            const periodEnd = parseUTCDate(period.endDate.toISOString().split('T')[0]);
            return pickup <= periodEnd && dropoff >= periodStart;
          } catch {
            return false;
          }
        });
        if (hasOverlap) {
          throw new Error("L'immatriculation sélectionnée n'est pas disponible pour les dates choisies");
        }

        if ((status === 'paid' || status === 'confirmed') && !paymentPercentage) {
          throw new Error("Le pourcentage de paiement est requis pour les statuts 'Payée' ou 'Confirmée'");
        }
        if (!['paid', 'confirmed'].includes(status) && paymentPercentage) {
          throw new Error("Le pourcentage de paiement ne doit être fourni que pour les statuts 'Payée' ou 'Confirmée'");
        }

        const newReservation = new Reservation({
          user: finalUserId,
          car,
          matriculation,
          pickupLocation,
          dropoffLocation,
          pickupDate: pickup,
          dropoffDate: dropoff,
          pickupTime,
          dropoffTime,
          status,
          paymentPercentage: ['paid', 'confirmed'].includes(status) ? Number(paymentPercentage) : 0,
          totalPrice: Number(totalPrice),
          amountPaid: Number(amountPaid) || 0,
          flightNumber: flightNumber || null,
        });

        if (status === 'confirmed') {
          const updateFields = {
            $push: {
              'matriculations.$.unavailablePeriods': {
                startDate: pickup,
                endDate: dropoff,
                reservationId: newReservation._id,
              }
            }
          };

          if (!isAfter(pickup, today) || isSameDay(pickup, today)) {
            updateFields.$set = { 'matriculations.$.status': 'rented' };
          }

          await Car.updateOne(
            { _id: car, 'matriculations.plateNumber': matriculation },
            updateFields,
            { session }
          );
        }

        await newReservation.save({ session });

        await session.commitTransaction();

        const populated = await Reservation.findById(newReservation._id)
          .populate('user')
          .populate('car')
          .lean();

        return res.status(201).json({ data: populated });
      } catch (error) {
        await session.abortTransaction();
        console.error('createReservation error:', {
          message: error.message,
          stack: error.stack,
          requestBody: req.body,
        });
        return res.status(error.message.includes('non trouvé') ? 404 : 400).json({ message: error.message });
      } finally {
        session.endSession();
      }
    } catch (multerError) {
      console.error('createReservation: Multer processing error:', {
        message: multerError.message,
        stack: multerError.stack,
      });
      return res.status(400).json({
        message: `Failed to process multipart/form-data: ${multerError.message}`,
        details: { error: multerError.message },
      });
    }
  });
};

export const updateReservation = async (req, res) => {
  verifyAdmin(req, res, async () => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { id } = req.params;
      const {
        user,
        car,
        matriculation,
        pickupLocation,
        dropoffLocation,
        pickupDate,
        dropoffDate,
        pickupTime,
        dropoffTime,
        status,
        paymentPercentage,
        totalPrice,
        amountPaid,
        flightNumber,
      } = req.body;

      if (!user || !car || !matriculation || !pickupLocation || !dropoffLocation || !pickupDate || !dropoffDate || !pickupTime || !dropoffTime || totalPrice == null) {
        throw new Error("Tous les champs obligatoires doivent être fournis");
      }

      const userId = typeof user === 'object' && user._id ? user._id : user;
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("ID utilisateur invalide");
      }

      const carId = typeof car === 'object' && car._id ? car._id : car;
      if (!mongoose.Types.ObjectId.isValid(carId)) {
        throw new Error("ID véhicule invalide");
      }

      const parseUTCDate = (dateInput) => {
        if (typeof dateInput === 'string' && dateInput.includes('T')) {
          const dateObj = new Date(dateInput);
          return new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()));
        }
        if (typeof dateInput === 'string') {
          const [year, month, day] = dateInput.split('-').map(Number);
          return new Date(Date.UTC(year, month - 1, day));
        }
        if (dateInput instanceof Date) {
          return new Date(Date.UTC(dateInput.getUTCFullYear(), dateInput.getUTCMonth(), dateInput.getUTCDate()));
        }
        throw new Error("Format de date invalide");
      };

      const pickup = parseUTCDate(pickupDate);
      const dropoff = parseUTCDate(dropoffDate);
      const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));

      if (!isValid(pickup) || !isValid(dropoff)) {
        throw new Error("Les dates sélectionnées ne sont pas valides");
      }

      if (pickup >= dropoff) {
        throw new Error("La date de restitution doit être après la date de prise en charge");
      }

      const reservation = await Reservation.findById(id).session(session);
      if (!reservation) {
        throw new Error("Réservation non trouvée");
      }

      const userExists = await User.findById(userId).session(session);
      if (!userExists) {
        throw new Error("Utilisateur non trouvé");
      }

      const carDoc = await Car.findById(carId).session(session);
      if (!carDoc) {
        throw new Error("Véhicule non trouvé");
      }

      const matriculationDoc = carDoc.matriculations.find(m => m.plateNumber === matriculation);
      if (!matriculationDoc) {
        throw new Error("Immatriculation non trouvée");
      }
      if (matriculationDoc.status === 'maintenance') {
        throw new Error("L'immatriculation sélectionnée est en maintenance");
      }

      if (!Array.isArray(matriculationDoc.unavailablePeriods)) {
        await Car.updateOne(
          { _id: carId, 'matriculations.plateNumber': matriculation },
          { $set: { 'matriculations.$.unavailablePeriods': [] } },
          { session }
        );
        matriculationDoc.unavailablePeriods = [];
      }

      const reservationPickupStr = reservation.pickupDate.toISOString().split('T')[0];
      const reservationDropoffStr = reservation.dropoffDate.toISOString().split('T')[0];
      const newPickupStr = pickup.toISOString().split('T')[0];
      const newDropoffStr = dropoff.toISOString().split('T')[0];

      if (matriculation !== reservation.matriculation || newPickupStr !== reservationPickupStr || newDropoffStr !== reservationDropoffStr) {
        const hasOverlap = matriculationDoc.unavailablePeriods.some(period => {
          if (period.reservationId && period.reservationId.toString() === id) return false;
          const periodStart = parseUTCDate(period.startDate);
          const periodEnd = parseUTCDate(period.endDate);
          return pickup <= periodEnd && dropoff >= periodStart;
        });
        if (hasOverlap) {
          throw new Error("L'immatriculation sélectionnée n'est pas disponible pour les dates choisies");
        }
      }

      if ((status === 'paid' || status === 'confirmed') && !paymentPercentage) {
        throw new Error("Le pourcentage de paiement est requis pour les statuts 'Payée' ou 'Confirmée'");
      }
      if (!['paid', 'confirmed'].includes(status || '') && paymentPercentage) {
        throw new Error("Le pourcentage de paiement ne doit être fourni que pour les statuts 'Payée' ou 'Confirmée'");
      }

      if (reservation.matriculation && (matriculation !== reservation.matriculation || status !== reservation.status || newPickupStr !== reservationPickupStr || newDropoffStr !== reservationDropoffStr)) {
        await Car.updateOne(
          { _id: reservation.car, 'matriculations.plateNumber': reservation.matriculation },
          { $pull: { 'matriculations.$.unavailablePeriods': { reservationId: id } } },
          { session }
        );

        if (reservation.status === 'confirmed') {
          await Car.updateOne(
            { _id: reservation.car, 'matriculations.plateNumber': reservation.matriculation },
            { $set: { 'matriculations.$.status': 'available' } },
            { session }
          );
        }
      }

      if (status === 'confirmed') {
        const updateFields = {
          $push: {
            'matriculations.$.unavailablePeriods': {
              startDate: pickup,
              endDate: dropoff,
              reservationId: id,
            }
          }
        };

        const dateFormatter = (date) => {
          const d = new Date(date);
          return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        };

          const emailData = {
            name: userExists.fullName || 'Client',
            email: userExists.email,
            subject: 'CONFIRMATION DE RÉSERVATION - CHALLENGE RENT A CAR',
            dateDebut: dateFormatter(pickupDate),
            dateFin: dateFormatter(dropoffDate),
            modelVoiture: `${carDoc.brand} ${carDoc.model}`,
            locataire: userExists.fullName || 'Client',
            totaliteLoyer: `${totalPrice.toFixed(3)} dinars`,
            avance: `${amountPaid.toFixed(3)} dinars`,
            resteAPayer: `${(totalPrice - amountPaid).toFixed(3)} dinars`,
            dateEmission: dateFormatter(new Date()),
          };
           
           await sendConfirmationEmail(emailData);

        if (!isAfter(pickup, today) || isSameDay(pickup, today)) {
          updateFields.$set = { 'matriculations.$.status': 'rented' };
        }

        await Car.updateOne(
          { _id: carId, 'matriculations.plateNumber': matriculation },
          updateFields,
          { session }
        );
      } else if (status === 'completed' || status === 'cancelled' || status === 'pending' || status === 'rejected') {
        await Car.updateOne(
          { _id: carId, 'matriculations.plateNumber': matriculation },
          {
            $set: { 'matriculations.$.status': 'available' },
            $pull: { 'matriculations.$.unavailablePeriods': { reservationId: id } }
          },
          { session }
        );
      } else {
        if (matriculationDoc.status === 'rented' && reservation.status === 'confirmed') {
          await Car.updateOne(
            { _id: carId, 'matriculations.plateNumber': matriculation },
            {
              $set: { 'matriculations.$.status': 'available' },
              $pull: { 'matriculations.$.unavailablePeriods': { reservationId: id } }
            },
            { session }
          );
        }
      }

      const updatedReservation = await Reservation.findByIdAndUpdate(
        id,
        {
          user: userId,
          car: carId,
          matriculation,
          pickupLocation,
          dropoffLocation,
          pickupDate: pickup,
          dropoffDate: dropoff,
          pickupTime,
          dropoffTime,
          status,
          paymentPercentage: ['paid', 'confirmed'].includes(status) ? Number(paymentPercentage) : 0,
          totalPrice: Number(totalPrice),
          amountPaid: Number(amountPaid) || 0,
          flightNumber: flightNumber || null,
        },
        { new: true, session }
      ).populate("user car");

      if (!updatedReservation) {
        throw new Error("Échec de la mise à jour de la réservation");
      }

      await session.commitTransaction();
      return res.status(200).json({ data: updatedReservation });
    } catch (error) {
      await session.abortTransaction();
      console.error("updateReservation error:", {
        message: error.message,
        stack: error.stack,
        requestBody: req.body,
        params: req.params,
      });
      return res.status(error.message.includes('non trouvé') ? 404 : 400).json({ message: error.message });
    } finally {
      session.endSession();
    }
  });
};

export const deleteReservation = async (req, res) => {
  verifyAdmin(req, res, async () => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "ID invalide" });
      }

      const reservation = await Reservation.findById(id).session(session);
      if (!reservation) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Réservation non trouvée" });
      }

      if (reservation.matriculation && reservation.status === 'confirmed') {
        await Car.updateOne(
          { _id: reservation.car, "matriculations.plateNumber": reservation.matriculation },
          {
            $set: { "matriculations.$.status": "available" },
            $pull: { "matriculations.$.unavailablePeriods": { reservationId: id } }
          },
          { session }
        );
      }

      await Reservation.findByIdAndDelete(id, { session });
      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({ message: "Réservation supprimée" });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("deleteReservation error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });
};

export const getAvailableCars = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const cars = await Car.find().lean();
      const availableCars = cars.map(car => ({
        _id: car._id,
        brand: car.brand,
        model: car.model,
        type: car.type,
        pricePerDay: car.pricePerDay,
        availableQuantity: car.matriculations.filter(m => m.status === "available").length
      }));
      const totalAvailable = availableCars.reduce((sum, car) => sum + car.availableQuantity, 0);
      res.json({ data: availableCars, totalAvailable });
    } catch (error) {
      console.error("getAvailableCars error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });
};