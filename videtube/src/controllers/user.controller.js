import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinaray.js";
import { ApiError } from "next/dist/server/api-utils/index.js";
import jwt from "jsonwebtoken";

//! Generate a new access & refresh token
const generateAccessAndRefreshToken = async (userID) => {
  try {
    // 1)Find and validate the user
    const user = await User.findById(userID);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // 2) Generate a new access  & refresh token
    const acessToken = user.generateAccessToken();
    const refershToken = user.generateRefreshToken();

    // 3) Save the refresh token to the user document
    user.refreshToken = refershToken;
    await user.save();

    return { acessToken, refershToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate access & refresh token");
  }
};

const loginUser = asyncHandler(async (req, res) => {
  // 1) Accept the data from the user
  const { email, username, password } = req.body;

  // 2) Validate the data
  if (
    ![email, password, username].includes(undefined) ||
    [email, password, username].includes("")
  ) {
    throw new ApiError(400, "Please provide all the required fields", res);
  }
  // 3) Check if the user exists
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User not found", res);
  }

  // 4) Check if the password is correct
  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid Credentials", res);
  }

  // 5) Generate a new access & refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // 5.1) Check if the user login was successful
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!loggedInUser) {
    throw new ApiError(500, "Failed to login user ☠️", res);
  }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  // 6) Send back the response
  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      // Set the access token in the cookie
      options,
    })
    .cookie("refreshToken", refreshToken, {
      // Set the refresh token in the cookie
      options,
    })
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully 🎉"
      )
    );
});

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

const logoutUser = asyncHandler(async (req, res) => {
  // 1) Remove the refresh token from the user document
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } }, // Remove the refresh token
    { new: true } // Return the updated document
  );

  // 2) Clear the cookies
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  // 3) Send back the response
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully 🎉"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // 1) Accept the refresh token
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  // 2) Validate the refresh token
  if (!incomingRefreshToken) {
    throw new ApiError(400, "Refresh Token is required", res);
  }

  // 3) Verify the refresh token
  try {
    const decodedToken = await jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // 3.1) Check if the user exists
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token", res);
    }

    // 3.2) Check if the refresh token is valid
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid Refresh Token 😱", res);
    }

    // 3.3) Generate a new access & refresh token
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed Successfully 🎉"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Failed to refresh access token", res);
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  // 1) Accept the data from the user
  const { currentPassword, newPassword } = req.body;

  // 2) Validate the data
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Please provide all the required fields", res);
  }

  // 3) Check if the current password is correct
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found", res);
  }

  const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid Current Password", res);
  }

  // 4) Update the password
  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  // 5) Send back the response
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully 🎉"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // 1) Get the user from the request object
  const user = req.user;

  // 2) Send back the response
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User found successfully 🎉"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  // 1) Accept the data from the user
  const { fullName, email, username } = req.body;

  // 2) Validate the data
  if (!fullName || !email || !username) {
    throw new ApiError(400, "Please provide all the required fields", res);
  }

  // 3) Check if the user exists
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found", res);
  }

  // 4) Update the user details
  user.fullName = fullName;
  user.email = email;
  user.username = username;

  await user.save({ validateBeforeSave: false });

  // 5) Send back the response
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Account details updated successfully 🎉"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // 1) Accept the avatar from the user
  const avatarLocalPath = req.file?.avatar?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Image is Required! 🍧", res);
  }

  // 2) Upload the avatar to Cloudinary
  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath, "avatar");
    console.log("Avatar Upload Success 🎉: ", avatar);
  } catch (error) {
    throw new ApiError(500, "Failed to upload avatar to Cloudinary", res);
  }

  if (!avatar.url) {
    throw new ApiError(500, "Failed to upload image to Cloudinary", res);
  }

  // 3) Update the user avatar
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found", res);
  }

  user.avatar = avatar.url;

  await user.save({ validateBeforeSave: false });

  // 4) Send back the response
  return res
    .status(200)
    .json(new ApiResponse(200, { avatar: avatar.url }, "Avatar updated 🎉"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  // 1) Accept the cover image from the user
  const coverImageLocalPath = req.file?.coverImage?.[0]?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image is Required! 🍧", res);
  }

  // 2) Upload the cover image to Cloudinary

  let coverImage;
  try {
    coverImage = await uploadOnCloudinary(coverImageLocalPath, "coverImage");
    console.log("Cover Image Upload Success 🎉: ", coverImage);
  } catch (error) {
    throw new ApiError(500, "Failed to upload cover image to Cloudinary", res);
  }

  if (!coverImage) {
    throw new ApiError(500, "Failed to upload image to Cloudinary", res);
  }

  // 3) Update the user cover image
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found", res);
  }

  user.coverImage = coverImage.url;

  await user.save({ validateBeforeSave: false });

  // 4) Send back the response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { coverImage: coverImage.url },
        "Cover Image updated 🎉"
      )
    );
});

//! Learn Aggregation Pipeline in MongoDB

const getUserChannelProfile = asyncHandler(async (req, res) => {
  // 1) Get the username from the request params
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Please provide the username", res);
  }

  const channel = await User.aggregate([
    {
      // Pipleline 1 - Match the username
      $match: {
        username: username?.toLowerCase().trim(),
      },
    },
    {
      // Pipeline 2 - Lookup to get the subscribers
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      // Pipeline 3 - Lookup to get
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscriberedTo",
      },
    },
    {
      // Pipeline 4 - Add the subscriber count
      $addFields: {
        subscriberCount: { $size: "$subscribers" },
        channelSubscribedToCount: { $size: "$subscriberedTo" },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      // Pipeline 5 - Project only the necessary data
      $project: {
        _id: 0,
        username: 1,
        fullName: 1,
        avatar: 1,
        coverImage: 1,
        subscriberCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel not found", res);
  }

  // 2) Send back the response

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel found successfully 🎉"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  // 1) Get the watch history of the user
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          // This is a sub-pipeline
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                //  This is a another sub-pipeline
                {
                  $project: {
                    _id: 0,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
  ]);

  if (!user?.length) {
    throw new ApiError(404, "Watch History not found", res);
  }

  // 2) Send back the response
  return res
    .status(200)
    .json(
      new ApiResponse(200, user[0]?.watchHistory, "Watch History found 🎉")
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
