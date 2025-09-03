import mongoose from 'mongoose';
import { Excursion } from '../../models/models.js';
import { verifyAdmin } from '../../utils/verifyAdmin.js';
import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a new excursion
export const createExcursion = async (req, res) => {
  const excursionId = new mongoose.Types.ObjectId().toString();

  try {
    const { title, description, includedItems, dailyProgram, prices, isAvailable, duration, imageUrls } = req.body;

    // Parse arrays if they are strings
    const parsedIncludedItems = Array.isArray(includedItems) ? includedItems : JSON.parse(includedItems || '[]');
    const parsedDailyProgram = Array.isArray(dailyProgram) ? dailyProgram : JSON.parse(dailyProgram || '[]');
    const parsedPrices = prices ? (typeof prices === 'string' ? JSON.parse(prices) : prices) : {};
    const parsedImageUrls = Array.isArray(imageUrls) ? imageUrls : JSON.parse(imageUrls || '[]');

    // Validate required fields
    const requiredFields = {
      title,
      description,
      includedItems: parsedIncludedItems,
      dailyProgram: parsedDailyProgram,
      'prices.oneToFour': parsedPrices.oneToFour,
      'prices.fiveToSix': parsedPrices.fiveToSix,
      'prices.sevenToEight': parsedPrices.sevenToEight,
      duration,
      imageUrls: parsedImageUrls,
    };
    const missingFields = Object.keys(requiredFields).filter(
      (key) => !requiredFields[key] || (Array.isArray(requiredFields[key]) && requiredFields[key].length === 0)
    );
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Champs requis manquants : ${missingFields.join(', ')}`,
      });
    }

    // Validate includedItems and dailyProgram are arrays
    if (!Array.isArray(parsedIncludedItems) || !Array.isArray(parsedDailyProgram)) {
      return res.status(400).json({
        success: false,
        message: 'Les éléments inclus et le programme quotidien doivent être des tableaux',
      });
    }

    // Validate prices
    if (
      isNaN(Number(parsedPrices.oneToFour)) ||
      Number(parsedPrices.oneToFour) < 0 ||
      isNaN(Number(parsedPrices.fiveToSix)) ||
      Number(parsedPrices.fiveToSix) < 0 ||
      isNaN(Number(parsedPrices.sevenToEight)) ||
      Number(parsedPrices.sevenToEight) < 0
    ) {
      return res.status(400).json({ success: false, message: 'Tous les prix doivent être des nombres positifs' });
    }

    // Validate duration
    if (isNaN(Number(duration)) || Number(duration) <= 0) {
      return res.status(400).json({ success: false, message: 'La durée doit être un nombre positif' });
    }

    // Validate and process imageUrls
    if (!parsedImageUrls.length) {
      return res.status(400).json({ success: false, message: 'Au moins une image est requise' });
    }

    const savedImageUrls = [];
    const dir = join(__dirname, '../../public/excursions', excursionId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    for (let i = 0; i < parsedImageUrls.length; i++) {
      const base64String = parsedImageUrls[i];
      if (!base64String.startsWith('data:image/')) {
        return res.status(400).json({ success: false, message: `Image ${i + 1} n'est pas un format d'image valide` });
      }

      const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ success: false, message: `Image ${i + 1} n'est pas un format base64 valide` });
      }

      const extension = matches[1].toLowerCase();
      if (!['jpeg', 'jpg', 'png'].includes(extension)) {
        return res.status(400).json({ success: false, message: `Image ${i + 1} doit être au format JPEG ou PNG` });
      }

      const buffer = Buffer.from(matches[2], 'base64');
      if (buffer.length > 1 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: `Image ${i + 1} dépasse 1 Mo` });
      }

      const fileName = `img${i + 1}.${extension}`;
      const filePath = join(dir, fileName);
      fs.writeFileSync(filePath, buffer);
      savedImageUrls.push(`/excursions/${excursionId}/${fileName}`);
    }

    const excursion = new Excursion({
      _id: excursionId,
      title,
      description,
      includedItems: parsedIncludedItems,
      dailyProgram: parsedDailyProgram,
      prices: {
        oneToFour: Number(parsedPrices.oneToFour),
        fiveToSix: Number(parsedPrices.fiveToSix),
        sevenToEight: Number(parsedPrices.sevenToEight),
      },
      duration: Number(duration),
      isAvailable: isAvailable !== undefined ? isAvailable === 'true' || isAvailable === true : true,
      imageUrls: savedImageUrls,
    });

    await excursion.save();
    res.json({ success: true, data: excursion, message: 'Excursion créée avec succès' });
  } catch (err) {
    console.error('createExcursion: Error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
};

// Get all excursions
export const getAllExcursions = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search ? String(req.query.search).trim() : '';
      const skip = (page - 1) * limit;

      // Build query
      const query = {};
      if (search) {
        query.title = { $regex: search, $options: 'i' }; 
      }

      const totalItems = await Excursion.countDocuments(query);
      const excursions = await Excursion.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(totalItems / limit);

      res.json({
        success: true,
        data: excursions,
        currentPage: page,
        totalPages,
        totalItems,
      });
    } catch (err) {
      console.error('getAllExcursions error:', err);
      res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  });
};

// Get a single excursion by ID
export const getExcursionById = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'ID d\'excursion invalide' });
      }

      const excursion = await Excursion.findById(id);
      if (!excursion) {
        return res.status(404).json({ success: false, message: 'Excursion non trouvée' });
      }

      res.json({ success: true, data: excursion });
    } catch (err) {
      console.error('getExcursionById error:', err);
      res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  });
};

// Update an excursion
export const updateExcursion = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const { id } = req.params;
      const excursion = await Excursion.findById(id);
      if (!excursion) {
        return res.status(400).json({ success: false, message: 'Excursion non trouvée' });
      }

      const { title, description, includedItems, dailyProgram, prices, isAvailable, duration, imageUrls, imagesToDelete } = req.body;

      // Parse arrays if they are strings
      const parsedIncludedItems = includedItems ? (Array.isArray(includedItems) ? includedItems : JSON.parse(includedItems || '[]')) : excursion.includedItems;
      const parsedDailyProgram = dailyProgram ? (Array.isArray(dailyProgram) ? dailyProgram : JSON.parse(dailyProgram || '[]')) : excursion.dailyProgram;
      const parsedPrices = prices ? (typeof prices === 'string' ? JSON.parse(prices) : prices) : excursion.prices;
      const parsedImageUrls = imageUrls ? (Array.isArray(imageUrls) ? imageUrls : JSON.parse(imageUrls || '[]')) : [];
      const parsedImagesToDelete = imagesToDelete ? (Array.isArray(imagesToDelete) ? imagesToDelete : JSON.parse(imagesToDelete || '[]')) : [];

      // Validate includedItems and dailyProgram if provided
      if (includedItems && !Array.isArray(parsedIncludedItems)) {
        return res.status(400).json({ success: false, message: 'Les éléments inclus doivent être un tableau' });
      }
      if (dailyProgram && !Array.isArray(parsedDailyProgram)) {
        return res.status(400).json({ success: false, message: 'Le programme quotidien doit être un tableau' });
      }

      // Validate prices if provided
      if (prices && (
        isNaN(Number(parsedPrices.oneToFour)) || Number(parsedPrices.oneToFour) < 0 ||
        isNaN(Number(parsedPrices.fiveToSix)) || Number(parsedPrices.fiveToSix) < 0 ||
        isNaN(Number(parsedPrices.sevenToEight)) || Number(parsedPrices.sevenToEight) < 0
      )) {
        return res.status(400).json({ success: false, message: 'Tous les prix doivent être des nombres positifs' });
      }

      // Validate duration if provided
      if (duration !== undefined && (isNaN(Number(duration)) || Number(duration) <= 0)) {
        return res.status(400).json({ success: false, message: 'La durée doit être un nombre positif' });
      }

      // Handle image deletions
      let imageUrlsArray = excursion.imageUrls || [];
      let deletedCount = 0;
      if (parsedImagesToDelete.length > 0) {
        for (const url of parsedImagesToDelete) {
          const fileName = path.basename(url);
          const filePath = join(__dirname, '../../public/excursions', id, fileName);
          console.log(`Attempting to delete file: ${filePath}`);
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Successfully deleted file: ${filePath}`);
              deletedCount++;
            } else {
              console.warn(`File not found: ${filePath}`);
            }
          } catch (fileErr) {
            console.error(`Failed to delete file ${filePath}:`, fileErr);
          }
          imageUrlsArray = imageUrlsArray.filter(existingUrl => existingUrl !== url);
        }
      }

      // Handle new image uploads (base64)
      if (parsedImageUrls.length > 0) {
        const dir = join(__dirname, '../../public/excursions', id);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Find the highest existing image number
        let highestImageNumber = 0;
        if (excursion.imageUrls) {
          excursion.imageUrls.forEach(url => {
            const match = url.match(/img(\d+)\.(?:png|jpg|jpeg)/);
            if (match) {
              const num = parseInt(match[1]);
              if (num > highestImageNumber) {
                highestImageNumber = num;
              }
            }
          });
        }

        const newImageUrls = [];
        for (let i = 0; i < parsedImageUrls.length; i++) {
          const base64String = parsedImageUrls[i];
          if (!base64String.startsWith('data:image/')) {
            return res.status(400).json({ success: false, message: `Image ${i + 1} n'est pas un format d'image valide` });
          }

          const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {
            return res.status(400).json({ success: false, message: `Image ${i + 1} n'est pas un format base64 valide` });
          }

          const extension = matches[1].toLowerCase();
          if (!['jpeg', 'jpg', 'png'].includes(extension)) {
            return res.status(400).json({ success: false, message: `Image ${i + 1} doit être au format JPEG ou PNG` });
          }

          const buffer = Buffer.from(matches[2], 'base64');
          if (buffer.length > 1 * 1024 * 1024) {
            return res.status(400).json({ success: false, message: `Image ${i + 1} dépasse 1 Mo` });
          }

          const fileName = `img${highestImageNumber + i + 1}.${extension}`;
          const filePath = join(dir, fileName);
          fs.writeFileSync(filePath, buffer);
          newImageUrls.push(`/excursions/${id}/${fileName}`);
        }

        // Check total images
        if (imageUrlsArray.length + newImageUrls.length > 5) {
          newImageUrls.forEach((_, index) => {
            const fileName = `img${highestImageNumber + index + 1}.${extension}`;
            const filePath = join(dir, fileName);
            try {
              fs.unlinkSync(filePath);
            } catch (fileErr) {
              console.error(`updateExcursion: Failed to clean up file ${filePath}:`, fileErr);
            }
          });
          return res.status(400).json({
            success: false,
            message: `Impossible d'ajouter ${newImageUrls.length} images. Maximum 5 images, vous avez actuellement ${imageUrlsArray.length} images.`,
          });
        }

        imageUrlsArray = [...imageUrlsArray, ...newImageUrls].filter((url, index, self) =>
          self.indexOf(url) === index
        ).slice(0, 5);
      }

      // Update fields if provided
      if (title) excursion.title = title;
      if (description) excursion.description = description;
      if (includedItems) excursion.includedItems = parsedIncludedItems;
      if (dailyProgram) excursion.dailyProgram = parsedDailyProgram;
      if (prices) {
        excursion.prices = {
          oneToFour: Number(parsedPrices.oneToFour),
          fiveToSix: Number(parsedPrices.fiveToSix),
          sevenToEight: Number(parsedPrices.sevenToEight),
        };
      }
      if (duration !== undefined) excursion.duration = Number(duration);
      if (isAvailable !== undefined) excursion.isAvailable = isAvailable === 'true' || isAvailable === true;
      excursion.imageUrls = imageUrlsArray;

      // Save updated excursion
      const updatedExcursion = await excursion.save();
      console.log('Updated excursion:', updatedExcursion);

      res.json({
        success: true,
        data: updatedExcursion,
        message: `Excursion mise à jour avec succès${deletedCount > 0 ? `, ${deletedCount} image(s) supprimée(s)` : ''}`,
      });
    } catch (err) {
      console.error('updateExcursion: Error:', err);
      res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  });
};

// Delete an excursion
export const deleteExcursion = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'ID d\'excursion invalide' });
      }

      const excursion = await Excursion.findById(id);
      if (!excursion) {
        return res.status(404).json({ success: false, message: 'Excursion non trouvée' });
      }

      const imageDir = join(__dirname, '../../public/excursions', id);
      if (fs.existsSync(imageDir)) {
        try {
          fs.rmSync(imageDir, { recursive: true, force: true });
        } catch (fileErr) {
          console.error(`deleteExcursion: Failed to delete directory ${imageDir}:`, fileErr);
        }
      }

      await Excursion.findByIdAndDelete(id);
      res.json({ success: true, message: 'Excursion supprimée avec succès' });
    } catch (err) {
      console.error('deleteExcursion: Error:', err);
      res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  });
};