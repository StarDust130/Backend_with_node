import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // coludinary url
      required: true,
    },
    coverImage: {
      type: String, // coludinary url
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

//! Hash the password before saving the user
userSchema.pre("save", async function (next) {
  if (!this.modified("password")) next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//! Compare the password with the hashed password
// this is we created to check the password is correct or not
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  // short lived acess token
  return jwt.sign(
    {
      _id: this._id, // data to be stored in the token
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET, // secret key
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY, //Expires in 15 minutes
    }
  );
};

export const User = mongoose.model("User", userSchema);
