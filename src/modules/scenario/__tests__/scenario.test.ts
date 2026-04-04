import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/src/lib/prisma";
import { cleanupUserByEmail, createTestEmail, registerAndVerifyUser } from "@/src/test/helpers";

test("scenario routes list, detail, and allow admin creation with authorization header", async () => {
  const userEmail = createTestEmail("scenario");
  const { app, verifyResponse } = await registerAndVerifyUser({
    email: userEmail,
    name: "Scenario Admin"
  });

  const seededScenario = await prisma.scenario.create({
    data: {
      title: "Restaurant Conversation",
      description: "Practice ordering food politely.",
      config: {
        goal: "Practice restaurant vocabulary",
        difficulty: "beginner"
      }
    }
  });

  try {
    await prisma.user.update({
      where: { email: userEmail },
      data: {
        role: "admin"
      }
    });

    const accessToken = verifyResponse.json().data.accessToken as string;

    const listResponse = await app.inject({
      method: "GET",
      url: "/api/v1/scenarios"
    });

    assert.equal(listResponse.statusCode, 200);
    assert.ok(Array.isArray(listResponse.json().data));
    assert.ok(listResponse.json().data.some((scenario: { id: string }) => scenario.id === seededScenario.id));

    const detailResponse = await app.inject({
      method: "GET",
      url: `/api/v1/scenarios/${seededScenario.id}`
    });

    assert.equal(detailResponse.statusCode, 200);
    assert.equal(detailResponse.json().data.id, seededScenario.id);
    assert.equal(detailResponse.json().data.title, "Restaurant Conversation");

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/v1/scenarios",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        title: "Travel Check-in",
        description: "Practice speaking at an airport check-in desk.",
        config: {
          goal: "Travel conversation",
          difficulty: "intermediate"
        }
      }
    });

    assert.equal(createResponse.statusCode, 201);
    assert.equal(createResponse.json().data.title, "Travel Check-in");
    assert.equal(createResponse.json().message, "Scenario created successfully");
  } finally {
    await prisma.scenario.deleteMany({
      where: {
        OR: [{ id: seededScenario.id }, { title: "Travel Check-in" }]
      }
    });
    await app.close();
    await cleanupUserByEmail(userEmail);
  }
});
