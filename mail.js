import * as dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "Outlook365",
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_PWD,
  },
});
