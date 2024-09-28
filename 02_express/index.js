import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/babu", (req, res) => {
  res.send("Hello Babu Boi");
});

app.get("*", (req, res) => {
  res.send("Not Found 404");
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
