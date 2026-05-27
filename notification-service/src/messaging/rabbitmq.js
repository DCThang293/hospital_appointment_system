const amqp = require("amqplib");
require("dotenv").config();
const { storeNotificationLog } = require("../controllers/notificationController");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const queueName = process.env.APPOINTMENT_CREATED_QUEUE;

const connectRabbitMQ = async () => {
  let retries = 10;

  while (retries > 0) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await connection.createChannel();

      await channel.assertQueue(queueName, {
        durable: true,
      });

      channel.prefetch(1);

      console.log("Notification Service connected to RabbitMQ");
      console.log(`Waiting for messages in queue: ${queueName}`);

      channel.consume(
        queueName,
        async (msg) => {
          if (msg !== null) {
            try {
              const rawContent = msg.content.toString();
              const event = JSON.parse(rawContent);

              console.log(
                `Received ${event.eventType} from ${event.source} with eventId=${event.eventId}`
              );
              console.log(event.payload);

              console.log(
                `Send notification to patient ${event.payload.patientId}: Appointment ${event.payload.appointmentId} confirmed with doctor ${event.payload.doctorId} at ${event.payload.appointmentTime} on ${event.payload.appointmentDate}`
              );

              const savedLog = await storeNotificationLog({
                eventId: event.eventId,
                eventType: event.eventType,
                source: event.source,
                payload: event.payload,
                status: "PROCESSED",
              });

              console.log(
                `Stored notification log id=${savedLog.id} for eventId=${event.eventId}`
              );
              channel.ack(msg);
            } catch (error) {
              console.error("Message processing failed:", error.message);

              try {
                const rawContent = msg.content.toString();
                await storeNotificationLog({
                  eventId: null,
                  eventType: "APPOINTMENT_CREATED",
                  source: "notification-service",
                  payload: { rawPayload: rawContent },
                  status: "FAILED",
                  errorMessage: error.message,
                });
              } catch (dbError) {
                console.error("Failed to store failed message log:", dbError.message);
              }

              // false, false nghĩa là không đưa message quay lại queue
              channel.nack(msg, false, false);
            }
          }
        },
        {
          noAck: false,
        }
      );

      return;
    } catch (error) {
      console.error(
        `RabbitMQ consumer connection failed: ${error.message}. Retrying...`
      );

      retries -= 1;
      await sleep(5000);
    }
  }

  console.error("Could not connect to RabbitMQ after multiple retries");
};

module.exports = {
  connectRabbitMQ,
};