import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import { expandUrlIfShortended, parseAndSaveLink } from "./utils.js";
import cors from "cors";

const app = express();

// middleware to handle forms
app.use(express.json());
app.use(cors());

// routes
app.get("/", async (req, res) => {
  res.send(` <p>   Enter the link 🚢 </p> -
  <form action="/generate" method="post">
  <input type="text" name="save" placeholder="article link" >
  <button type="submit">Save</button>
  </form>
`);
});

app.post("/generate", async (req, res) => {
  const mediaUrl = req.body.save;
  console.log("mediaUrl:", mediaUrl);
  const value = await expandUrlIfShortended(mediaUrl);
  parseAndSaveLink(value, res);
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`running on ${port}`));
