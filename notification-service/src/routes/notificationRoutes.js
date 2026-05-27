const express = require("express");

const { getNotificationLogs } = require("../controllers/notificationController");

const router = express.Router();

router.get("/logs", getNotificationLogs);

module.exports = router;