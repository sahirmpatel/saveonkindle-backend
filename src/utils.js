import fs from "fs";
import axios from "axios";
import { extract } from "article-parser";
import { readFile, writeFile } from "fs/promises";
import { Parser } from "htmlparser2";
import ImageDataURI from "image-data-uri";
import { transporter } from "./mail.js";
export const saveDirectoryUtil = () => {
  fs.access("../saved_files", (error) => {
    if (error) {
      console.log("err");
    } else {
      console.log("cool");
    }
  });
};

export const expandUrlIfShortended = async (uri) => {
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

export const parseAndSaveLink = async (url, res) => {
  try {
    const data = await extract(url);
    //datauri playground
    const imagesurls = [];
    const parser = new Parser({
      onopentag: function (name, attribs) {
        if (name === "img") {
          // console.log("JS! Hooray!", attribs.src)
          imagesurls.push(attribs.src);
        }
      },
    });

    parser.write(data?.content);
    parser.end();

    // console.log("imagesurlsArray:", imagesurls);
    // await toDataURi(imagesurls[0]);

    const result = await Promise.allSettled(
      imagesurls.map((url) => ImageDataURI.encodeFromURL(url))
    );
    // console.log("result:", result);

    const dataUrlArray = result.map((res) => res.value);

    let contentBodyWithDataUrl = data?.content;
    dataUrlArray.forEach((dataurival, i) => {
      if (imagesurls?.[i]) {
        console.log("replaced");

        console.log("imagesurls[i]:", imagesurls[i]);
        console.log("dataurival:", dataurival);
        contentBodyWithDataUrl = contentBodyWithDataUrl.replace(
          imagesurls[i],
          dataurival
        );
      }
    });
    //

    const extractedData = {
      title: data?.title,
      body: contentBodyWithDataUrl,
      author: data?.author,
      url,
    };

    let template = await readFile(
      new URL("../public/template.html", import.meta.url),
      "utf-8"
    );

    for (const [key, val] of Object.entries(extractedData)) {
      template = template.replace(`{${key}}`, val);
    }

    const fileurl = new URL(
      `../saved_files/${data?.title || "index"}.html`,
      import.meta.url
    );

    await writeFile(fileurl, template);

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

    console.log("mailOptions:", mailOptions);
    res.sendStatus(200);
    // paused for spam
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
    res.sendStatus(500);
    console.log("An Error Occured while extracing - ", e);
  }
};
