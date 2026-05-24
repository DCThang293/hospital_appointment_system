const amqp = require("amqplib");
require("dotenv").config();

let channel;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectRabbitMQ = async () => {
  let retries = 10;

  while (retries > 0) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      channel = await connection.createChannel();

      await channel.assertQueue(process.env.APPOINTMENT_CREATED_QUEUE, {
        durable: true,
      });

      console.log("Connected to RabbitMQ successfully");
      return;
    } catch (error) {
      console.error(
        `RabbitMQ connection failed: ${error.message}. Retrying...`
      );

      retries -= 1;
      await sleep(5000);
    }
  }

  console.error("Could not connect to RabbitMQ after multiple retries");
};

const publishAppointmentCreated = async (message) => {
  try {
    if (!channel) {
      console.error("RabbitMQ channel is not available");
      return;
    }

    channel.sendToQueue(
      process.env.APPOINTMENT_CREATED_QUEUE,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
      }
    );

    console.log("Published message to RabbitMQ:", message);
  } catch (error) {
    console.error("Publish message failed:", error.message);
  }
};

module.exports = {
  connectRabbitMQ,
  publishAppointmentCreated,
};