const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "User Service",
    status: "running",
  });
});

app.use("/users", userRoutes);

module.exports = app;