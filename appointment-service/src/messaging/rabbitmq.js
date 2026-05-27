const amqp = require("amqplib");
const { randomUUID } = require("crypto");
require("dotenv").config();

let channel;
const queueName = process.env.APPOINTMENT_CREATED_QUEUE;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectRabbitMQ = async () => {
  let retries = 10;

  while (retries > 0) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      channel = await connection.createChannel();

      await channel.assertQueue(queueName, {
        durable: true,
      });

      console.log(`Connected to RabbitMQ successfully. Queue: ${queueName}`);
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

    const event = {
      eventId: randomUUID(),
      eventType: "APPOINTMENT_CREATED",
      source: "appointment-service",
      occurredAt: new Date().toISOString(),
      payload: message,
    };

    const published = channel.sendToQueue(queueName, Buffer.from(JSON.stringify(event)), {
      persistent: true,
      contentType: "application/json",
      messageId: event.eventId,
      timestamp: Date.now(),
    });

    if (!published) {
      console.error(`Failed to publish event to queue: ${queueName}`);
      return;
    }

    console.log(`Published ${event.eventType} to ${queueName} with eventId=${event.eventId}`);
  } catch (error) {
    console.error("Publish message failed:", error.message);
  }
};

module.exports = {
  connectRabbitMQ,
  publishAppointmentCreated,
};