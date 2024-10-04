import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  // 1) Get the token from the request
  const token = req.header("Authorization")?.replace("Bearer ", "");

  // 2) Check if the token exists
  if (!token) {
    throw new ApiError(401, "Unauthorized");
  }

  // 3) Verify the token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 4) Check if the user exists
  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 5) Attach the user to the request object
  req.user = user;

  next();
});
