import "dotenv/config";
import express from "express";
import logger from "./logger.js";
import morgan from "morgan";

const app = express();
const port = process.env.PORT || 5000;

// Middleware in Express
app.use(express.json());

const morganFormat = ":method :url :status :response-time ms";

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

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
  logger.info("Adding new tea");
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
  babuData = babuData.findIndex((t) => t.id === id);
  if (teaIndex !== -1) {
    babuData.splice(teaIndex, 1);
  }
  res.status(204).send();
});

app.get("*", (req, res) => {
  res.send("Not Found 404");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
