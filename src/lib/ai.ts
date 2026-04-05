import Groq from "groq-sdk";
import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { env } from "@/src/config";
import { prisma } from "@/src/lib/prisma";

const groq = new Groq({
  apiKey: env.groq_api_key
});

const DEFAULT_MODEL = env.GROQ_MODEL ?? "openai/gpt-oss-20b";
const DEFAULT_SCENARIO = "General conversation practice";
const IS_TEST_RUNTIME =
  env.NODE_ENV === "test" || process.argv.includes("--test");
const DEFAULT_PROFILE = {
  learningLanguage: "English",
  nativeLanguage: "English",
  level: "beginner"
} as const;

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type TutorProfile = {
  learningLanguage: string;
  nativeLanguage: string;
  level: string;
};

type TutorPreference = {
  language: string | null;
  learning_language: string | null;
  native_language: string | null;
  learning_level: string | null;
};

type GenerateAIResponseInput = {
  userId: number;
  chatId: string;
  message: string;
  scenario?: string;
  history?: ConversationMessage[];
  learningLanguage?: string;
  nativeLanguage?: string;
  level?: string;
};

type GenerateAIResponseResult = {
  reply: string;
  usage?: {
    queue_time?: number | null;
    prompt_tokens?: number;
    prompt_time?: number;
    completion_tokens?: number;
    completion_time?: number;
    total_tokens?: number;
    total_time?: number;
  };
};

const SYSTEM_PROMPT_TEMPLATE = `
You are Lexa, an intelligent multilingual language tutor.

Your job is to help users learn languages through conversation, correction, and explanation.

-----------------------------
USER CONTEXT
-----------------------------
Learning Language: {{learningLanguage}}
User Native Language: {{nativeLanguage}}
User Level: {{level}} (beginner / intermediate / advanced)

-----------------------------
YOUR RESPONSIBILITIES
-----------------------------
1. Correct the user's sentence
2. Provide the correct version
3. Explain the mistake clearly
4. Translate if needed
5. Continue the conversation naturally
6. Encourage the user

-----------------------------
RESPONSE FORMAT (STRICT)
-----------------------------
Always respond in this structured format:

Your Sentence:
<user sentence>

Corrected Sentence:
<correct sentence in learning language>

Translation:
<translation in user's native language>

Explanation:
<simple explanation in native language>

Continue:
<ask a question OR continue conversation>

-----------------------------
RULES
-----------------------------
- Keep explanations simple and beginner-friendly
- Do NOT give long paragraphs
- Always be encouraging and friendly
- Adapt difficulty based on user level
- If input is already correct, praise the user
- If user uses native language, translate + teach
- Maintain conversation flow (do not act like a robot)

-----------------------------
SCENARIO (OPTIONAL)
-----------------------------
{{scenario}}

-----------------------------
DO NOT
-----------------------------
- Do not skip correction
- Do not give only translation
- Do not ignore explanation
- Do not break format

-----------------------------
GOAL
-----------------------------
Help the user become confident in speaking and understanding the language.
`.trim();

function fillTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.split(`{{${key}}}`).join(value);
  }, template);
}

async function getTutorProfile(
  input: GenerateAIResponseInput
): Promise<TutorProfile> {
  if (input.learningLanguage && input.nativeLanguage && input.level) {
    return {
      learningLanguage: input.learningLanguage,
      nativeLanguage: input.nativeLanguage,
      level: input.level
    };
  }

  const preference = await prisma.preference.findUnique({
    where: {
      user_id: input.userId
    },
    select: {
      language: true,
      learning_language: true,
      native_language: true,
      learning_level: true
    }
  });

  return mapPreferenceToTutorProfile(preference, input);
}

function mapPreferenceToTutorProfile(
  preference: TutorPreference | null,
  input: GenerateAIResponseInput
): TutorProfile {
  return {
    learningLanguage:
      input.learningLanguage ??
      preference?.learning_language ??
      preference?.language ??
      DEFAULT_PROFILE.learningLanguage,
    nativeLanguage:
      input.nativeLanguage ??
      preference?.native_language ??
      DEFAULT_PROFILE.nativeLanguage,
    level:
      input.level ??
      preference?.learning_level ??
      DEFAULT_PROFILE.level
  };
}

function buildSystemPrompt(profile: TutorProfile, scenario?: string) {
  return fillTemplate(SYSTEM_PROMPT_TEMPLATE, {
    learningLanguage: profile.learningLanguage,
    nativeLanguage: profile.nativeLanguage,
    level: profile.level,
    scenario: scenario?.trim() || DEFAULT_SCENARIO
  });
}

function buildMessages(
  prompt: string,
  input: GenerateAIResponseInput
): ChatCompletionMessageParam[] {
  const history = input.history ?? [];

  return [
    {
      role: "system",
      content: prompt
    },
    ...history,
    {
      role: "user",
      content: input.message
    }
  ];
}

function buildMockReply(input: GenerateAIResponseInput, profile: TutorProfile) {
  return [
    "Your Sentence:",
    input.message,
    "",
    "Corrected Sentence:",
    input.message,
    "",
    "Translation:",
    `Translated to ${profile.nativeLanguage}`,
    "",
    "Explanation:",
    `Simple ${profile.level} explanation in ${profile.nativeLanguage}`,
    "",
    "Continue:",
    `Can you say another sentence in ${profile.learningLanguage}?`
  ].join("\n");
}

export async function generateAIResponse(
  input: GenerateAIResponseInput
): Promise<GenerateAIResponseResult> {
  try {
    const profile = await getTutorProfile(input);
    const systemPrompt = buildSystemPrompt(profile, input.scenario);
    const messages = buildMessages(systemPrompt, input);

    if (IS_TEST_RUNTIME) {
      return {
        reply: buildMockReply(input, profile),
        usage: {
          prompt_tokens: messages.length * 10,
          completion_tokens: 60,
          total_tokens: messages.length * 10 + 60
        }
      };
    }

    const response = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 500
    });

    return {
      reply: response.choices[0]?.message?.content ?? "",
      usage: "usage" in response ? response.usage : undefined
    };
  } catch (error) {
    console.error("AI generation failed:", error);
    throw new Error("AI generation failed");
  }
}

export { buildSystemPrompt };
export type {
  ConversationMessage,
  GenerateAIResponseInput,
  GenerateAIResponseResult,
  TutorProfile
};
