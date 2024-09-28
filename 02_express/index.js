import express from "express";

const app = express();
const port = 3000 || process.env.PORT;

// Middleware in Express
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/babu", (req, res) => {
  res.send("Hello Babu Boi");
});

app.get("*", (req, res) => {
  res.send("Not Found 404");
});

app.listen(port, () => {
  console.log("Server is running on http://localhost:3000");
});
