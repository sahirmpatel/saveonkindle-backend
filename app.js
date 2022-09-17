import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import { readFile, writeFile } from "fs/promises";
import axios from "axios";
import { extract } from "article-parser";
import { transporter } from "./mail.js";
const app = express();

app.get("/", async (req, res) => {
  //   const mediaUrl = req.params.url;
  //   console.log("mediaUrl", mediaUrl);

  const mediaUrl = req.query.save;
  //   const response = axios
  //     .get(mediaUrl)
  //     .then((res) => console.log("res", res.data))
  //     .then((res) => res);
  //   console.log("mediaUrl", response);

  //   const response = await axios.get(mediaUrl).then((res) => res.data);
  //   console.log("response ", response);

  //   await writeFile(new URL("./saved.html", import.meta.url), response);

  // using extraction
  const value = await expandUrlIfShortended(mediaUrl);

  parseAndSaveLink(value);
  res.send("Saved 📝🤝 ");
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`running on ${port}`));

const parseAndSaveLink = async (url) => {
  try {
    const data = await extract(url);
    // console.log("data", data, "for url", url);

    const extractedData = {
      title: data?.title,
      body: data?.content,
      author: data?.author,
      url,
    };

    // console.log("extracted", extractedData);
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
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
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
