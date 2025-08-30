import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import initAdmin from "./config/initAdmin.js";
import cron from "node-cron";

// Routes

import authRoutes from "./routes/auth/auth-route.js";
import verifyAdminRoute from "./routes/verifyAdmin/verifyAdmin-route.js";
import userRoutes from "./routes/user/user-route.js";
import reservationRoutes from "./routes/reservation/reservation-route.js";
import clientReservationRoutes from "./routes/clientReservation/clientReservation-route.js";
import prolongationRoutes from "./routes/prolongation/prolongation-route.js";
import carRoutes from "./routes/car/car-route.js";
import agencyRoutes from "./routes/agency/agency-route.js";
import dashboardRoutes from "./routes/dashboard/dashboard-route.js";

import secureDocsRoutes from "./routes/secure-docs/secureDocs-route.js"; 

import contactRoutes from "./routes/contact/contact-route.js";



import cronRoutes from "./routes/cron/cron-route.js";
import axios from "axios";
import multer from "multer";



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.DOMAIN || `http://localhost:${PORT}`;


const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, 
    files: 2, 
  },
});



// CORS configuration
const corsOptions = {
  origin: [
    process.env.DOMAIN
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Static files
app.use("/public", express.static("public"));


// API routes
app.get("/api", (req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/verifyAdmin", verifyAdminRoute);
app.use("/api/user", userRoutes);
app.use("/api/reservation", reservationRoutes);


app.use("/api/clientReservation", clientReservationRoutes);


app.use("/api/prolongation", prolongationRoutes);
app.use("/api/car", carRoutes);
app.use("/api/agency", agencyRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use("/api/secure-docs", secureDocsRoutes);

app.use("/api/contact", contactRoutes);

app.use("/api/cron", cronRoutes); 


// Start Server with DB
connectDB().then(() => {
  initAdmin();

  const server = app.listen(PORT, () => {
    console.log(`Server running`);
  });
  
  server.timeout = 300000;        // 5 minutes (uploads)
  server.keepAliveTimeout = 120000; // 2 minutes
  server.headersTimeout = 121000;  // slightly more than keepAlive

  // Run job every day at 08:00 / 14:00 / 20:00 server time
  cron.schedule("0 8,14,20 * * *", async () => {
    const now = new Date().toLocaleString();

    try {
      await axios.get(`${BASE_URL}/api/api/cron/run-daily-job`);

    } catch (error) {
      console.error("Error in daily reservation update:", error);
    }
  });
});
