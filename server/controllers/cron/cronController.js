import { Car, ProlongationRequest, Reservation } from "../../models/models.js";
import { sendProlongationRejectionEmail } from "../../utils/mailer/sendRejectionNotification.js";

export const checkAndUpdateReservations = async (req, res) => {
  try {
    const now = new Date();

    /** Handle expired pending reservations: cancel them and remove unavailablePeriods */
    const expiredPending = await Reservation.find({
      status: "pending",
      dropoffDate: { $lt: now }
    });

    for (const reservation of expiredPending) {
      reservation.status = "cancelled";
      await reservation.save();

      // Remove unavailablePeriods for cancelled reservations
      await Car.updateOne(
        { _id: reservation.car, "matriculations.plateNumber": reservation.matriculation },
        {
          $pull: {
            "matriculations.$.unavailablePeriods": { reservationId: reservation._id }
          }
        }
      );
    }

    /** Handle active confirmed/paid reservations: set matriculation to rented */
    const activeReservations = await Reservation.find({
      status: { $in: ["confirmed", "paid"] },
      pickupDate: { $lte: now },
      dropoffDate: { $gte: now }
    }).populate("car");

    for (const reservation of activeReservations) {
      await Car.updateOne(
        { _id: reservation.car._id, "matriculations.plateNumber": reservation.matriculation },
        {
          $set: { "matriculations.$.status": "rented" }
        }
      );
    }

    /** Handle expired confirmed/paid reservations: complete + free matriculation + remove unavailablePeriods */
    const expiredConfirmedPaid = await Reservation.find({
      status: { $in: ["confirmed", "paid"] },
      dropoffDate: { $lt: now }
    }).populate("car");

    for (const reservation of expiredConfirmedPaid) {
      reservation.status = "completed";
      await reservation.save();

      // Update matriculation status to available and remove unavailablePeriods
      await Car.updateOne(
        { _id: reservation.car._id, "matriculations.plateNumber": reservation.matriculation },
        {
          $set: { "matriculations.$.status": "available" },
          $pull: {
            "matriculations.$.unavailablePeriods": { reservationId: reservation._id }
          }
        }
      );
    }

    /** Handle expired prolongations: reject them */
    const expiredProlongations = await ProlongationRequest.find({
      status: { $in: ["pending", "waiting_for_payment"] },
      newDropoffDate: { $lt: now }
    });

    for (const prolongation of expiredProlongations) {
      prolongation.status = "rejected";
      const { user } = await Reservation.findOne(
        { orderId: prolongation.orderId },
        { user: 1 } 
      ).populate("user");

      await sendProlongationRejectionEmail({
        email: user.email,
      });
      
      await prolongation.save();
    }


    res.status(200).json({
      message: "Daily job executed successfully",
      currentPage: 1,
      totalPages: 1
    });

  } catch (error) {
    console.error("Error in daily job:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};