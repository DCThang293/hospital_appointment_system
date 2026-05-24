const express = require("express");
const cors = require("cors");
const doctorRoutes = require("./routes/doctorRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "Doctor Service",
    status: "running",
  });
});

app.use("/doctors", doctorRoutes);

module.exports = app;