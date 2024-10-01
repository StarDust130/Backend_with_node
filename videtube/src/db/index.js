import mongoose from "mongoose";
import { DB_NAME } from "../constant";

// Connect to MongoDB

export const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.log("MongoDB connection failed 💥: ", error);
    process.exit(1);
  }
};
