import mongoose from 'mongoose';
import { verifyAdmin } from '../../utils/verifyAdmin.js';
import { Vehicle } from '../../models/models.js';
import { createMulter } from '../../utils/multer/multerConfigCar.js';
import path, { dirname, join } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from 'multer';

// Create a new vehicle
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createVehicle = async (req, res) => {
  verifyAdmin(req, res, async () => {
    const vehicleId = new mongoose.Types.ObjectId().toString();
    const uploadPath = join(__dirname, "../../public/vehicles", vehicleId);
    const upload = createMulter(vehicleId); // Pass vehicleId to Multer

    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.error("createVehicle: Multer error:", err.message, err.code);
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ success: false, message: "File too large. Maximum size is 2MB" });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({ success: false, message: "Too many files. Only one file allowed" });
        }
        return res.status(400).json({ success: false, message: `Multer error: ${err.message}` });
      } else if (err) {
        console.error("createVehicle: File filter error:", err.message);
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
        const { name, numberOfSeats, numberOfSuitcases, pricePerKm, isAvailable } = req.body;

        // Validate required fields
        const requiredFields = { name, numberOfSeats, pricePerKm };
        const missingFields = Object.keys(requiredFields).filter((key) => !requiredFields[key]);
        if (missingFields.length > 0 || !req.file) {
          // Clean up uploaded file if validation fails
          if (req.file) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (fileErr) {
              console.error(`createVehicle: Failed to clean up file ${req.file.path}:`, fileErr);
            }
          }
          return res.status(400).json({
            success: false,
            message: `Missing required fields: ${missingFields.concat(!req.file ? ["image"] : []).join(", ")}`,
          });
        }

        if (isNaN(Number(pricePerKm)) || Number(pricePerKm) < 1) {
          if (req.file) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (fileErr) {
              console.error(`createVehicle: Failed to clean up file ${req.file.path}:`, fileErr);
            }
          }
          return res.status(400).json({ success: false, message: "Le prix par kilomètre doit être supérieur à 0" });
        }

        const imgUrl = `/vehicles/${vehicleId}/img.png`;

        const vehicle = new Vehicle({
          _id: vehicleId,
          name,
          numberOfSeats: Number(numberOfSeats),
          numberOfSuitcases: Number(numberOfSuitcases) || 0,
          pricePerKm: Number(pricePerKm),
          imgUrl,
          isAvailable: isAvailable !== undefined ? isAvailable === "true" || isAvailable === true : true,
        });

        await vehicle.save();
        res.status(201).json({ success: true, data: vehicle, message: "Véhicule créé avec succès" });
      } catch (err) {
        console.error("createVehicle: Database error:", err);
        // Clean up uploaded file if database save fails
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (fileErr) {
            console.error(`createVehicle: Failed to clean up file ${req.file.path}:`, fileErr);
          }
        }
        res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
      }
    });
  });
};

// Get all vehicles
export const getAllVehicles = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalItems = await Vehicle.countDocuments();
      const vehicles = await Vehicle.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(totalItems / limit);

      res.json({
        success: true,
        data: vehicles,
        currentPage: page,
        totalPages,
        totalItems,
      });
    } catch (err) {
      console.error('getAllVehicles error:', err);
      res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  });
};

// Get a single vehicle by ID
export const getVehicleById = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'ID de véhicule invalide' });
      }

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Véhicule non trouvé' });
      }

      res.json({ success: true, data: vehicle });
    } catch (err) {
      console.error('getVehicleById error:', err);
      res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  });
};

// Update a vehicle
export const updateVehicle = async (req, res) => {
  verifyAdmin(req, res, async () => {
    const { id } = req.params;
    const upload = createMulter(id); // Pass vehicleId to Multer

    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.error("updateVehicle: Multer error:", err.message, err.code);
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ success: false, message: "File too large. Maximum size is 2MB" });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({ success: false, message: "Too many files. Only one file allowed" });
        }
        return res.status(400).json({ success: false, message: `Multer error: ${err.message}` });
      } else if (err) {
        console.error("updateVehicle: File filter error:", err.message);
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
        if (!mongoose.isValidObjectId(id)) {
          // Clean up uploaded file if ID is invalid
          if (req.file) {
            try {
              fs.unlinkSync(req.file.path);
              console.log(`updateVehicle: Cleaned up invalid file ${req.file.path}`);
            } catch (fileErr) {
              console.error(`updateVehicle: Failed to clean up file ${req.file.path}:`, fileErr);
            }
          }
          return res.status(400).json({ success: false, message: "ID de véhicule invalide" });
        }

        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
          // Clean up uploaded file if vehicle not found
          if (req.file) {
            try {
              fs.unlinkSync(req.file.path);
              console.log(`updateVehicle: Cleaned up file ${req.file.path} for non-existent vehicle`);
            } catch (fileErr) {
              console.error(`updateVehicle: Failed to clean up file ${req.file.path}:`, fileErr);
            }
          }
          return res.status(404).json({ success: false, message: "Véhicule non trouvé" });
        }

        // Handle image update
        if (req.file) {
          const targetImagePath = join(__dirname, "../../public/vehicles", id, "img.png");
          console.log(`updateVehicle: Uploaded file path: ${req.file.path}`);
          console.log(`updateVehicle: Target file path: ${targetImagePath}`);

          // Delete old image if it exists
          const oldImagePath = join(__dirname, "../../public", vehicle.imgUrl);
          if (fs.existsSync(oldImagePath) && oldImagePath !== targetImagePath) {
            try {
              fs.unlinkSync(oldImagePath);
              console.log(`updateVehicle: Deleted old image ${oldImagePath}`);
            } catch (fileErr) {
              console.error(`updateVehicle: Failed to delete old image ${oldImagePath}:`, fileErr);
            }
          }

          // Ensure the directory exists
          const uploadDir = join(__dirname, "../../public/vehicles", id);
          try {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log(`updateVehicle: Ensured directory exists: ${uploadDir}`);
          } catch (dirErr) {
            console.error(`updateVehicle: Failed to create directory ${uploadDir}:`, dirErr);
            if (req.file) {
              fs.unlinkSync(req.file.path);
              console.log(`updateVehicle: Cleaned up file ${req.file.path} due to directory creation failure`);
            }
            return res.status(500).json({ success: false, message: "Erreur lors de la création du répertoire" });
          }

          // Verify if the uploaded file exists
          if (!fs.existsSync(req.file.path)) {
            console.error(`updateVehicle: Uploaded file not found at ${req.file.path}`);
            return res.status(500).json({ success: false, message: "Fichier téléchargé introuvable" });
          }

          // Move the uploaded file to the target location if necessary
          if (req.file.path !== targetImagePath) {
            try {
              fs.renameSync(req.file.path, targetImagePath);
              console.log(`updateVehicle: Moved uploaded file from ${req.file.path} to ${targetImagePath}`);
            } catch (fileErr) {
              console.error(`updateVehicle: Failed to move file to ${targetImagePath}:`, fileErr);
              if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
                console.log(`updateVehicle: Cleaned up file ${req.file.path} due to move failure`);
              }
              return res.status(500).json({ success: false, message: "Erreur lors de l'enregistrement de l'image" });
            }
          } else {
            console.log(`updateVehicle: File already at target path`);
          }

          // Update imgUrl in the database
          vehicle.imgUrl = `/vehicles/${id}/img.png`;
        }

        // Update fields if provided
        const { name, numberOfSeats, numberOfSuitcases, pricePerKm, isAvailable } = req.body;
        if (name) vehicle.name = name;
        if (numberOfSeats) vehicle.numberOfSeats = Number(numberOfSeats);
        if (numberOfSuitcases !== undefined) vehicle.numberOfSuitcases = Number(numberOfSuitcases);
        if (pricePerKm) {
          if (isNaN(Number(pricePerKm)) || Number(pricePerKm) < 1) {
            if (req.file) {
              try {
                fs.unlinkSync(req.file.path);
              } catch (fileErr) {
                console.error(`updateVehicle: Failed to clean up file ${req.file.path}:`, fileErr);
              }
            }
            return res.status(400).json({ success: false, message: "Le prix par kilomètre doit être supérieur à 0" });
          }
          vehicle.pricePerKm = Number(pricePerKm);
        }
        if (isAvailable !== undefined) vehicle.isAvailable = isAvailable === "true" || isAvailable === true;

        await vehicle.save();
        console.log(`updateVehicle: Successfully updated vehicle ${id}`);
        res.json({ success: true, data: vehicle, message: "Véhicule mis à jour avec succès" });
      } catch (err) {
        console.error("updateVehicle: Database error:", err);
        // Clean up uploaded file if database save fails
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
            console.log(`updateVehicle: Cleaned up file ${req.file.path} on database error`);
          } catch (fileErr) {
            console.error(`updateVehicle: Failed to clean up file ${req.file.path}:`, fileErr);
          }
        }
        res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
      }
    });
  });
};

// Delete a vehicle
export const deleteVehicle = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: "ID de véhicule invalide" });
      }

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: "Véhicule non trouvé" });
      }

      // Delete the vehicle's image folder
      const imageDir = join(__dirname, "../../public/vehicles", id);
      if (fs.existsSync(imageDir)) {
        try {
          fs.rmSync(imageDir, { recursive: true, force: true });
        } catch (fileErr) {
          console.error(`deleteVehicle: Failed to delete directory ${imageDir}:`, fileErr);
        }
      }

      await Vehicle.findByIdAndDelete(id);
      res.json({ success: true, message: "Véhicule supprimé avec succès" });
    } catch (err) {
      console.error("deleteVehicle: Database error:", err);
      res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
    }
  });
};