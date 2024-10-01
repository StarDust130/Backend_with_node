import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

// Connect to MongoDB

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    console.log(
      `MongoDB connected Successfully: ${connectionInstance.connection.host} 🚀`
    );
  } catch (error) {
    console.log("MongoDB error 😢: ", error);
    process.exit(1);
  }
};

export default connectDB;
