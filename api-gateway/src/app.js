const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const proxyRoutes = require("./routes/proxyRoutes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(cors());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    service: "API Gateway",
    status: "running",
    routes: {
      users: "/users",
      doctors: "/doctors",
      appointments: "/appointments",
      notifications: "/notifications",
    },
  });
});

app.use("/", proxyRoutes);

app.use(errorHandler);

module.exports = app;