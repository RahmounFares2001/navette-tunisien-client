import mongoose from 'mongoose';

// ADMIN Schema
const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

// Excursion Request Schema
const excursionRequestSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
    trim: true,
  },
  clientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  clientPhone: {
    type: String,
    required: true,
    trim: true,
  },
  excursionDate: {
    type: Date,
    required: true,
  },
  excursionTime: {
    type: String,
    required: true,
  },
  numberOfAdults: {
    type: Number,
    required: true,
    min: 0,
    max: 8,
  },
  numberOfChildren: {
    type: Number,
    required: true,
    min: 0,
    max: 8,
  },
  numberOfBabies: {
    type: Number,
    required: true,
    min: 0,
    max: 8,
  },
  message: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  withGuide: {  // add 200 TND
    type: Boolean, 
    default: false 
  },
  driverLanguages: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'rejected'],
    default: 'pending',
  },
  paymentPercentage: {
    type: Number,
    enum: [0, 100],
    default: 0,
  },
  excursionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Excursion',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Excursion Schema
const excursionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2500,
  },
  includedItems: {
    type: [String],
    required: true,
  },
  dailyProgram: {
    type: [String],
    required: true,
  },
  prices: {
    oneToFour: { type: Number, min: 0, required: true },   // 1–4 persons
    fiveToSix: { type: Number, min: 0, required: true },   // 5–6 persons
    sevenToEight: { type: Number, min: 0, required: true } // 7–8 persons
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  duration: {
    type: Number,
    min: 0,
    required: true,
  },
  imageUrls: {
    type: [String],
    default: [],
    validate: {
      validator: (v) => v.length <= 5,
      message: 'Maximum 5 images allowed',
    },
  },
});

// Transfer Schema
const transferSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
    trim: true,
  },
  clientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  clientPhone: {
    type: String,
    required: true,
    trim: true,
  },
  tripType: {
    type: String,
    required: true,
    enum: ['aller simple', 'aller retour'],
  },  
  departureLocation: {
    type: String,
    required: true,
  },
  departureAddress: {
    type: String,
  },
  destination: {
    type: String,
    required: true,
  },
  destinationAddress: {
    type: String,
  },
  travelDate: {
    type: Date,
    required: true,
  },
  departureTime: {
    type: String,
    required: true,
  },
  returnDate: {
    type: Date,
    required: function() { return this.tripType === 'aller retour'; },
  },
  returnTime: {
    type: String,
    required: function() { return this.tripType === 'aller retour'; },
  },
  flightNumber: {
    type: String,
    trim: true,
  },
  numberOfAdults: {
    type: Number,
    min: 1,
    required: true,
  },
  numberOfChildren: {
    type: Number,
    min: 0,
    default: 0,
  },
  driverLanguage: {
    type: [String],
    required: true,
  },
  price: {
    type: Number,
    require: true
  },
  comment: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'rejected'],
    default: 'pending',
  },
  paymentPercentage: {
    type: Number,
    enum: [0, 100],
    default: 0,
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Vehicle Schema
const vehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  numberOfSeats: {
    type: Number,
    min: 1,
    required: true,
  },
  numberOfSuitcases: {
    type: Number,
    default: 0,
  },
  pricePerKm: {
    type: Number,
    min: 1,
    required: true,
  },
  imgUrl: {
    type: String,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Blog Schema
const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  imgUrl: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


export const Admin = mongoose.model("Admin", AdminSchema);
export const ExcursionRequest = mongoose.model('ExcursionRequest', excursionRequestSchema);
export const Excursion = mongoose.model('Excursion', excursionSchema);
export const Transfer = mongoose.model('Transfer', transferSchema);
export const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export const Blog = mongoose.model('Blog', blogSchema);