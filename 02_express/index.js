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

//!Get All
app.get("/teas", (req, res) => {
  res.status(200).send(babuData);
});

//!Get by ID
app.get("/teas/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const tea = babuData.find((t) => t.id === id);
  if (tea) {
    res.status(200).send(tea);
  } else {
    res.status(404).send("Not Found");
  }
});

//! Post Add New Tea
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

//! update Tea
app.put("/teas/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { name, price } = req.body;
  const tea = babuData.find((t) => t.id === id);
  if (tea) {
    tea.name = name;
    tea.price = price;
    res.status(200).send(tea);
  } else {
    res.status(404).send("Not Found");
  }
});

//! Delete Tea
app.delete("/teas/:id", (req, res) => {
  const id = parseInt(req.params.id);
  babuData = babuData.filter((t) => t.id !== id);
  res.status(204).send();
});

app.get("*", (req, res) => {
  res.send("Not Found 404");
});

app.listen(port, () => {
  console.log("Server is running on http://localhost:3000");
});
