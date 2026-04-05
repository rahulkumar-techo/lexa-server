import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "@/src/app";
import {
  cleanupUserByEmail,
  createTestEmail,
  extractFirstUrl,
  getLatestSentEmail,
  registerAndVerifyUser
} from "@/src/test/helpers";
import { prisma } from "@/src/lib/prisma";
import { testMailProvider } from "@/src/modules/mails/mail.service";

test("auth flow registers, verifies, logs in, refreshes, and logs out", async () => {
  const { app, email, password, registerResponse, verifyResponse } =
    await registerAndVerifyUser({
      name: "Auth Tester"
    });

  try {
    assert.equal(registerResponse.statusCode, 201);
    assert.equal(registerResponse.json().data.mailProvider, "console");
    assert.equal(verifyResponse.statusCode, 200);

    const verificationEmail = getLatestSentEmail(email);
    assert.match(verificationEmail.email.subject, /Verify your email address/i);
    assert.match(verificationEmail.email.text, /\b\d{6}\b/);

    const verifyBody = verifyResponse.json();
    assert.equal(verifyBody.success, true);
    assert.equal(verifyBody.data.user.isVerified, true);

    const loginResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email,
        password
      }
    });

    assert.equal(loginResponse.statusCode, 200);

    const loginBody = loginResponse.json();
    assert.equal(loginBody.success, true);
    assert.ok(loginBody.data.accessToken);
    assert.ok(loginBody.data.refreshToken);

    const cookieHeader = loginResponse.cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const refreshResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      headers: {
        cookie: cookieHeader
      }
    });

    assert.equal(refreshResponse.statusCode, 200);
    assert.equal(refreshResponse.json().message, "Session refreshed successfully");
    assert.deepEqual(
      refreshResponse.cookies.map((cookie) => cookie.name).sort(),
      ["accessToken", "refreshToken"]
    );

    const logoutResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers: {
        cookie: cookieHeader
      }
    });

    assert.equal(logoutResponse.statusCode, 200);
    assert.equal(logoutResponse.json().message, "Logout successful");
    assert.equal(logoutResponse.cookies.every((cookie) => cookie.value === ""), true);
  } finally {
    await app.close();
    await cleanupUserByEmail(email);
  }
});

test("verify-otp accepts the mailed OTP and signs the user in", async () => {
  const { app, email, verifyResponse } = await registerAndVerifyUser({
    name: "OTP Tester",
    useOtp: true
  });

  try {
    assert.equal(verifyResponse.statusCode, 200);
    assert.equal(verifyResponse.json().data.user.email, email);
    assert.equal(verifyResponse.json().data.user.isVerified, true);
  } finally {
    await app.close();
    await cleanupUserByEmail(email);
  }
});

test("forgot-password sends reset email and reset-password updates the password", async () => {
  const { app, email, password } = await registerAndVerifyUser({
    name: "Reset Tester"
  });
  const nextPassword = "newSecret123";

  try {
    testMailProvider.clear();

    const forgotResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/forgot-password",
      payload: {
        email
      }
    });

    assert.equal(forgotResponse.statusCode, 200);
    assert.equal(
      forgotResponse.json().message,
      "If the account exists, a password reset email has been sent."
    );

    const forgotEmail = getLatestSentEmail(email);
    assert.match(forgotEmail.email.subject, /Reset your Lexa password/i);
    const resetToken = new URL(extractFirstUrl(forgotEmail.email.text)).searchParams.get("token");

    assert.ok(resetToken);

    const resetResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/reset-password",
      payload: {
        token: resetToken,
        password: nextPassword
      }
    });

    assert.equal(resetResponse.statusCode, 200);
    assert.equal(resetResponse.json().message, "Password reset successful");

    const confirmationEmail = getLatestSentEmail(email);
    assert.match(confirmationEmail.email.subject, /password has been changed/i);

    const oldPasswordLogin = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email,
        password
      }
    });

    assert.equal(oldPasswordLogin.statusCode, 401);

    const newPasswordLogin = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email,
        password: nextPassword
      }
    });

    assert.equal(newPasswordLogin.statusCode, 200);
  } finally {
    await app.close();
    await cleanupUserByEmail(email);
  }
});

test("authenticate guard allows protected access and rotates cookies from refresh token", async () => {
  const { app, email, verifyResponse } = await registerAndVerifyUser({
    name: "Auth Guard Tester"
  });

  try {
    const refreshCookie = verifyResponse.cookies.find(
      (cookie) => cookie.name === "refreshToken"
    );

    assert.ok(refreshCookie);

    const meResponse = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: {
        cookie: `refreshToken=${refreshCookie.value}`
      }
    });

    assert.equal(meResponse.statusCode, 200);
    assert.equal(meResponse.json().success, true);
    assert.equal(meResponse.json().data.email, email);
    assert.deepEqual(
      meResponse.cookies.map((cookie) => cookie.name).sort(),
      ["accessToken", "refreshToken"]
    );
  } finally {
    await app.close();
    await cleanupUserByEmail(email);
  }
});

test('authorize(["admin"]) forbids normal users and allows admins', async () => {
  const { app, email, verifyResponse } = await registerAndVerifyUser({
    name: "Admin Guard Tester"
  });

  try {
    const cookieHeader = verifyResponse.cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const forbiddenResponse = await app.inject({
      method: "GET",
      url: "/api/v1/auth/admin",
      headers: {
        cookie: cookieHeader
      }
    });

    assert.equal(forbiddenResponse.statusCode, 403);
    assert.equal(forbiddenResponse.json().message, "Forbidden");

    await prisma.user.update({
      where: {
        email
      },
      data: {
        role: "admin"
      }
    });

    const allowedResponse = await app.inject({
      method: "GET",
      url: "/api/v1/auth/admin",
      headers: {
        cookie: cookieHeader
      }
    });

    assert.equal(allowedResponse.statusCode, 200);
    assert.equal(allowedResponse.json().success, true);
    assert.equal(allowedResponse.json().data.access, "admin");
    assert.equal(allowedResponse.json().data.user.role, "admin");
  } finally {
    await app.close();
    await cleanupUserByEmail(email);
  }
});

test("forgot-password stays generic for unknown emails", async () => {
  const server = await buildApp();
  const email = createTestEmail("missing");

  try {
    const response = await server.inject({
      method: "POST",
      url: "/api/v1/auth/forgot-password",
      payload: {
        email
      }
    });

    assert.equal(response.statusCode, 200);
    assert.equal(
      response.json().message,
      "If the account exists, a password reset email has been sent."
    );
  } finally {
    await server.close();
  }
});
