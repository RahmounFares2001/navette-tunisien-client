import { User } from '../../models/models.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createUser = async (userData, files, session) => {
  try {
    // Validate user data
    if (!userData.fullName || !userData.email || !userData.phone || !userData.licenseIDNumber) {
      throw new Error('All user fields (fullName, email, phone, licenseIDNumber) must be provided');
    }

    // Validate files
    if (!files || !files.identity || !files.license || !files.identity[0] || !files.license[0]) {
      throw new Error('Identity and license documents are required');
    }

    // Create new user to get _id
    const user = new User({
      fullName: userData.fullName.trim(),
      email: userData.email.trim(),
      phone: userData.phone.trim(),
      licenseIDNumber: userData.licenseIDNumber.trim(),
    });

    await user.save({ session });

    // Define user-specific upload path
    const userDir = join(__dirname, '../../var/secure_docs/users', user._id.toString());
    try {
      if (!existsSync(userDir)) {
        mkdirSync(userDir, { recursive: true });
      } 
    } catch (error) {
      console.error(`Failed to create directory ${userDir}:`, error.message);
      throw new Error(`Failed to create user directory: ${error.message}`);
    }

    // Process identity file
    const identityFile = files.identity[0];
    const identityExtension = identityFile.originalname.split('.').pop().toLowerCase();
    const identityNewFilename = `identity.${identityExtension}`;
    const identityNewPath = join(userDir, identityNewFilename);
    try {
      await fs.rename(identityFile.path, identityNewPath);
    } catch (error) {
      console.error(`Failed to move identity file to ${identityNewPath}:`, error.message);
      throw new Error(`Failed to process identity file: ${error.message}`);
    }

    // Process license file
    const licenseFile = files.license[0];
    const licenseExtension = licenseFile.originalname.split('.').pop().toLowerCase();
    const licenseNewFilename = `license.${licenseExtension}`;
    const licenseNewPath = join(userDir, licenseNewFilename);
    try {
      await fs.rename(licenseFile.path, licenseNewPath);
    } catch (error) {
      console.error(`Failed to move license file to ${licenseNewPath}:`, error.message);
      // Clean up identity file if license fails
      try {
        await fs.unlink(identityNewPath);
      } catch (unlinkErr) {
        console.error(`Failed to clean up identity file ${identityNewPath}:`, unlinkErr.message);
      }
      throw new Error(`Failed to process license file: ${error.message}`);
    }

    // Update user with file paths
    user.identityDocUrl = `/users/${user._id}/${identityNewFilename}`;
    user.licenseUrl = `/users/${user._id}/${licenseNewFilename}`;
    await user.save({ session });

   

    return { success: true, data: user };
  } catch (error) {
    console.error('createUser: Error:', {
      message: error.message,
      stack: error.stack,
    });
    // Clean up any saved files on error
    if (user && user._id) {
      const userDir = join(__dirname, '../../public/users', user._id.toString());
      try {
        await fs.rm(userDir, { recursive: true, force: true });
      } catch (rmErr) {
        console.error(`Failed to clean up directory ${userDir}:`, rmErr.message);
      }
    }
    throw error;
  }
};



// var/secure_docs