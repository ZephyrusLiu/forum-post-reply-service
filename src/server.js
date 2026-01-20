require("dotenv").config();
const app = require("./app");
const connectMongo = require("./db/mongo");

(async () => {
  await connectMongo();
  app.listen(3000, () => console.log("Server running on 3000"));
})();
