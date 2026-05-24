require("dotenv").config();

const app = require("./app");
const { testConnection } = require("./config/db");
const { connectRabbitMQ } = require("./messaging/rabbitmq");

const PORT = process.env.PORT || 8083;

app.listen(PORT, async () => {
  console.log(`Appointment Service is running on port ${PORT}`);
  await testConnection();
  await connectRabbitMQ();
});