import { Router } from "express";
import OpenAI from "openai";

const aiRouter = Router();

function getOpenAIClient(): OpenAI | null {
  const baseURL = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  if (!baseURL || !apiKey) return null;
  return new OpenAI({ apiKey, baseURL });
}

aiRouter.post("/ai/affirmation-ideas", async (req, res) => {
  const client = getOpenAIClient();
  if (!client) {
    res.status(503).json({ error: "AI integration not configured on this server" });
    return;
  }

  const { intention, session } = req.body as {
    intention?: string;
    session?: string;
  };

  const sessionContext: Record<string, string> = {
    morning:   "morning (awakening energy, setting intentions for the day)",
    afternoon: "afternoon (midday alignment, building momentum)",
    evening:   "evening (reflection, gratitude, releasing the day)",
  };

  const sessionLabel = sessionContext[session ?? ""] ?? "daily";

  const intentionText = intention?.trim()
    ? `The user's manifestation intention is: "${intention}"`
    : "The user has not yet set a specific intention — generate general positive affirmations.";

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content: `You are a manifestation coach helping a user write powerful affirmations using the 3-6-9 method.
Generate 5 short, present-tense affirmations suited for the ${sessionLabel} session.
Rules:
- Start each with "I am", "I have", "I feel", or similar present-tense language
- Make them personal, vivid, and emotionally resonant
- Keep each under 12 words
- Do NOT number them
- Return ONLY the 5 affirmations, one per line, no extra text or explanation`,
        },
        {
          role: "user",
          content: `${intentionText}\n\nGenerate 5 affirmations for my ${sessionLabel} session.`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";
    const ideas = text
      .split("\n")
      .map((l) => l.trim().replace(/^[-*•\d.]+\s*/, ""))
      .filter((l) => l.length > 0)
      .slice(0, 5);

    res.json({ ideas });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate ideas";
    res.status(500).json({ error: message });
  }
});

export default aiRouter;
