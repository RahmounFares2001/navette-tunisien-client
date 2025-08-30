import { Agency } from "../../models/models.js";

// Get all agencies
export const getAllAgencies = async (req, res) => {
  try {
    const agencies = await Agency.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: agencies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch agencies" });
  }
};

// Get single agency by ID
export const getAgencyById = async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id);
    if (!agency) {
      return res.status(404).json({ success: false, message: "Agency not found" });
    }
    res.status(200).json({ success: true, data: agency });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch agency" });
  }
};

// Create a new agency
export const createAgency = async (req, res) => {
  try {
    const newAgency = new Agency(req.body);
    await newAgency.save();
    res.status(201).json({ success: true, data: newAgency });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to create agency" });
  }
};

// Update agency
export const updateAgency = async (req, res) => {
  try {
    const updated = await Agency.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Agency not found" });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update agency" });
  }
};

// Delete agency
export const deleteAgency = async (req, res) => {
  try {
    const deleted = await Agency.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Agency not found" });
    }
    res.status(200).json({ success: true, message: "Agency deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete agency" });
  }
};
