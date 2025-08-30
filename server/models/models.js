import mongoose from 'mongoose';

/* ====== USER ====== */
const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  identityDocUrl: { type: String },
  licenseUrl: { type: String },
  licenseIDNumber: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});
export const User = mongoose.model("User", UserSchema);

/* ====== ADMIN ====== */
const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});
export const Admin = mongoose.model("Admin", AdminSchema);

/* ====== CAR ====== */
const CarSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  type: {
    type: String,
    enum: ["economique", "SUV", "luxe"],
    required: true
  },
  pricePerDay: { type: Number, required: true },
  imageUrls: {
    type: [String],
    default: [],
    validate: {
      validator: (v) => v.length <= 5,
      message: "Maximum 5 images allowed"
    }
  },
  fuel: {
    type: String,
    enum: ["essence", "diesel", "électrique", "hybride"],
    required: true
  },
  seats: { type: Number, required: true },
  transmission: {
    type: String,
    enum: ["auto", "manuelle"],
    required: true
  },
  year: { type: Number, required: true },
  matriculations: [
    {
      plateNumber: { type: String, required: true },
      status: {
        type: String,
        enum: ["available", "rented", "maintenance"],
        default: "available"
      },
      // Track unavailable periods for this matriculation
      unavailablePeriods: [
        {
          startDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
          endDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
          reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation" },
        }
      ]
    }
  ],
  createdAt: { type: Date, default: Date.now }
});
export const Car = mongoose.model("Car", CarSchema);

/* ====== RESERVATION ====== */
const ReservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  car: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
  matriculation: { type: String }, 

  pickupLocation: { type: String, required: true },
  dropoffLocation: { type: String, required: true },
  pickupDate: { type: Date, required: true },
  dropoffDate: { type: Date, required: true },
  pickupTime: { type: String, required: true },
  dropoffTime: { type: String, required: true },
  flightNumber: { type: String, default: null },
  status: {
    type: String,
    enum: ["pending", "confirmed", "rejected", "cancelled", "paid", "completed"],
    default: "pending"
  },
  orderId: { type: String },
  paymentRef: { type: String }, 
  totalPrice: { type: Number, required: true }, // Total in TND
  paymentPercentage: { type: Number, enum: [0, 30, 100], required: true, default: 0 }, // 30% or 100% payment
  amountPaid: { type: Number, default: 0 }, // Amount paid in TND
  createdAt: { type: Date, default: Date.now }
});
export const Reservation = mongoose.model("Reservation", ReservationSchema);

/* ====== PROLONGATION REQUEST ====== */
const ProlongationRequestSchema = new mongoose.Schema({
  reservation: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation", required: true },
  newDropoffDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["pending", "waiting_for_payment", "accepted", "rejected"],
    default: "pending"
  },
  additionalDays: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid"],
    default: "unpaid"
  },
  orderId: { type: String },
  paymentRef: { type: String },
  createdAt: { type: Date, default: Date.now }
});
export const ProlongationRequest = mongoose.model("ProlongationRequest", ProlongationRequestSchema);

/* ====== AGENCY ====== */
const AgencySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  isAirport: { type: Boolean, default: false }
});
export const Agency = mongoose.model("Agency", AgencySchema);