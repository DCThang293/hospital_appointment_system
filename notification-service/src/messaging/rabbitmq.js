const amqp = require("amqplib");
require("dotenv").config();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectRabbitMQ = async () => {
  let retries = 10;

  while (retries > 0) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await connection.createChannel();

      await channel.assertQueue(process.env.APPOINTMENT_CREATED_QUEUE, {
        durable: true,
      });

      console.log("Notification Service connected to RabbitMQ");
      console.log(
        `Waiting for messages in queue: ${process.env.APPOINTMENT_CREATED_QUEUE}`
      );

      channel.consume(
        process.env.APPOINTMENT_CREATED_QUEUE,
        async (msg) => {
          if (msg !== null) {
            try {
              const content = msg.content.toString();
              const event = JSON.parse(content);

              console.log("Received appointment created event:");
              console.log(event);

              console.log(
                `Send notification to patient ${event.patientId}: Appointment ${event.appointmentId} confirmed with doctor ${event.doctorId} at ${event.appointmentTime} on ${event.appointmentDate}`
              );

              channel.ack(msg);
            } catch (error) {
              console.error("Message processing failed:", error.message);

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