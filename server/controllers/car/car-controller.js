import mongoose from "mongoose";
import { Car, Reservation } from "../../models/models.js";
import { createMulter } from "../../utils/multerConfigCar.js";
import path, { dirname, join } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import { verifyAdmin } from "../../utils/verifyAdmin.js";

function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

export const getAllCars = async (req, res) => {
  try {
    const { type, search = "", status, page = 1, limit = 40 } = req.query;
    const filters = {};
    if (type) filters.type = type;
    if (search) {
      filters.$or = [
        { brand: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
      ];
    }

    let cars = await Car.find(filters).sort({ createdAt: -1 }).lean();

    let filteredCars = cars;
    if (status && status !== 'all') {
      filteredCars = cars.filter(car => {
        const hasAvailable = car.matriculations.some(m => m.status === 'available');
        const hasRented = car.matriculations.some(m => m.status === 'rented');
        const hasMaintenance = car.matriculations.some(m => m.status === 'maintenance');
        
        let computedStatus = 'unavailable';
        if (hasAvailable) {
          computedStatus = 'available';
        } else if (hasRented) {
          computedStatus = 'rented';
        } else if (hasMaintenance) {
          computedStatus = 'maintenance';
        }
        
        return computedStatus === status;
      });
    }

    const total = filteredCars.length;
    const startIndex = (page - 1) * limit;
    const paginatedCars = filteredCars.slice(startIndex, startIndex + Number(limit));

    res.status(200).json({
      success: true,
      data: paginatedCars,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('getAllCars error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllCarsClient = async (req, res) => {
  try {
    const { type, search = "", page = 1, limit = 16 } = req.query;
    const filters = {
      'matriculations.status': 'available',
    };
    if (type && type !== 'all') {
      filters.type = type;
    }
    if (search) {
      filters.$or = [
        { brand: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
      ];
    }

    const cars = await Car.find(filters)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await Car.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: cars,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error('getAllCars error:', error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).lean();
    if (!car) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    res.status(200).json({ success: true, data: car });
  } catch (error) {
    console.error("getCarById error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createCar = async (req, res) => {
  verifyAdmin(req, res, async () => {
    const carId = new mongoose.Types.ObjectId().toString();
    const uploadPath = join(__dirname, "../../public/cars", carId);
    const upload = createMulter(uploadPath, 5 * 1024 * 1024, 0);

    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.error("createCar: Multer error:", err.message, err.code);
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ success: false, message: "File too large. Maximum size is 5MB" });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({ success: false, message: "Too many files. Maximum is 5" });
        }
        return res.status(400).json({ success: false, message: `Multer error: ${err.message}` });
      } else if (err) {
        console.error("createCar: File filter error:", err.message);
        return res.status(400).json({ success: false, message: err.message });
      }


      const {
        brand,
        model,
        type,
        pricePerDay,
        fuel,
        seats,
        transmission,
        year,
        matriculations,
      } = req.body;

      const requiredFields = { brand, model, type, pricePerDay, fuel, seats, transmission, year, matriculations };
      const missingFields = Object.keys(requiredFields).filter(key => !requiredFields[key]);
      if (missingFields.length > 0) {
        if (req.files?.length > 0) {
          req.files.forEach(file => {
            try {
              fs.unlinkSync(file.path);
            } catch (fileErr) {
              console.error(`createCar: Failed to clean up file ${file.path}:`, fileErr);
            }
          });
        }
        return res.status(400).json({ success: false, message: `Missing required fields: ${missingFields.join(", ")}` });
      }

      let parsedMatriculations;
      try {
        parsedMatriculations = JSON.parse(matriculations);
        if (!Array.isArray(parsedMatriculations)) {
          return res.status(400).json({ success: false, message: "Matriculations must be an array" });
        }
        for (const mat of parsedMatriculations) {
          if (!mat.plateNumber || !mat.status) {
            return res.status(400).json({ success: false, message: "Each matriculation must have a plateNumber and status" });
          }
          if (!["available", "rented", "maintenance"].includes(mat.status)) {
            return res.status(400).json({ success: false, message: "Invalid status in matriculations" });
          }
          mat.unavailablePeriods = mat.unavailablePeriods || [];
        }
      } catch (error) {
        console.error('createCar: Matriculations parsing error:', error);
        return res.status(400).json({ success: false, message: "Invalid matriculations format" });
      }

      const imageUrls = req.files
        ? req.files.map((file) => `/cars/${carId}/${file.filename}`)
        : [];

      const carData = {
        _id: carId,
        brand,
        model,
        type,
        pricePerDay: Number(pricePerDay),
        fuel,
        seats: Number(seats),
        transmission,
        year: Number(year),
        matriculations: parsedMatriculations,
        imageUrls,
      };

      try {
        const car = new Car(carData);
        await car.save();
        res.status(201).json({ success: true, data: car });
      } catch (error) {
        console.error('createCar: Database error:', error);
        if (req.files?.length > 0) {
          req.files.forEach(file => {
            try {
              fs.unlinkSync(file.path);
            } catch (fileErr) {
              console.error(`createCar: Failed to clean up file ${file.path}:`, fileErr);
            }
          });
        }
        res.status(400).json({ success: false, message: `Failed to create car: ${error.message}` });
      }
    });
  });
};

export const updateCar = async (req, res) => {
  verifyAdmin(req, res, async () => {
    const { id } = req.params;
    const existingCar = await Car.findById(id);
    if (!existingCar) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    // Get current image count for multer setup
    const currentImageCount = existingCar.imageUrls?.length || 0;
    
    // Find the highest existing image number for proper naming
    let highestImageNumber = 0;
    if (existingCar.imageUrls) {
      existingCar.imageUrls.forEach(url => {
        const match = url.match(/img(\d+)\./);
        if (match) {
          const num = parseInt(match[1]);
          if (num > highestImageNumber) {
            highestImageNumber = num;
          }
        }
      });
    }

    const uploadPath = join(__dirname, "../../public/cars", id);
    const upload = createMulter(uploadPath, highestImageNumber);

    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.error("updateCar: Multer error:", err.message, err.code);
        return res.status(400).json({ success: false, message: `Multer error: ${err.message}` });
      } else if (err) {
        console.error("updateCar: File filter error:", err.message);
        return res.status(400).json({ success: false, message: err.message });
      }

      // NOW req.body is available after multer processing
      const {
        brand,
        model,
        type,
        pricePerDay,
        fuel,
        seats,
        transmission,
        year,
        matriculations,
        deletedImageUrls, // This will work now
      } = req.body;

      const updateData = {};

      if (brand) updateData.brand = brand;
      if (model) updateData.model = model;
      if (type) updateData.type = type;
      if (pricePerDay) updateData.pricePerDay = Number(pricePerDay);
      if (fuel) updateData.fuel = fuel;
      if (seats) updateData.seats = Number(seats);
      if (transmission) updateData.transmission = transmission;
      if (year) updateData.year = Number(year);
      
      if (matriculations) {
        try {
          const parsedMatriculations = JSON.parse(matriculations);
          if (!Array.isArray(parsedMatriculations)) {
            return res.status(400).json({ success: false, message: "Matriculations must be an array" });
          }
          for (const mat of parsedMatriculations) {
            if (!mat.plateNumber || !mat.status) {
              return res.status(400).json({ success: false, message: "Each matriculation must have a plateNumber and status" });
            }
            if (!["available", "rented", "maintenance"].includes(mat.status)) {
              return res.status(400).json({ success: false, message: "Invalid status in matriculations" });
            }
            mat.unavailablePeriods = mat.unavailablePeriods || [];
          }
          updateData.matriculations = parsedMatriculations;
        } catch (error) {
          console.error('updateCar: Matriculations parsing error:', error);
          return res.status(400).json({ success: false, message: "Invalid matriculations format" });
        }
      }

      // Start with existing images
      let imageUrls = existingCar.imageUrls || [];

      // Handle deleted images
      if (deletedImageUrls) {
        try {
          const parsedDeletedImageUrls = JSON.parse(deletedImageUrls);
          if (Array.isArray(parsedDeletedImageUrls) && parsedDeletedImageUrls.length > 0) {
            
            // Delete files from filesystem
            for (const url of parsedDeletedImageUrls) {
              const filePath = join(__dirname, "../../public", url);
              if (fs.existsSync(filePath)) {
                try {
                  fs.unlinkSync(filePath);
                } catch (fileErr) {
                  console.error(`updateCar: Failed to delete file ${filePath}:`, fileErr);
                }
              }
            }
            
            // Remove deleted URLs from array
            imageUrls = imageUrls.filter(url => !parsedDeletedImageUrls.includes(url));
          }
        } catch (error) {
          console.error('updateCar: Deleted image URLs parsing error:', error);
          return res.status(400).json({ success: false, message: "Invalid deleted image URLs format" });
        }
      }

      // Handle new uploaded files
      if (req.files && req.files.length > 0) {
        
        // Check if adding new images would exceed limit
        if (imageUrls.length + req.files.length > 5) {
          // Clean up uploaded files
          req.files.forEach(file => {
            try {
              fs.unlinkSync(file.path);
            } catch (fileErr) {
              console.error(`Failed to clean up file ${file.path}:`, fileErr);
            }
          });
          return res.status(400).json({ 
            success: false, 
            message: `Cannot upload ${req.files.length} images. Maximum total is 5, you currently have ${imageUrls.length}` 
          });
        }
        
        // Add new image URLs
        const newImageUrls = req.files.map((file) => `/cars/${id}/${file.filename}`);
        imageUrls = [...imageUrls, ...newImageUrls];
      }

      // Always update imageUrls
      updateData.imageUrls = imageUrls;

      try {
        const updatedCar = await Car.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedCar) {
          return res.status(404).json({ success: false, message: "Car not found" });
        }
        res.status(200).json({ success: true, data: updatedCar });
      } catch (error) {
        console.error('updateCar: Database error:', error);
        
        // Clean up uploaded files if database update fails
        if (req.files?.length > 0) {
          req.files.forEach(file => {
            try {
              fs.unlinkSync(file.path);
            } catch (fileErr) {
              console.error(`Failed to clean up file ${file.path}:`, fileErr);
            }
          });
        }
        
        res.status(400).json({ success: false, message: `Failed to update car: ${error.message}` });
      }
    });
  });
};

export const deleteCar = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const deleted = await Car.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Car not found" });
      }
      const uploadPath = join(__dirname, "../../public/cars", req.params.id);
      if (fs.existsSync(uploadPath)) {
        fs.rmSync(uploadPath, { recursive: true, force: true });
      }
      res.status(200).json({ success: true, message: "Car deleted successfully" });
    } catch (error) {
      console.error('deleteCar error:', error);
      res.status(500).json({ success: false, message: "Failed to delete car" });
    }
  });
};

export const getAvailableCars = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: "Les paramètres startDate et endDate sont requis" });
      }

      const pickup = new Date(startDate);
      const dropoff = new Date(endDate);
      if (!isValidDate(pickup) || !isValidDate(dropoff)) {
        return res.status(400).json({ success: false, message: "Dates invalides" });
      }
      if (pickup >= dropoff) {
        return res.status(400).json({ success: false, message: "La date de fin doit être après la date de début" });
      }

      const cars = await Car.find().lean();
      const availableCars = cars.map(car => {
        const availableQuantity = car.matriculations.filter(m => {
          if (m.status === 'maintenance') return false;

          const hasOverlap = m.unavailablePeriods.some(period => {
            const periodStart = new Date(period.startDate);
            const periodEnd = new Date(period.endDate);
            return pickup <= periodEnd && dropoff >= periodStart;
          });

          return !hasOverlap;
        }).length;

        return {
          _id: car._id,
          brand: car.brand,
          model: car.model,
          type: car.type,
          pricePerDay: car.pricePerDay,
          availableQuantity
        };
      });

      const filteredAvailableCars = availableCars.filter(car => car.availableQuantity > 0);
      const totalAvailable = filteredAvailableCars.reduce((sum, car) => sum + car.availableQuantity, 0);

      res.json({
        success: true,
        data: filteredAvailableCars,
        totalAvailable
      });
    } catch (error) {
      console.error("getAvailableCars error:", error);
      res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  });
};