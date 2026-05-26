const { pool } = require("../config/db");
const { getDoctorById } = require("../services/doctorClient");
const { publishAppointmentCreated } = require("../messaging/rabbitmq");

const createAppointment = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      reason,
    } = req.body;

    const patient_id = patientId || req.body.patient_id;
    const doctor_id = doctorId || req.body.doctor_id;
    const appointment_date = appointmentDate || req.body.appointment_date;
    const appointment_time = appointmentTime || req.body.appointment_time;

    if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
      return res.status(400).json({
        message: "patient_id, doctor_id, appointment_date and appointment_time are required",
      });
    }

    const doctor = await getDoctorById(doctor_id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    const result = await pool.query(
      `INSERT INTO appointments
       (patient_id, doctor_id, appointment_date, appointment_time, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [patient_id, doctor_id, appointment_date, appointment_time, reason, "CONFIRMED"]
    );
    const appointment = result.rows[0];

    await publishAppointmentCreated({
      eventType: "APPOINTMENT_CREATED",
      appointmentId: appointment.id,
      patientId: appointment.patient_id,
      doctorId: appointment.doctor_id,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
      reason: appointment.reason,
      status: appointment.status,
    });

    res.status(201).json({
      message: "Appointment created successfully",
      doctor,
      data: appointment,
    });
  } catch (error) {
    console.error("Create appointment error:", error.message);

    if (error.code === "23505") {
      return res.status(400).json({
        message: "This time slot is already booked",
      });
    }

    if (error.message === "Doctor service is temporarily unavailable") {
      return res.status(503).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getAllAppointments = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM appointments ORDER BY id ASC"
    );

    res.status(200).json({
      message: "Appointments retrieved successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error("Get appointments error:", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM appointments WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      message: "Appointment retrieved successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get appointment by id error:", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getAppointmentsByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;

    const result = await pool.query(
      "SELECT * FROM appointments WHERE patient_id = $1 ORDER BY appointment_date, appointment_time",
      [patientId]
    );

    res.status(200).json({
      message: "Patient appointments retrieved successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error("Get patient appointments error:", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getAppointmentsByDoctorId = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const result = await pool.query(
      "SELECT * FROM appointments WHERE doctor_id = $1 ORDER BY appointment_date, appointment_time",
      [doctorId]
    );

    res.status(200).json({
      message: "Doctor appointments retrieved successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error("Get doctor appointments error:", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = ["CONFIRMED", "CANCELLED", "COMPLETED"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const result = await pool.query(
      `UPDATE appointments
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      message: "Appointment status updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update appointment status error:", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM appointments WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      message: "Appointment deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Delete appointment error:", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  getAppointmentsByPatientId,
  getAppointmentsByDoctorId,
  updateAppointmentStatus,
  deleteAppointment,
};