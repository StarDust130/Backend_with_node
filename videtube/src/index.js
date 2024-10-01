import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on PORT: ${PORT} 🚀`);
    });
  })
  .catch((error) => {
    console.log("MongoDB connection failed 💥: ", error);
    process.exit(1);
  });
