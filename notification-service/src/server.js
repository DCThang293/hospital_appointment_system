require("dotenv").config();

const app = require("./app");
const { testConnection } = require("./config/db");
const { connectRabbitMQ } = require("./messaging/rabbitmq");

const PORT = process.env.PORT || 8084;

app.listen(PORT, async () => {
  console.log(`Notification Service is running on port ${PORT}`);
  await testConnection();
  await connectRabbitMQ();
});