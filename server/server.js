import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import initAdmin from "./config/initAdmin.js";
import cron from "node-cron";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import multer from "multer";
import { ssrHandler } from "./ssr/ssrHandler.js";

// Routes
import authRoutes from "./routes/auth/auth-route.js";
import verifyAdminRoute from "./routes/verifyAdmin/verifyAdmin-route.js";
import excursionRoutes from "./routes/excursion/excursion-route.js";
import excursionRequestRoutes from "./routes/excursionRequest/excursionRequest-route.js";
import transferRoutes from "./routes/transfer/transfer-route.js";
import vehicleRoutes from "./routes/vehicle/vehicle-route.js";
import dashboardRoutes from "./routes/dashboard/dashboard-route.js";
import contactRoutes from "./routes/contact/contact-route.js";
import blogRoutes from "./routes/blog/blog-route.js";
import cronRoutes from "./routes/cron/cron-route.js";

dotenv.config({ debug: false, quiet: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// CORS configuration
const corsOptions = {
  origin: [
    process.env.DOMAIN || `http://localhost:${PORT}`,
    `http://localhost:${PORT}`,
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Serve static files
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "../client/dist"), {
  index: false
}));

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
app.use("/api/blogs", blogRoutes);
app.use("/api/cron", cronRoutes);

// Use SSR handler for all other routes
app.use(ssrHandler);

// Start Server with DB
connectDB().then(() => {
  initAdmin();

  const server = app.listen(PORT, () => {
    console.log(`Server running on ${BASE_URL}`);
  });

  server.timeout = 300000;
  server.keepAliveTimeout = 120000;
  server.headersTimeout = 121000;

  cron.schedule("0 8,14,20 * * *", async () => {
    try {
      await axios.get(`${BASE_URL}/api/cron/run-daily-job`);
    } catch (error) {
      console.error("Error in daily reservation update:", error);
    }
  });
});