import mongoose from "mongoose";
import axios from 'axios';
import { ProlongationRequest, Reservation, User, Car } from "../../models/models.js";
import { verifyAdmin } from "../../utils/verifyAdmin.js";
import { sendPaymentLinkEmail } from "../../utils/mailer/sendPaymentLinkMailConfig.js";
import { config } from 'dotenv';

import { isSameDay, parseISO, isValid, isAfter } from "date-fns";
import { sendProlongationRejectionEmail } from "../../utils/mailer/sendRejectionNotification.js";

config();

const KONNECT_API_URL = process.env.KONNECT_API_URL;
const KONNECT_WALLET_ID = process.env.KONNECT_WALLET_ID;
const KONNECT_API_KEY = process.env.KONNECT_API_KEY;
const SUCCESS_URL = process.env.SUCCESS_URL_PROLONGATION ;
const ERROR_URL = process.env.ERROR_URL;
const MAILER_USER = process.env.MAILER_USER;
const MAILER_PASSWORD = process.env.MAILER_PASSWORD;

if (!KONNECT_API_URL || !KONNECT_WALLET_ID || !KONNECT_API_KEY || !SUCCESS_URL || !ERROR_URL || !MAILER_USER || !MAILER_PASSWORD) {
  throw new Error('Missing required environment variables');
}

// Create a new prolongation request (no admin verification)
export const createProlongationRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reservation, newDropoffDate, totalPrice, reduction } = req.body;

    if (!reservation || !mongoose.isValidObjectId(reservation)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "ID de réservation invalide ou manquant" });
    }
    if (!newDropoffDate || isNaN(new Date(newDropoffDate).getTime())) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Nouvelle date de restitution invalide ou manquante" });
    }
    if (totalPrice == null || isNaN(totalPrice)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Prix total invalide ou manquant" });
    }
    if (reduction == null || isNaN(reduction) || ![0, 5, 10, 15].includes(reduction)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Réduction invalide" });
    }

    const existingReservation = await Reservation.findById(reservation)
      .populate("car")
      .session(session);
    if (!existingReservation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Réservation non trouvée" });
    }
    if (!["confirmed", "paid"].includes(existingReservation.status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "La réservation doit être confirmée ou payée pour demander une prolongation" });
    }

    const newDropoff = new Date(newDropoffDate);
    const currentDropoff = new Date(existingReservation.dropoffDate);
    if (newDropoff <= currentDropoff) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "La nouvelle date de restitution doit être postérieure à la date actuelle" });
    }

    const additionalDays = Math.ceil(
      (newDropoff.getTime() - currentDropoff.getTime()) / (1000 * 60 * 60 * 24)
    );

    const prolongation = new ProlongationRequest({
      reservation,
      newDropoffDate: newDropoff,
      totalPrice,
      reduction,
      additionalDays,
    });

    await prolongation.save({ session });

    await session.commitTransaction();
    session.endSession();

    await prolongation.populate({
      path: "reservation",
      populate: [
        { path: "user", select: "fullName email licenseIDNumber" },
        { path: "car", select: "brand model pricePerDay" },
      ],
    });

    res.status(201).json({ success: true });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("createProlongationRequest error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
  }
};

// Get all prolongation requests
export const getAllProlongationRequests = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const { page = 1, licenseIDNumber, search, status } = req.query;
      const limit = 10;
      const query = {};

      if (licenseIDNumber) {
        const users = await User.find({ licenseIDNumber }).select('_id');
        const userIds = users.map((user) => user._id);
        const reservations = await Reservation.find({ user: { $in: userIds } }).select('_id');
        const reservationIds = reservations.map((r) => r._id);
        query.reservation = { $in: reservationIds };
      }

      if (status && status !== 'all') {
        query.status = status;
      }

      let requests;
      let total;

      if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        // First, get reservations with matching users or cars
        const matchingUsers = await User.find({
          $or: [
            { fullName: searchRegex },
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

        const reservationQuery = {};
        if (userIds.length > 0 || carIds.length > 0) {
          reservationQuery.$or = [];
          if (userIds.length > 0) {
            reservationQuery.$or.push({ user: { $in: userIds } });
          }
          if (carIds.length > 0) {
            reservationQuery.$or.push({ car: { $in: carIds } });
          }
        } else {
          // If no users or cars match, return empty result
          return res.json({
            success: true,
            data: [],
            total: 0,
            currentPage: Number(page),
            totalPages: 0,
          });
        }

        const matchingReservations = await Reservation.find(reservationQuery).select('_id');
        const reservationIds = matchingReservations.map((r) => r._id);

        if (reservationIds.length === 0) {
          // If no reservations match, return empty result
          return res.json({
            success: true,
            data: [],
            total: 0,
            currentPage: Number(page),
            totalPages: 0,
          });
        }

        query.reservation = { $in: reservationIds };
      }

      requests = await ProlongationRequest.find(query)
        .populate({
          path: 'reservation',
          populate: [
            { path: 'user' },
            { path: 'car' },
          ],
        })
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * limit)
        .limit(limit);

      total = await ProlongationRequest.countDocuments(query);

      res.json({
        success: true,
        data: requests,
        total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      console.error('getAllProlongationRequests error:', err);
      res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  });
};

// Get a single prolongation request by ID
export const getProlongationRequestById = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const { id } = req.params;
      const { licenseIDNumber } = req.query;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: "ID de demande de prolongation invalide" });
      }

      const request = await ProlongationRequest.findById(id).populate({
        path: "reservation",
        populate: [
          { path: "user", select: "fullName email licenseIDNumber" },
          { path: "car", select: "brand model pricePerDay" },
        ],
      });

      if (!request) {
        return res.status(404).json({ success: false, message: "Demande de prolongation non trouvée" });
      }

      if (licenseIDNumber) {
        if (!request.reservation || !request.reservation.user) {
          return res.status(404).json({ success: false, message: "Réservation ou utilisateur non trouvé" });
        }
        if (request.reservation.user.licenseIDNumber !== licenseIDNumber) {
          return res.status(403).json({ success: false, message: "Le numéro de permis ne correspond pas au propriétaire de la réservation" });
        }
      }

      res.json({ success: true, data: request });
    } catch (err) {
      console.error("getProlongationRequestById error:", err);
      res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
    }
  });
};

// Update status of prolongation request
export const updateProlongationStatus = async (req, res) => {
  verifyAdmin(req, res, async () => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;
      const { status, paymentMethod, newDropoffDate } = req.body;

      if (!mongoose.isValidObjectId(id)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: "ID de demande de prolongation invalide" });
      }

      const validStatuses = ["pending", "accepted", "rejected", "waiting_for_payment"];
      if (!status || !validStatuses.includes(status)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: `Statut invalide. Doit être l'un des suivants : ${validStatuses.join(", ")}` });
      }

      const request = await ProlongationRequest.findById(id).populate({
        path: "reservation",
        populate: [
          { path: "user", select: "fullName email phone" },
          { path: "car", select: "brand model pricePerDay matriculations" },
        ],
      }).session(session);

      if (!request) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: "Demande de prolongation non trouvée" });
      }

      const reservation = await Reservation.findById(request.reservation).session(session);
      if (!reservation) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: "Réservation associée non trouvée" });
      }

      // Convert dates to UTC, mirroring updateReservation
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

      let effectiveDropoffDate = parseUTCDate(request.newDropoffDate);
      if (newDropoffDate) {
        const newDropoff = parseUTCDate(newDropoffDate);
        if (isNaN(newDropoff.getTime()) || newDropoff <= parseUTCDate(reservation.dropoffDate)) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: "La nouvelle date de restitution doit être postérieure à la date actuelle" });
        }
        effectiveDropoffDate = newDropoff;
        request.newDropoffDate = newDropoff;
      }

      const additionalDays = Math.ceil(
        (effectiveDropoffDate.getTime() - parseUTCDate(reservation.dropoffDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      let additionalCost = additionalDays * request.reservation.car.pricePerDay;
      let discountPercent = 0;
      if (additionalDays >= 4 && additionalDays <= 10) {
        discountPercent = 5;
        additionalCost *= 0.95;
      } else if (additionalDays >= 11 && additionalDays <= 20) {
        discountPercent = 10;
        additionalCost *= 0.90;
      } else if (additionalDays > 20) {
        discountPercent = 15;
        additionalCost *= 0.85;
      }
      additionalCost = Math.round(additionalCost * 100) / 100;

      if (status === "rejected") {
        request.status = "rejected";
        request.paymentStatus = "unpaid";

        await sendProlongationRejectionEmail({
          email: request.reservation.user.email,
        });

        await request.save({ session });
        await session.commitTransaction();
        session.endSession();
        await request.populate({
          path: "reservation",
          populate: [
            { path: "user", select: "fullName email licenseIDNumber" },
            { path: "car", select: "brand model pricePerDay" },
          ],
        });
        return res.json({
          success: true,
          data: {
            prolongation: request,
            reservation: null,
          },
        });
      }

      if (status === "accepted") {
        if (!["confirmed", "paid"].includes(reservation.status)) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: "La réservation doit être confirmée ou payée pour être prolongée" });
        }

        if (!paymentMethod || !["en_agence", "par_carte"].includes(paymentMethod)) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: "Méthode de paiement invalide. Doit être 'en_agence' ou 'par_carte'" });
        }

        if (paymentMethod === "en_agence") {
          // Validate car and matriculation
          const car = await Car.findById(reservation.car).session(session);
          if (!car) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: "Véhicule non trouvé" });
          }

          const matriculationDoc = car.matriculations.find(m => m.plateNumber === reservation.matriculation);
          if (!matriculationDoc) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: "Immatriculation non trouvée" });
          }
          if (matriculationDoc.status === 'maintenance') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: "L'immatriculation sélectionnée est en maintenance" });
          }

          // Initialize unavailablePeriods if undefined
          if (!Array.isArray(matriculationDoc.unavailablePeriods)) {
            await Car.updateOne(
              { _id: reservation.car, 'matriculations.plateNumber': reservation.matriculation },
              { $set: { 'matriculations.$.unavailablePeriods': [] } },
              { session }
            );
            matriculationDoc.unavailablePeriods = [];
          }

          // Check for overlaps in the extended period
          const pickup = parseUTCDate(reservation.pickupDate);
          const hasOverlap = matriculationDoc.unavailablePeriods.some(period => {
            if (period.reservationId && period.reservationId.toString() === reservation._id.toString()) return false;
            const periodStart = parseUTCDate(period.startDate);
            const periodEnd = parseUTCDate(period.endDate);
            return isValid(periodStart) && isValid(periodEnd) && pickup <= periodEnd && effectiveDropoffDate >= periodStart;
          });
          if (hasOverlap) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: "L'immatriculation sélectionnée n'est pas disponible pour la période de prolongation" });
          }

          // Update unavailablePeriods: Remove existing period and add new extended period
          await Car.updateOne(
            { _id: reservation.car, 'matriculations.plateNumber': reservation.matriculation },
            { $pull: { 'matriculations.$.unavailablePeriods': { reservationId: reservation._id } } },
            { session }
          );

          await Car.updateOne(
            { _id: reservation.car, 'matriculations.plateNumber': reservation.matriculation },
            {
              $push: {
                'matriculations.$.unavailablePeriods': {
                  startDate: pickup,
                  endDate: effectiveDropoffDate,
                  reservationId: reservation._id,
                }
              }
            },
            { session }
          );

          request.status = "accepted";
          request.paymentStatus = "paid";
          reservation.dropoffDate = effectiveDropoffDate;
          reservation.totalPrice += additionalCost;
          if (reservation.paymentPercentage) {
            reservation.amountPaid = (reservation.totalPrice * reservation.paymentPercentage) / 100;
          }
          const updatedReservation = await reservation.save({ session });
          await request.save({ session });
          await session.commitTransaction();
          session.endSession();

          await request.populate({
            path: "reservation",
            populate: [
              { path: "user", select: "fullName email licenseIDNumber" },
              { path: "car", select: "brand model pricePerDay" },
            ],
          });

          return res.json({
            success: true,
            data: {
              prolongation: request,
              reservation: updatedReservation,
            },
          });
        } else if (paymentMethod === "par_carte") {
          const user = request.reservation.user;
          if (!user.fullName || !user.email) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: "Données utilisateur incomplètes (fullName ou email manquant)" });
          }

          const nameParts = user.fullName.trim().split(' ');
          const firstName = nameParts[0] || 'N/A';
          const lastName = nameParts.slice(1).join(' ') || 'N/A';
          const phoneNumber = user.phone && /^[0-9+]+$/.test(user.phone) ? user.phone : '000000000';
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(user.email)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: "Adresse email invalide" });
          }

          const orderId = new mongoose.Types.ObjectId().toString();
          request.orderId = orderId;
          request.status = "waiting_for_payment";
          request.paymentStatus = "unpaid";

          const paymentAmountTND = additionalCost;
          const paymentAmountSmallestUnit = Math.round(paymentAmountTND * 1000);

          const paymentPayload = {
            receiverWalletId: KONNECT_WALLET_ID,
            token: 'TND',
            amount: paymentAmountSmallestUnit,
            type: 'immediate',
            description: `Prolongation payment for ${request.reservation.car.brand} ${request.reservation.car.model}, ${additionalDays} days`,
            acceptedPaymentMethods: ['wallet', 'bank_card', 'e-DINAR'],
            lifespan: 60,
            checkoutForm: true,
            addPaymentFeesToAmount: true,
            firstName,
            lastName,
            phoneNumber,
            email: user.email,
            orderId,
            successUrl: `${SUCCESS_URL}?orderId=${orderId}&prolongation_id=${id}`,
            errorUrl: ERROR_URL,
            theme: 'dark',
            silentWebhook: false,
          };

          let konnectResponse;
          try {
            konnectResponse = await axios.post(`${KONNECT_API_URL}/payments/init-payment`, paymentPayload, {
              headers: {
                'x-api-key': KONNECT_API_KEY,
                'Content-Type': 'application/json',
              },
            });
            ('Konnect API response:', JSON.stringify(konnectResponse.data, null, 2));
          } catch (error) {
            console.error('Konnect API error:', {
              message: error.message,
              status: error.response?.status,
              data: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
              headers: error.response?.headers ? JSON.stringify(error.response.headers, null, 2) : undefined,
              code: error.code,
              paymentPayload: JSON.stringify(paymentPayload, null, 2),
            });
            await session.abortTransaction();
            session.endSession();
            if (error.response?.status === 422) {
              return res.status(422).json({
                success: false,
                message: "Erreur de validation du paiement Konnect",
                errors: error.response?.data?.errors || 'Détails non fournis par l\'API Konnect',
              });
            }
            return res.status(500).json({ success: false, message: "Erreur lors de la génération du lien de paiement", error: error.message });
          }

          request.paymentRef = konnectResponse.data.paymentRef;
          await request.save({ session });

          await session.commitTransaction();
          session.endSession();

          try {
            await sendPaymentLinkEmail({
              email: user.email,
              paymentLink: konnectResponse.data.payUrl,
              carBrand: request.reservation.car.brand,
              carModel: request.reservation.car.model,
              newDropoffDate: effectiveDropoffDate,
              additionalCost: paymentAmountTND.toFixed(3),
              additionalDays,
            });
          } catch (emailError) {
            console.error('Failed to send payment link email:', emailError);
          }

          await request.populate({
            path: "reservation",
            populate: [
              { path: "user", select: "fullName email licenseIDNumber" },
              { path: "car", select: "brand model pricePerDay" },
            ],
          });

          return res.json({
            success: true,
            data: {
              prolongation: request,
              reservation: null,
              payUrl: konnectResponse.data.payUrl,
            },
          });
        }
      }

      request.status = status;
      await request.save({ session });
      await session.commitTransaction();
      session.endSession();

      await request.populate({
        path: "reservation",
        populate: [
          { path: "user", select: "fullName email licenseIDNumber" },
          { path: "car", select: "brand model pricePerDay" },
        ],
      });

      res.json({
        success: true,
        data: {
          prolongation: request,
          reservation: null,
        },
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("updateProlongationStatus error:", err);
      res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
    }
  });
};

// Delete a prolongation request
export const deleteProlongationRequest = async (req, res) => {
  verifyAdmin(req, res, async () => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: "ID de demande de prolongation invalide" });
      }

      const deleted = await ProlongationRequest.findByIdAndDelete(id, { session });
      if (!deleted) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: "Demande de prolongation non trouvée" });
      }

      await session.commitTransaction();
      session.endSession();

      res.json({ success: true, message: "Demande de prolongation supprimée avec succès" });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("deleteProlongationRequest error:", err);
      res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
    }
  });
};

// Confirm prolongation payment
export const confirmProlongation = async (req, res) => {
  const { orderId, prolongation_id, payment_ref } = req.query;

  try {
    if (!payment_ref || typeof payment_ref !== 'string' || payment_ref === '${paymentRef}') {
      throw new Error('Invalid payment reference');
    }
    if (!orderId || typeof orderId !== 'string') {
      throw new Error('Invalid order ID');
    }
    if (!prolongation_id || typeof prolongation_id !== 'string') {
      throw new Error('Invalid prolongation ID');
    }
    if (!mongoose.Types.ObjectId.isValid(prolongation_id)) {
      throw new Error('Invalid prolongation ID format');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const prolongation = await ProlongationRequest.findOne({
        _id: prolongation_id,
        orderId,
        paymentRef: payment_ref,
      }).populate({
        path: "reservation",
        populate: [
          { path: "user", select: "fullName email phone" },
          { path: "car", select: "brand model pricePerDay matriculations" },
        ],
      }).session(session);

      if (!prolongation) {
        throw new Error('Prolongation not found or does not match orderId and paymentRef');
      }

      if (prolongation.status === 'accepted' && prolongation.paymentStatus === 'paid') {
        await session.abortTransaction();
        session.endSession();
        return res.status(200).json({ message: 'Prolongation already confirmed', prolongationId: prolongation._id });
      }

      let konnectResponse;
      try {
        konnectResponse = await axios.get(`${KONNECT_API_URL}/payments/${payment_ref}`, {
          headers: {
            'x-api-key': KONNECT_API_KEY,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Konnect payment details API error:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
          headers: error.response?.headers ? JSON.stringify(error.response.headers, null, 2) : undefined,
          code: error.code,
          payment_ref,
        });
        if (error.response?.status === 404) {
          throw new Error('Invalid ID: Payment not found');
        } else if (error.response?.status === 401) {
          throw new Error('Invalid authentication: Check API key');
        } else if (error.response?.status === 410) {
          throw new Error('Payment expired');
        }
        throw new Error(`Failed to fetch payment details: ${error.message}`);
      }

      const payment = konnectResponse.data.payment;
      if (payment.status !== 'completed') {
        throw new Error('Payment not completed, prolongation remains pending');
      }

      if (payment.orderId !== orderId) {
        console.error('Order ID mismatch:', { paymentOrderId: payment.orderId, requestOrderId: orderId });
        throw new Error('Order ID mismatch');
      }

      const reservation = await Reservation.findById(prolongation.reservation).session(session);
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      if (!["confirmed", "paid"].includes(reservation.status)) {
        throw new Error('Reservation must be confirmed or paid to be prolonged');
      }

      // Validate car and matriculation
      const car = await Car.findById(reservation.car).session(session);
      if (!car) {
        throw new Error('Véhicule non trouvé');
      }

      const matriculationDoc = car.matriculations.find(m => m.plateNumber === reservation.matriculation);
      if (!matriculationDoc) {
        throw new Error('Immatriculation non trouvée');
      }
      if (matriculationDoc.status === 'maintenance') {
        throw new Error("L'immatriculation sélectionnée est en maintenance");
      }

      // Convert dates to Date objects, handling string or Date inputs
      const newDropoff = prolongation.newDropoffDate instanceof Date
        ? prolongation.newDropoffDate
        : parseISO(String(prolongation.newDropoffDate));
      const originalDropoff = reservation.dropoffDate instanceof Date
        ? reservation.dropoffDate
        : parseISO(String(reservation.dropoffDate));

      // Validate dates
      if (!isValid(newDropoff) || !isValid(originalDropoff)) {
        throw new Error('La nouvelle date de restitution ou la date actuelle n\'est pas valide');
      }
      if (newDropoff <= originalDropoff) {
        throw new Error('La nouvelle date de restitution doit être postérieure à la date de restitution actuelle');
      }


      // Check for overlaps in the extended period
      const hasOverlap = matriculationDoc.unavailablePeriods.some(period => {
        if (period.reservationId && period.reservationId.toString() === reservation._id.toString()) return false;
        const periodStart = period.startDate instanceof Date ? period.startDate : parseISO(String(period.startDate));
        const periodEnd = period.endDate instanceof Date ? period.endDate : parseISO(String(period.endDate));
        return isValid(periodStart) && isValid(periodEnd) && originalDropoff < periodEnd && newDropoff > periodStart;
      });
      if (hasOverlap) {
        throw new Error("L'immatriculation sélectionnée n'est pas disponible pour la période de prolongation");
      }


      // Update prolongation and reservation
      const additionalDays = Math.ceil(
        (newDropoff.getTime() - originalDropoff.getTime()) / (1000 * 60 * 60 * 24)
      );
      const additionalCost = prolongation.reservation.car.pricePerDay * additionalDays;
      const expectedAmountTND = additionalCost;
      const expectedAmountSmallestUnit = Math.round(expectedAmountTND * 1000);

      if (payment.amount !== expectedAmountSmallestUnit) {
        console.error('Payment amount mismatch:', {
          paymentAmount: payment.amount,
          expectedAmountSmallestUnit,
        });
        throw new Error('Payment amount mismatch');
      }

      prolongation.status = 'accepted';
      prolongation.paymentStatus = 'paid';
      reservation.dropoffDate = newDropoff;
      reservation.totalPrice += additionalCost;
      if (reservation.paymentPercentage) {
        reservation.amountPaid = (reservation.totalPrice * reservation.paymentPercentage) / 100;
      }

      await prolongation.save({ session });
      await reservation.save({ session });

      await session.commitTransaction();
      session.endSession();

      await prolongation.populate({
        path: "reservation",
        populate: [
          { path: "user", select: "fullName email licenseIDNumber" },
          { path: "car", select: "brand model pricePerDay" },
        ],
      });

      return res.status(200).json({ 
        message: 'Prolongation confirmed successfully', 
        prolongationId: prolongation._id,
        reservationId: reservation._id
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Confirm prolongation error:', {
      message: error.message,
      stack: error.stack,
      query: req.query,
    });
    return res.status(
      error.message === 'Invalid payment reference' ||
      error.message === 'Invalid order ID' ||
      error.message === 'Invalid prolongation ID' ||
      error.message === 'Invalid prolongation ID format' ||
      error.message === 'Prolongation not found or does not match orderId and paymentRef' ||
      error.message === 'Payment not completed, prolongation remains pending' ||
      error.message === 'Order ID mismatch' ||
      error.message === 'Payment expired' ||
      error.message === 'Reservation must be confirmed or paid to be prolonged' ||
      error.message === 'Véhicule non trouvé' ||
      error.message === 'Immatriculation non trouvée' ||
      error.message === 'L\'immatriculation sélectionnée est en maintenance' ||
      error.message === 'La nouvelle date de restitution ou la date actuelle n\'est pas valide' ||
      error.message === 'La nouvelle date de restitution doit être postérieure à la date de restitution actuelle' ||
      error.message === 'L\'immatriculation sélectionnée n\'est pas disponible pour la période de prolongation' ||
      error.message === 'Payment amount mismatch'
        ? 400
        : error.message === 'Reservation not found'
        ? 404
        : error.message === 'Invalid authentication: Check API key'
        ? 401
        : 500
    ).json({ 
      message: error.message,
      supportEmail: 'support@challengerentacar.tn',
      supportPhone: '+216 29 301 310'
    });
  }
};