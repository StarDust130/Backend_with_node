import express from "express";

const app = express();
const port = 3000 || process.env.PORT;

// Middleware in Express
app.use(express.json());

let babuData = [];
let nextId = 1;

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/teas", (req, res) => {
  const { name, price } = req.body;
  const newTea = {
    id: nextId++,
    name,
    price,
  };
  babuData.push(newTea);
  res.status(201).send(newTea);
});

app.get("*", (req, res) => {
  res.send("Not Found 404");
});

app.listen(port, () => {
  console.log("Server is running on http://localhost:3000");
});
