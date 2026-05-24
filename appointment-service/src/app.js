const express = require("express");
const cors = require("cors");
const appointmentRoutes = require("./routes/appointmentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "Appointment Service",
    status: "running",
  });
});

app.use("/appointments", appointmentRoutes);

module.exports = app;