const express = require("express");
const router = express.Router();

const {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  getAppointmentsByPatientId,
  getAppointmentsByDoctorId,
  updateAppointmentStatus,
  deleteAppointment,
} = require("../controllers/appointmentController");

router.post("/", createAppointment);
router.get("/", getAllAppointments);

router.get("/patient/:patientId", getAppointmentsByPatientId);
router.get("/doctor/:doctorId", getAppointmentsByDoctorId);

router.get("/:id", getAppointmentById);
router.put("/:id/status", updateAppointmentStatus);
router.delete("/:id", deleteAppointment);

module.exports = router;