import nodemailer from "nodemailer";
import { env } from "@/src/config/env";
import { EmailService } from "./email.service";

const isTestRuntime =
  env.NODE_ENV === "test" ||
  process.argv.includes("--test") ||
  process.argv.some((arg) => arg.includes(".test.")) ||
  process.env.npm_lifecycle_event === "test";

const transporter = isTestRuntime
  ? nodemailer.createTransport({
      jsonTransport: true
    })
  : nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.NODEMAILER_EMAIL,
        pass: env.APP_PASSWORD
      }
    });

export const mailService = new EmailService({
  appName: env.APP_NAME,
  appUrl: env.APP_URL,
  from: {
    email: env.NODEMAILER_EMAIL ?? "no-reply@example.com",
    name: env.APP_NAME
  },
  transporter,
  providerName: isTestRuntime ? "console" : "nodemailer"
});

export const testMailProvider = mailService;
