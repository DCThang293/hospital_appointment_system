const pool = require("../config/db");

const createDoctor = async (req, res) => {
  try {
    const { name, specialization, phone, email, room, description } = req.body;

    if (!name || !specialization) {
      return res.status(400).json({
        message: "Name and specialization are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO doctors 
       (name, specialization, phone, email, room, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, specialization, phone, email, room, description]
    );

    res.status(201).json({
      message: "Doctor created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create doctor error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getAllDoctors = async (req, res) => {
  try {
    const { specialization } = req.query;

    let result;

    if (specialization) {
      result = await pool.query(
        "SELECT * FROM doctors WHERE specialization ILIKE $1 ORDER BY id ASC",
        [`%${specialization}%`]
      );
    } else {
      result = await pool.query("SELECT * FROM doctors ORDER BY id ASC");
    }

    res.status(200).json({
      message: "Doctors retrieved successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error("Get doctors error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM doctors WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      message: "Doctor retrieved successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get doctor by id error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specialization, phone, email, room, description } = req.body;

    const result = await pool.query(
      `UPDATE doctors
       SET name = $1,
           specialization = $2,
           phone = $3,
           email = $4,
           room = $5,
           description = $6
       WHERE id = $7
       RETURNING *`,
      [name, specialization, phone, email, room, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      message: "Doctor updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update doctor error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM doctors WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      message: "Doctor deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Delete doctor error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};