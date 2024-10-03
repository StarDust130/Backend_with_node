import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "videtube",
    });
    console.log("Cloudinary Upload Result 📁: ", result.url);

    //! once the file is upoaded to cloudinary, we can delete the file from our server
    fs.unlinkSync(localFilePath);
    
    return result.secure_url;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.log(error);
    return null;
  }
};

export { uploadOnCloudinary };
