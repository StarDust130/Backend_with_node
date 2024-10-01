import express from "express";
import cors from "cors";

const app = express();

//! Common Middleware

//? Allow CORS for all routes in the app
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//? We can accept JSON in the body of the request
app.use(express.json({ limit: "16kb" }));

//? Allow URL encoded data in the body of the request
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//? Serve static files from the public directory
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Hello World");
});

export { app };
