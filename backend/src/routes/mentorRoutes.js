import express from "express";
import {
  applyMentor, getMentorProfile, updateMentorProfile,
  addService, updateService, deleteService, getMentorServices,
  setAvailability, getAvailability,
  getMentors, getMentorDetails, getMentorDashboard
} from "../controllers/mentorController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validateRequest.js";
import {
  applyMentorSchema,
  updateMentorProfileSchema,
  addServiceSchema,
  updateServiceSchema,
  setAvailabilitySchema
} from "../validations/mentor.validation.js";

const router = express.Router();
router.get("/explore", getMentors);
router.get("/:id", getMentorDetails);
router.get("/:id/services", getMentorServices);
router.get("/:mentorId/availability", getAvailability);
router.post("/apply", protect, validate(applyMentorSchema), applyMentor);
router.get("/me/profile", protect, getMentorProfile);
router.put("/me/profile", protect, validate(updateMentorProfileSchema), updateMentorProfile);
router.get("/me/dashboard", protect, getMentorDashboard);
router.post("/services", protect, validate(addServiceSchema), addService);
router.put("/services/:serviceId", protect, validate(updateServiceSchema), updateService);
router.delete("/services/:serviceId", protect, deleteService);
router.put("/availability", protect, validate(setAvailabilitySchema), setAvailability);

export default router;
