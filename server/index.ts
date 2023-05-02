import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";

const PORT = process.env.PORT || 3001;

const app = express();

/* CONFIGURATIONS */
/* const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.resolve(__dirname, "../client/build"))); */
const __file = path.resolve(process.cwd(), process.argv[1]);
const __directory = path.dirname(__file);
app.use(express.static(path.resolve(__directory, "../client/build")));

dotenv.config();

app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb" }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

import { testFn } from "./functions/web3/test";
testFn();

/* MONGOOSE SETUP */
mongoose
  .connect(process.env.mongoDB!)
  .then(() => {
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "MongoDB connection error:"));
    console.log(mongoose.connection.readyState);
  })
  .catch((error) => console.log(`${error} did not connect`));

