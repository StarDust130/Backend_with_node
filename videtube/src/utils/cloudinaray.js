import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload file to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.error("No file path provided.");
      return { success: false, message: "No file path provided." };
    }

    console.log("Checking if file exists:", localFilePath);
    if (!fs.existsSync(localFilePath)) {
      console.error("File does not exist:", localFilePath);
      return { success: false, message: "File does not exist." };
    }

    console.log("Uploading file from path:", localFilePath);

    const validExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    const fileExtension = path.extname(localFilePath).toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      console.error("Invalid file type. Supported types are:", validExtensions);
      return { success: false, message: "Invalid file type." };
    }

    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "videtube",
    });

    console.log("Cloudinary Upload Result 📁:", result.secure_url);

    // Delete the local file after upload
    fs.unlinkSync(localFilePath);

    return {
      success: true,
      url: result.secure_url,
    };
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // Ensure the local file is deleted even on error
    }
    return {
      success: false,
      message: "Failed to upload cover image to Cloudinary",
      error: error.message || "Unknown error",
    };
  }
};

// Function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      console.error("No public ID provided.");
      return { success: false, message: "No public ID provided." };
    }

    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary Delete Result 🗑️:", result);

    return {
      success: true,
      result: result,
    };
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return {
      success: false,
      message: "Failed to delete from Cloudinary",
      error: error.message || "Unknown error",
    };
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
