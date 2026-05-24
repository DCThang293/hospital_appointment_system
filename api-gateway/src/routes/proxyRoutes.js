const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const router = express.Router();

router.use(
  "/users",
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path, req) => {
      return "/users" + path;
    },
    onError: (err, req, res) => {
      console.error("User Service proxy error:", err.message);
      res.status(503).json({
        message: "User Service is temporarily unavailable",
      });
    },
  })
);

router.use(
  "/doctors",
  createProxyMiddleware({
    target: process.env.DOCTOR_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path, req) => {
      return "/doctors" + path;
    },
    onError: (err, req, res) => {
      console.error("Doctor Service proxy error:", err.message);
      res.status(503).json({
        message: "Doctor Service is temporarily unavailable",
      });
    },
  })
);

router.use(
  "/appointments",
  createProxyMiddleware({
    target: process.env.APPOINTMENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path, req) => {
      return "/appointments" + path;
    },
    onError: (err, req, res) => {
      console.error("Appointment Service proxy error:", err.message);
      res.status(503).json({
        message: "Appointment Service is temporarily unavailable",
      });
    },
  })
);

router.use(
  "/notifications",
  createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path, req) => {
      return "/notifications" + path;
    },
    onError: (err, req, res) => {
      console.error("Notification Service proxy error:", err.message);
      res.status(503).json({
        message: "Notification Service is temporarily unavailable",
      });
    },
  })
);

module.exports = router;