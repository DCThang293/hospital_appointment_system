const { pool } = require("../config/db");

const storeNotificationLog = async ({
  eventId,
  eventType,
  source,
  payload,
  status,
  errorMessage = null,
}) => {
  const result = await pool.query(
    `INSERT INTO notification_logs
     (event_id, event_type, source, payload, status, error_message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [eventId, eventType, source, payload, status, errorMessage]
  );

  return result.rows[0];
};

const getNotificationLogs = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const result = await pool.query(
      `SELECT *
       FROM notification_logs
       ORDER BY processed_at DESC, id DESC
       LIMIT $1`,
      [limit]
    );

    res.status(200).json({
      message: "Notification logs retrieved successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error("Get notification logs error:", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  storeNotificationLog,
  getNotificationLogs,
};