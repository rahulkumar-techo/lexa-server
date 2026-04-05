import nodemailer, { type Transporter } from "nodemailer";

type EmailAddress = {
  email: string;
  name?: string;
};

type SentEmail = {
  to: EmailAddress[];
  from: EmailAddress;
  subject: string;
  html: string;
  text: string;
};

type SentEmailRecord = {
  email: SentEmail;
  result: {
    success: boolean;
    messageId?: string;
    provider: string;
    timestamp: Date;
  };
};

type VerificationPayload = {
  to: EmailAddress | EmailAddress[];
  user: {
    firstName: string;
    email: string;
  };
  verificationUrl: string;
  otp?: string;
};

type ForgotPasswordPayload = {
  to: EmailAddress | EmailAddress[];
  user: {
    firstName: string;
    email: string;
  };
  resetUrl: string;
  requestedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
};

type ResetPasswordConfirmPayload = {
  to: EmailAddress | EmailAddress[];
  user: {
    firstName: string;
    email: string;
  };
  changedAt?: Date;
  ipAddress?: string;
  deviceInfo?: string;
};

type MailServiceOptions = {
  appName: string;
  appUrl: string;
  from: EmailAddress;
  transporter: Transporter;
  providerName: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

const normalizeRecipients = (value: EmailAddress | EmailAddress[]) =>
  Array.isArray(value) ? value : [value];

const formatAddress = (value: EmailAddress) =>
  value.name ? `"${value.name}" <${value.email}>` : value.email;

const formatDate = (value?: Date) => (value ? value.toISOString() : undefined);

export class EmailService {
  private readonly sentEmails: SentEmailRecord[] = [];

  constructor(private readonly options: MailServiceOptions) {}

  getProviderName() {
    return this.options.providerName;
  }

  getSentEmails() {
    return [...this.sentEmails];
  }

  clear() {
    this.sentEmails.length = 0;
  }

  private async sendEmail(email: SentEmail) {
    const info = await this.options.transporter.sendMail({
      from: formatAddress(email.from),
      to: email.to.map(formatAddress).join(", "),
      subject: email.subject,
      html: email.html,
      text: email.text
    });

    const result = {
      success: true,
      messageId: info.messageId,
      provider: this.options.providerName,
      timestamp: new Date()
    };

    this.sentEmails.push({ email, result });

    return result;
  }

  async sendVerification(payload: VerificationPayload) {
    const name = firstName(payload.user.firstName);
    const subject = `Verify your email address - ${this.options.appName}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827;">
        <h1 style="margin:0 0 16px;">Verify your email</h1>
        <p>Hi ${escapeHtml(name)}, thanks for signing up to ${escapeHtml(this.options.appName)}.</p>
        ${
          payload.otp
            ? `<p style="font-size:24px;font-weight:700;letter-spacing:6px;margin:24px 0;">${escapeHtml(payload.otp)}</p>`
            : ""
        }
        <p><a href="${payload.verificationUrl}">Verify Email Address</a></p>
        <p>If the button does not work, use this link:</p>
        <p>${escapeHtml(payload.verificationUrl)}</p>
      </div>
    `;
    const text = [
      `Hi ${name}, please verify your email address.`,
      payload.otp ? `Verification code: ${payload.otp}` : "",
      `Verification link: ${payload.verificationUrl}`,
      "If you did not sign up, you can ignore this email."
    ]
      .filter(Boolean)
      .join("\n");

    return this.sendEmail({
      to: normalizeRecipients(payload.to),
      from: this.options.from,
      subject,
      html,
      text
    });
  }

  async sendForgotPassword(payload: ForgotPasswordPayload) {
    const name = firstName(payload.user.firstName);
    const details = [
      formatDate(payload.requestedAt) ? `Requested at: ${formatDate(payload.requestedAt)}` : "",
      payload.ipAddress ? `IP address: ${payload.ipAddress}` : "",
      payload.userAgent ? `Device: ${payload.userAgent}` : ""
    ]
      .filter(Boolean)
      .join("\n");
    const subject = `Reset your ${this.options.appName} password`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827;">
        <h1 style="margin:0 0 16px;">Reset your password</h1>
        <p>Hi ${escapeHtml(name)}, we received a request to reset your password.</p>
        <p><a href="${payload.resetUrl}">Reset My Password</a></p>
        <p>If the button does not work, use this link:</p>
        <p>${escapeHtml(payload.resetUrl)}</p>
        ${
          details
            ? `<pre style="white-space:pre-wrap;background:#f3f4f6;padding:12px;border-radius:8px;">${escapeHtml(details)}</pre>`
            : ""
        }
      </div>
    `;
    const text = [
      `Hi ${name}, you requested a password reset for your ${this.options.appName} account.`,
      `Reset link: ${payload.resetUrl}`,
      details,
      "If you did not request this, ignore this email."
    ]
      .filter(Boolean)
      .join("\n");

    return this.sendEmail({
      to: normalizeRecipients(payload.to),
      from: this.options.from,
      subject,
      html,
      text
    });
  }

  async sendResetPasswordConfirm(payload: ResetPasswordConfirmPayload) {
    const name = firstName(payload.user.firstName);
    const details = [
      formatDate(payload.changedAt) ? `Changed at: ${formatDate(payload.changedAt)}` : "",
      payload.ipAddress ? `IP address: ${payload.ipAddress}` : "",
      payload.deviceInfo ? `Device: ${payload.deviceInfo}` : ""
    ]
      .filter(Boolean)
      .join("\n");
    const subject = `Your ${this.options.appName} password has been changed`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827;">
        <h1 style="margin:0 0 16px;">Password changed</h1>
        <p>Hi ${escapeHtml(name)}, the password for ${escapeHtml(payload.user.email)} has been updated.</p>
        ${
          details
            ? `<pre style="white-space:pre-wrap;background:#f3f4f6;padding:12px;border-radius:8px;">${escapeHtml(details)}</pre>`
            : ""
        }
        <p>If this was not you, review your account immediately: ${escapeHtml(this.options.appUrl)}</p>
      </div>
    `;
    const text = [
      `Hi ${name}, your ${this.options.appName} password has been changed.`,
      details,
      `If this was not you, review your account immediately: ${this.options.appUrl}`
    ]
      .filter(Boolean)
      .join("\n");

    return this.sendEmail({
      to: normalizeRecipients(payload.to),
      from: this.options.from,
      subject,
      html,
      text
    });
  }
}
