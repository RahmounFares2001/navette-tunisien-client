import express from "express";
import {
  createProlongationRequest,
  getAllProlongationRequests,
  getProlongationRequestById,
  updateProlongationStatus,
  deleteProlongationRequest,
  confirmProlongation
} from "../../controllers/prolongation/prolongationController.js";

const router = express.Router();

router.get("/confirmation", confirmProlongation); 

router.post("/", createProlongationRequest);

router.get("/", getAllProlongationRequests);
router.get("/:id", getProlongationRequestById);

router.put("/:id", updateProlongationStatus);

router.delete("/:id", deleteProlongationRequest);

export default router;
