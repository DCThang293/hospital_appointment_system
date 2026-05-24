require("dotenv").config();

const app = require("./app");
const { testConnection } = require("./config/db");

const PORT = process.env.PORT || 8081;

app.listen(PORT, async () => {
  console.log(`User Service is running on port ${PORT}`);
  await testConnection();
});