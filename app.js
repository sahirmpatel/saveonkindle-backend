import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import { readFile, writeFile } from "fs/promises";
import axios from "axios";
import { extract } from "article-parser";
import { transporter } from "./mail.js";
const app = express();

// middleware to handle forms
app.use(express.urlencoded({ extended: true }));
// app.use(complete);

app.get("/", async (req, res) => {
  //   const mediaUrl = req.params.url;

  // using extraction
  // const value = await expandUrlIfShortended(mediaUrl);

  // parseAndSaveLink(value);
  res.send(` <p>   Enter the link 🚢 </p> - 
  <form action="/generate" method="post">
  <input type="text" name="save" placeholder="article link" >
  <button type="submit">Save</button>
  </form>

`);
});

app.post("/generate", async (req, res) => {
  const mediaUrl = req.body.save;
  console.log("mediaUrl", mediaUrl);

  const value = await expandUrlIfShortended(mediaUrl);

  parseAndSaveLink(value, res);
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`running on ${port}`));

const parseAndSaveLink = async (url, res) => {
  try {
    const data = await extract(url);

    const extractedData = {
      title: data?.title,
      body: data?.content,
      author: data?.author,
      url,
    };

    let template = await readFile(
      new URL("./template.html", import.meta.url),
      "utf-8"
    );

    for (const [key, val] of Object.entries(extractedData)) {
      template = template.replace(`{${key}}`, val);
    }

    await writeFile(
      new URL(`./saved_files/${data?.title || "index"}.html`, import.meta.url),
      template
    );

    // email section
    const mailOptions = {
      from: process.env.EMAIL_ID,
      to: [process.env.EMAIL_RECEIPEINT_1, "sahirmpatel_vg1ri2@kindle.com"],
      subject: `"Saved To Kindle 🚢 - ${data?.title}`,
      text: `Link saved from ${url}`,
      attachments: [
        {
          // filename and content type is derived from path
          path: `./saved_files/${data?.title || "index"}.html`,
        },
      ],
      tls: {
        rejectUnauthorized: false,
      },
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
        res.send(`
        Done ! Check your Kindle 📓 
  `);
      }
    });
  } catch (e) {
    console.log("An Error Occuered while extracing - ", e);
  }
};

const expandUrlIfShortended = async (uri) => {
  try {
    const response = await axios({
      method: "get",
      url: uri,
      // followRedirect: false,
    });

    const resurl = await response?.request?.res?.responseUrl;
    return resurl !== uri ? resurl : uri;
  } catch (e) {
    console.log("error", e);
    return uri;
  }
};
