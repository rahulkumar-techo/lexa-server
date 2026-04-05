# Lexa Server

Fastify + Prisma backend for Lexa.

## Setup

Add these mail variables to `.env`:

```env
BREVO_LOGIN="your-brevo-sender@example.com"
BREVO_API_KEY="your-brevo-api-key"
```

Optional:

```env
APP_NAME="Lexa"
PORT=5000
NODE_ENV="development"
```

`BREVO_LOGIN` is used as the sender email for auth mails.

## Auth Mail Flow

The auth module now sends email for:

- registration verification
- OTP verification support
- forgot password
- reset password confirmation

Endpoints:

- `POST /api/v1/auth/register`
- `GET /api/v1/auth/verify`
- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

Notes:

- In `test` mode, email uses an in-memory console provider instead of Brevo.
- `register` still returns `verificationToken` and `verificationLink` to keep local development and automated tests simple.
- Password reset tokens expire after 15 minutes.
- Reset tokens become invalid after a password change because the current password hash is part of the signed token payload.

## Run

```bash
pnpm install
pnpm prisma:generate
pnpm dev
```

## Test

```bash
pnpm test
```
