const axios = require("axios");
require("dotenv").config();

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL;

const getDoctorById = async (doctorId) => {
  try {
    const response = await axios.get(`${DOCTOR_SERVICE_URL}/doctors/${doctorId}`, {
      timeout: 5000,
    });

    return response.data.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }

    console.error("Doctor Service error:", error.message);
    throw new Error("Doctor service is temporarily unavailable");
  }
};

module.exports = {
  getDoctorById,
};