import { config } from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';
import { Reservation, Car, User } from '../../models/models.js';
import { sendConfirmationEmail } from '../../utils/mailer/sendConfirmationConfig.js';
import { createUser } from '../../utils/user/createUser.js';
import { createMulter } from '../../utils/multerConfigUser.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { parseISO, isValid, startOfDay } from 'date-fns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();


const KONNECT_API_URL = process.env.KONNECT_API_URL;
const KONNECT_WALLET_ID = process.env.KONNECT_WALLET_ID;
const KONNECT_API_KEY = process.env.KONNECT_API_KEY;
const SUCCESS_URL = process.env.SUCCESS_URL;
const ERROR_URL = process.env.ERROR_URL;
const MAILER_USER = process.env.MAILER_USER;
const MAILER_PASSWORD = process.env.MAILER_PASSWORD;


const calculateTotalPrice = (days, pricePerDay) => {
  const basePrice = days * pricePerDay;
  if (days >= 4 && days <= 10) {
    return basePrice * 0.95;
  } else if (days >= 11 && days <= 20) {
    return basePrice * 0.90;
  } else if (days > 20) {
    return basePrice * 0.85;
  }
  return basePrice;
};

export const clientCreateReservation = async (req, res) => {

  const uploadPath = join(__dirname, '../../var/secure_docs/users');
  const upload = createMulter(uploadPath, 5 * 1024 * 1024);

  try {
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          console.error('Multer error in clientCreateReservation:', err.message);
          return reject(new Error(`Multer error: ${err.message}`));
        }
        resolve();
      });
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (!req.body) {
        throw new Error('Request body is undefined. Ensure multipart/form-data is correctly parsed by multer.');
      }

      const userData = req.body.user || {};
      const user = {
        id: userData.id ? String(userData.id).trim() : '',
        fullName: userData.fullName ? String(userData.fullName).trim() : '',
        email: userData.email ? String(userData.email).trim() : '',
        phone: userData.phone ? String(userData.phone).trim() : '',
        isNewClient: userData.isNewClient === 'true' || userData.isNewClient === true,
        licenseIDNumber: userData.licenseIDNumber ? String(userData.licenseIDNumber).trim() : '',
      };

      const {
        carId,
        matriculation,
        pickupLocation,
        dropoffLocation,
        pickupDate,
        dropoffDate,
        pickupTime,
        dropoffTime,
        flightNumber,
        paymentPercentage,
        currency: requestedCurrency,
      } = req.body;

      if (
        !user.fullName ||
        !user.email ||
        !user.phone ||
        !carId ||
        !matriculation ||
        !pickupLocation ||
        !dropoffLocation ||
        !pickupDate ||
        !dropoffDate ||
        !pickupTime ||
        !dropoffTime ||
        !paymentPercentage
      ) {
        throw new Error('All required fields must be provided');
      }

      if (!mongoose.Types.ObjectId.isValid(carId)) {
        throw new Error('Invalid car ID format');
      }

      if (user.isNewClient && !user.licenseIDNumber) {
        throw new Error('License ID is required for new clients');
      }

      if (user.isNewClient && (!req.files || !req.files.identity || !req.files.license)) {
        throw new Error('Identity and license documents are required for new clients');
      }

      if (!user.isNewClient && !user.id) {
        throw new Error('User ID is required for existing clients');
      }

      const paymentPercentageNum = Number(paymentPercentage);
      if (![30, 100].includes(paymentPercentageNum)) {
        throw new Error('Payment percentage must be 30 or 100');
      }

      const currency = requestedCurrency || 'TND';

      // Parse dates to UTC manually to prevent timezone shift
      const parseUTCDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day));
      };

      const start = parseUTCDate(pickupDate);
      const end = parseUTCDate(dropoffDate);
      const today = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));

      if (!isValid(start) || !isValid(end)) {
        throw new Error('Invalid date format');
      }

      if (end <= start) {
        throw new Error('Dropoff date must be after pickup date');
      }

      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
      if (diffDays < 3) {
        throw new Error('Reservation must be at least 3 days');
      }

      let userRecord;
      if (user.isNewClient) {
        const userData = {
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          licenseIDNumber: user.licenseIDNumber,
        };
        userRecord = await createUser(userData, req.files, session);
        userRecord = userRecord.data;
      } else {
        userRecord = await User.findById(user.id).session(session);
        if (!userRecord) {
          throw new Error('User not found');
        }
      }

      const car = await Car.findById(carId).session(session);
      if (!car) {
        throw new Error('Car not found');
      }

      const selectedMatriculation = car.matriculations.find(m => m.plateNumber === matriculation);
      if (!selectedMatriculation) {
        throw new Error('Selected matriculation does not exist for this car');
      }

      const unavailablePeriods = Array.isArray(selectedMatriculation.unavailablePeriods) ? selectedMatriculation.unavailablePeriods : [];
      const hasOverlap = unavailablePeriods.some(period => {
        const periodStart = parseISO(period.startDate);
        const periodEnd = parseISO(period.endDate);
        return isValid(periodStart) && isValid(periodEnd) && start <= periodEnd && end >= periodStart;
      });
      if (hasOverlap) {
        throw new Error("L'immatriculation sélectionnée n'est pas disponible pour les dates choisies");
      }

      let totalPriceTND = diffDays * car.pricePerDay;
      let discountPercent = 0;
      if (diffDays >= 4 && diffDays <= 10) {
        discountPercent = 5;
        totalPriceTND *= 0.95;
      } else if (diffDays >= 11 && diffDays <= 20) {
        discountPercent = 10;
        totalPriceTND *= 0.90;
      } else if (diffDays > 20) {
        discountPercent = 15;
        totalPriceTND *= 0.85;
      }
      totalPriceTND = Math.round(totalPriceTND * 100) / 100;
      const paymentAmountTND = paymentPercentageNum === 30 ? totalPriceTND * 0.3 : totalPriceTND;
      const paymentAmountSmallestUnit = Math.round(paymentAmountTND * 1000);

      const orderId = new mongoose.Types.ObjectId().toString();
      const reservationId = new mongoose.Types.ObjectId().toString();

      const reservation = new Reservation({
        _id: reservationId,
        user: userRecord._id,
        car: carId,
        matriculation: selectedMatriculation.plateNumber,
        pickupLocation,
        dropoffLocation,
        pickupDate: start,
        dropoffDate: end,
        pickupTime,
        dropoffTime,
        flightNumber: flightNumber || null,
        status: 'pending',
        totalPrice: totalPriceTND,
        paymentPercentage: paymentPercentageNum,
        amountPaid: 0,
        currency,
        paymentRef: null,
        orderId,
      });

      await reservation.save({ session });

      const description = `Reservation for ${car.brand} ${car.model}, ${paymentPercentageNum}% payment, user ${userRecord._id}`;
      if (description.length > 280) {
        throw new Error('Payment description exceeds 280 characters');
      }

      const phoneNumber = user.phone && /^[0-9+]+$/.test(user.phone) ? user.phone : '000000000';
      let konnectResponse;
      try {
        const paymentPayload = {
          receiverWalletId: KONNECT_WALLET_ID,
          token: currency,
          amount: paymentAmountSmallestUnit,
          type: 'immediate',
          description,
          acceptedPaymentMethods: ['wallet', 'bank_card', 'e-DINAR'],
          lifespan: 10,
          checkoutForm: true,
          addPaymentFeesToAmount: true,
          firstName: user.fullName.split(' ')[0],
          lastName: user.fullName.split(' ').slice(1).join(' ') || 'N/A',
          phoneNumber: phoneNumber,
          email: user.email,
          orderId,
          successUrl: `${SUCCESS_URL}?orderId=${orderId}&reservation_id=${reservationId}`,
          errorUrl: ERROR_URL,
          theme: 'dark',
        };

        konnectResponse = await axios.post(`${KONNECT_API_URL}/payments/init-payment`, paymentPayload, {
          headers: {
            'x-api-key': KONNECT_API_KEY,
            'Content-Type': 'application/json',
          },
        });

        if (!konnectResponse.data || !konnectResponse.data.payUrl) {
          console.error('Konnect API response missing payUrl:', konnectResponse.data);
          throw new Error('Konnect API did not return a payment URL');
        }
      } catch (error) {
        console.error('Konnect API error:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
          headers: error.response?.headers ? JSON.stringify(error.response.headers, null, 2) : undefined,
          code: error.code,
        });
        throw new Error(`Konnect API error: ${error.response?.data?.message || error.message}`);
      }

      reservation.paymentRef = konnectResponse.data.paymentRef;
      await reservation.save({ session });

      await session.commitTransaction();

      return res.status(201).json({
        success: true,
        data: {
          user: userRecord._id,
          car: carId,
          matriculation: selectedMatriculation.plateNumber,
          pickupLocation,
          dropoffLocation,
          pickupDate: start.toISOString(),
          dropoffDate: end.toISOString(),
          pickupTime,
          dropoffTime,
          flightNumber: flightNumber || null,
          totalPrice: totalPriceTND,
          paymentPercentage: paymentPercentageNum,
          amountPaid: 0,
          currency,
          paymentRef: konnectResponse.data.paymentRef,
          orderId,
          reservationId,
        },
        payUrl: konnectResponse.data.payUrl,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error('clientCreateReservation: Error:', {
        message: error.message,
        stack: error.stack,
        response: error.response ? JSON.stringify(error.response.data, null, 2) : undefined,
      });
      const status = error.response?.status || (error.message === 'User not found' || error.message === 'Car not found' ? 404 : 400);
      const message = error.code === 'ENOTFOUND'
        ? `Failed to connect to Konnect API: ${error.message}`
        : error.response?.data?.errors
          ? `Failed to create reservation: ${error.response.data.errors.join(', ')}`
          : error.response?.data
            ? `Failed to create reservation: ${typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data, null, 2)}`
            : `Failed to create reservation: ${error.message}`;
      return res.status(status).json({
        message,
        details: error.response?.data || { error: error.message, code: error.code },
      });
    } finally {
      session.endSession();
    }
  } catch (multerError) {
    console.error('clientCreateReservation: Multer processing error:', {
      message: multerError.message,
      stack: multerError.stack,
    });
    return res.status(400).json({
      message: `Failed to process multipart/form-data: ${multerError.message}`,
      details: { error: multerError.message },
    });
  }
};

// confirm payement
export const confirmPayment = async (req, res) => {  

  ('Received confirm payment request:', {
    query: req.query,
  });

  const { payment_ref, orderId, reservation_id } = req.query;

  try {
    if (!payment_ref || typeof payment_ref !== 'string' || payment_ref === '${paymentRef}') {
      throw new Error('Invalid payment reference');
    }
    if (!orderId || typeof orderId !== 'string') {
      throw new Error('Invalid order ID');
    }
    if (!reservation_id || typeof reservation_id !== 'string') {
      throw new Error('Invalid reservation ID');
    }

    if (!mongoose.Types.ObjectId.isValid(reservation_id)) {
      throw new Error('Invalid reservation ID format');
    }

    const reservation = await Reservation.findOne({
      _id: reservation_id,
      orderId,
      paymentRef: payment_ref,
    }).exec();

    if (!reservation) {
      console.error('Reservation query failed:', { reservation_id, orderId, payment_ref });
      throw new Error('Reservation not found or does not match orderId and paymentRef');
    }

    if (reservation.status === 'paid') {
      ('Reservation already paid for payment_ref:', payment_ref);
      return res.status(200).json({ message: 'Reservation already confirmed', reservationId: reservation._id });
    }

    let konnectResponse;
    try {
      konnectResponse = await axios.get(`${KONNECT_API_URL}/payments/${payment_ref}`, {
        headers: {
          'x-api-key': KONNECT_API_KEY,
          'Content-Type': 'application/json',
        },
      });
      ('Konnect payment details response:', JSON.stringify(konnectResponse.data, null, 2));
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
      ('Payment not completed:', { payment_ref, status: payment.status });
      throw new Error('Payment not completed, reservation remains pending');
    }

    if (payment.orderId !== orderId) {
      console.error('Order ID mismatch:', { paymentOrderId: payment.orderId, requestOrderId: orderId });
      throw new Error('Order ID mismatch');
    }

    const car = await Car.findById(reservation.car);
    if (!car) {
      console.error('Car not found:', reservation.car);
      throw new Error('Car not found');
    }


    const expectedAmountTND = reservation.paymentPercentage === 30 ? reservation.totalPrice * 0.3 : reservation.totalPrice;
    const expectedAmountSmallestUnit = Math.round(expectedAmountTND * 1000);

    ('Payment validation:', {
      paymentAmount: payment.amount,
      expectedAmountSmallestUnit,
      reservationCurrency: reservation.currency,
      totalPriceTND: reservation.totalPrice,
      expectedAmountTND,
    });

    if (payment.amount !== expectedAmountSmallestUnit) {
      console.error('Payment amount mismatch:', {
        paymentAmount: payment.amount,
        expectedAmountSmallestUnit,
      });
      throw new Error('Payment amount mismatch');
    }

    reservation.status = 'paid';
    reservation.amountPaid = expectedAmountTND;

    await reservation.save();

    try {
      const user = await User.findById(reservation.user);
      if (!user) {
        console.error('User not found for email:', reservation.user);
        throw new Error('User not found for sending confirmation email');
      }

      const dateFormatter = (date) => {
        const d = new Date(date);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      };

      const emailData = {
        name: payment.paymentDetails.name || user.fullName || 'Client',
        email: user.email,
        subject: 'CONFIRMATION DE RÉSERVATION - CHALLENGE RENT A CAR',
        dateDebut: dateFormatter(reservation.pickupDate),
        dateFin: dateFormatter(reservation.dropoffDate),
        modelVoiture: `${car.brand} ${car.model}`,
        locataire: payment.paymentDetails.name || user.fullName || 'Client',
        totaliteLoyer: `${reservation.totalPrice.toFixed(3)} dinars`,
        avance: `${reservation.amountPaid.toFixed(3)} dinars`,
        resteAPayer: `${(reservation.totalPrice - reservation.amountPaid).toFixed(3)} dinars`,
        dateEmission: dateFormatter(new Date()),
      };


      await sendConfirmationEmail(emailData);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', {
        message: emailError.message,
        stack: emailError.stack,
      });
    }

    ('Payment confirmed successfully:', { reservationId: reservation._id, payment_ref });
    return res.status(200).json({ message: 'Reservation confirmed successfully', reservationId: reservation._id });
  } catch (error) {
    console.error('Confirm payment error:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(
      error.message === 'Invalid payment reference' ||
      error.message === 'Invalid order ID' ||
      error.message === 'Invalid reservation ID' ||
      error.message === 'Invalid reservation ID format' ||
      error.message === 'Reservation not found or does not match orderId and paymentRef' ||
      error.message === 'Payment not completed, reservation remains pending' ||
      error.message === 'Order ID mismatch' ||
      error.message === 'Selected matriculation is no longer available' ||
      error.message === 'Invalid ID: Payment not found' ||
      error.message === 'Payment expired'
        ? 400
        : error.message === 'Car not found'
        ? 404
        : error.message === 'Invalid authentication: Check API key'
        ? 401
        : 500
    ).json({ message: error.message });
  }
};