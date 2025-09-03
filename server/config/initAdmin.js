import bcrypt from "bcrypt";
import { Admin } from "../models/models.js";

const initAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({});
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      const newAdmin = new Admin({
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
      });

      await newAdmin.save();
    } else {
      console.log("Admin exists")
    }
  } catch (err) {
    console.error("Error creating admin:", err);
  }
};

export default initAdmin;