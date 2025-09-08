import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import initAdmin from "./config/initAdmin.js";
import cron from "node-cron";
import bodyParser from 'body-parser';

// Routes
import authRoutes from "./routes/auth/auth-route.js";
import verifyAdminRoute from "./routes/verifyAdmin/verifyAdmin-route.js";
import excursionRoutes from "./routes/excursion/excursion-route.js";
import excursionRequestRoutes from "./routes/excursionRequest/excursionRequest-route.js";
import transferRoutes from "./routes/transfer/transfer-route.js";
import vehicleRoutes from "./routes/vehicle/vehicle-route.js";
import dashboardRoutes from "./routes/dashboard/dashboard-route.js";
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

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

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
app.use("/api/excursions", excursionRoutes);
app.use("/api/excursion-requests", excursionRequestRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/dashboard", dashboardRoutes);
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
      await axios.get(`${BASE_URL}/api/cron/run-daily-job`);

    } catch (error) {
      console.error("Error in daily reservation update:", error);
    }
  });
});
