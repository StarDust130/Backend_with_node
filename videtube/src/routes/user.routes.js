import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();

router.route("/register").post(
  upload.fields(
    {
      name: "avatar", //! this is user avatar field name in the form
      maxCount: 1,
    },
    {
      name: "coverImage", //! this is user coverImage field name in the form
      maxCount: 1,
    }
  ),
  registerUser
);

export default router;
