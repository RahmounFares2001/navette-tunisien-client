import express from 'express';
import {
  getUsers,
  getUserById,
  getUserByLicenseID,
  createUser,
  updateUser,
  deleteUser
} from '../../controllers/user/userController.js';

const router = express.Router();

router.get('/', getUsers);
router.get('/license', getUserByLicenseID);

router.get('/:id', getUserById);


router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;