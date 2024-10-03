import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const registerUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, "OK", "API is up and running 🚀"));
});




export { registerUser };