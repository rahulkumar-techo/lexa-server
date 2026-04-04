import assert from "node:assert/strict";
import test from "node:test";
import { cleanupUserByEmail, registerAndVerifyUser } from "@/src/test/helpers";

test("preference routes require auth and allow authenticated fetch/update", async () => {
  const { app, email, verifyResponse } = await registerAndVerifyUser({
    name: "Preference Tester"
  });

  try {
    const unauthenticatedResponse = await app.inject({
      method: "GET",
      url: "/api/v1/preferences/me"
    });

    assert.equal(unauthenticatedResponse.statusCode, 401);

    const cookieHeader = verifyResponse.cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const getPreferenceResponse = await app.inject({
      method: "GET",
      url: "/api/v1/preferences/me",
      headers: {
        cookie: cookieHeader
      }
    });

    assert.equal(getPreferenceResponse.statusCode, 200);
    assert.equal(getPreferenceResponse.json().data.theme, "system");
    assert.equal(getPreferenceResponse.json().data.notifications_enabled, true);

    const updatePreferenceResponse = await app.inject({
      method: "PUT",
      url: "/api/v1/preferences/me",
      headers: {
        cookie: cookieHeader
      },
      payload: {
        theme: "dark",
        language: "en",
        notifications_enabled: false
      }
    });

    assert.equal(updatePreferenceResponse.statusCode, 200);
    assert.equal(updatePreferenceResponse.json().data.theme, "dark");
    assert.equal(updatePreferenceResponse.json().data.notifications_enabled, false);
  } finally {
    await app.close();
    await cleanupUserByEmail(email);
  }
});
