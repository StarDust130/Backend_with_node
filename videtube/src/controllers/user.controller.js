import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinaray.js";
import { ApiError } from "next/dist/server/api-utils/index.js";

const registerUser = asyncHandler(async (req, res) => {
  // 1) Accept Data from the user
  const { fullName, email, password, username } = req.body;

  // 2) Validate the data
  if (
    [fullName, email, password, username].includes(undefined) ||
    [fullName, email, password, username].includes("")
  ) {
    throw new ApiError(400, "Please provide all the required fields", res);
  }

  // 3) Check if the user already exists
  const user = await User.findOne({
    $or: [{ email }, { username }], //This is mongoose query syntax for OR operation
  });

  if (user) {
    throw new ApiError(409, "User already exists", res);
  }

  // 4) Handle the avatar and coverImage
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Image is Required! 🍧", res);
  }

  // 4.1) Upload the avatar and coverImage to Cloudinary
  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath, "avatar");
    console.log("Avatar Upload Success 🎉: ", avatar);
  } catch (error) {
    throw new ApiError(500, "Failed to upload avatar to Cloudinary", res);
  }

  let coverImage;
  if (coverImageLocalPath) {
    try {
      coverImage = await uploadOnCloudinary(coverImageLocalPath, "coverImage");
      console.log("Cover Image Upload Success 🎉: ", coverImage);
    } catch (error) {
      throw new ApiError(
        500,
        "Failed to upload cover image to Cloudinary",
        res
      );
    }
  }

  if (!avatar || !coverImage) {
    throw new ApiError(500, "Failed to upload image to Cloudinary", res);
  }

  try {
    // 5) Create a new user
    const newUser = await User.create({
      fullName,
      avatar: avatar?.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase(),
    });

    // 6) Check if the user was created successfully
    const createdUser = await User.findById(newUser._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering a user",
        res
      );
    }

    // 7) Send back the response
    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User created successfully 🎉"));
  } catch (error) {
    console.log("User Creation Failed");
    if (avatar) {
      await deleteFromCloudinary(avatar.public_id);
    }
    if (coverImage) {
      await deleteFromCloudinary(coverImage.public_id);
    }
    throw new ApiError(500, "Failed to create a new user", res);
  }
});

export { registerUser };
