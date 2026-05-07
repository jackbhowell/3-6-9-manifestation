import { Router, type Request } from "express";
import OpenAI from "openai";

const aiRouter = Router();

// --- simple in-memory rate limiter (10 req/min per IP) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_PER_MINUTE = 10;

function checkRateLimit(req: Request): boolean {
  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
    ?? req.socket.remoteAddress
    ?? "unknown";
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= MAX_PER_MINUTE) return false;
  entry.count += 1;
  return true;
}

// --- lazy OpenAI client (no startup crash if env vars are absent) ---
function getOpenAIClient(): OpenAI | null {
  const baseURL = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  if (!baseURL || !apiKey) return null;
  return new OpenAI({ apiKey, baseURL });
}

aiRouter.post("/ai/affirmation-ideas", async (req, res) => {
  if (!checkRateLimit(req)) {
    res.status(429).json({ error: "Too many requests — please wait a moment" });
    return;
  }

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
Generate exactly 5 present-tense affirmations suited for the ${sessionLabel} session.

Structure them in this exact order:
1. LITERAL — name the intention directly and specifically (e.g. if intention is "UFO encounter", write exactly about having a UFO encounter)
2. LITERAL — another very specific, direct affirmation naming the intention almost word-for-word, from a slightly different angle (e.g. the feeling or safety of that specific experience)
3. EXPANSIVE — broader, more open affirmation about the feeling or energy behind the intention
4. EXPANSIVE — another expansive affirmation about openness, readiness, or gratitude
5. EXPANSIVE — a third expansive affirmation about the person's overall alignment or vibration

Rules for all 5:
- Start each with "I am", "I have", "I feel", or similar present-tense language
- Make them emotionally resonant and vivid
- Keep each under 14 words
- Do NOT number them
- Return ONLY the 5 affirmations, one per line, no extra text or explanation`,
        },
        {
          role: "user",
          content: `${intentionText}\n\nGenerate 5 affirmations for my ${sessionLabel} session. Remember: the first 2 must directly and literally name the intention.`,
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
