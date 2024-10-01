import dotenv from "dotenv";
import { app } from "./app.js"; 

dotenv.config({
    path: "./.env",
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
