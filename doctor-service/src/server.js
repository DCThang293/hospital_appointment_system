require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 8082;

app.listen(PORT, () => {
  console.log(`Doctor Service is running on port ${PORT}`);
});