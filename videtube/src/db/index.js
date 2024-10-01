import mongoose from "mongoose";
import { DB_NAME } from "../constant";

// Connect to MongoDB

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
      }
    );
    console.log(
      `MongoDB connected Successfully: ${connectionInstance.connection.host} 🚀`
    );
  } catch (error) {
    console.log("MongoDB connection failed 💥: ", error);
    process.exit(1);
  }
};
