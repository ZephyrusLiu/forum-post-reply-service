require("dotenv").config();
const app = require("./app");
const connectMongo = require("./db/mongo");

const PORT = process.env.PORT || 5004;

(async () => {
  await connectMongo();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Post service running on ${PORT}`);
  });
})();
