import assert from "node:assert/strict";
import test from "node:test";
import { cleanupUserByEmail, registerAndVerifyUser } from "@/src/test/helpers";
import { prisma } from "@/src/lib/prisma";

test("auth flow registers, verifies, logs in, refreshes, and logs out", async () => {
  const { app, email, password, registerResponse, verifyResponse } =
    await registerAndVerifyUser({
      name: "Auth Tester"
    });

  try {
    assert.equal(registerResponse.statusCode, 201);
    assert.equal(verifyResponse.statusCode, 200);

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
