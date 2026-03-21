import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.post("/agents/optimize-prompt", async (req, res) => {
  try {
    const body = req.body;
    if (!body?.currentPrompt || typeof body.currentPrompt !== "string" || !body.currentPrompt.trim()) {
      return res.status(400).json({ error: "currentPrompt is required" });
    }

    const toolsList = body.tools?.length
      ? `\nAvailable tools: ${body.tools.join(", ")}`
      : "";
    const goalInfo = body.agentGoal
      ? `\nAgent goal: ${body.agentGoal}`
      : "";
    const nameInfo = body.agentName
      ? `\nAgent name: ${body.agentName}`
      : "";
    const modelInfo = body.provider && body.model
      ? `\nTarget model: ${body.provider} ${body.model}`
      : "";

    const systemMessage = `You are an expert prompt engineer specializing in AI agent system prompts. Your task is to take a user's draft system prompt and transform it into a highly effective, production-quality system prompt.

Follow these best practices:
1. Start with a clear role definition ("You are...")
2. Define the agent's expertise, personality, and communication style
3. Specify output format expectations and quality standards
4. Include relevant constraints and boundaries
5. Add step-by-step reasoning instructions where appropriate
6. Include error handling guidance (what to do when uncertain)
7. If tools are available, include guidance on when/how to use them
8. Keep the prompt focused and avoid contradictory instructions

Return ONLY the optimized system prompt text. Do not include any explanation, preamble, or meta-commentary. Do not wrap in quotes or markdown code blocks.`;

    const userMessage = `Optimize this system prompt for an AI agent:
${nameInfo}${goalInfo}${toolsList}${modelInfo}

Current prompt:
"""
${body.currentPrompt}
"""

Generate an improved, production-quality version of this system prompt that will make the agent more effective, reliable, and well-behaved.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const optimizedPrompt = completion.choices[0]?.message?.content?.trim();
    if (!optimizedPrompt) {
      return res.status(500).json({ error: "Failed to generate optimized prompt" });
    }

    res.json({
      optimizedPrompt,
      original: body.currentPrompt,
      tokensUsed: completion.usage?.total_tokens ?? 0,
    });
  } catch (error: any) {
    console.error("Prompt optimization error:", error);
    res.status(500).json({ error: error.message || "Failed to optimize prompt" });
  }
});

router.post("/agents/suggest-names", async (req, res) => {
  try {
    const { role, goal, provider, tools } = req.body || {};

    const context = [
      role ? `Role/Prompt: ${role}` : "",
      goal ? `Goal: ${goal}` : "",
      provider ? `Provider: ${provider}` : "",
      tools?.length ? `Tools: ${tools.join(", ")}` : "",
    ].filter(Boolean).join("\n");

    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content: "You are a creative naming assistant. Generate 5 short, catchy agent names. Each name should be 1-3 words, professional but memorable. Return ONLY a JSON array of strings, nothing else.",
        },
        {
          role: "user",
          content: context.trim()
            ? `Suggest 5 names for an AI agent with these details:\n${context}`
            : "Suggest 5 creative names for a general-purpose AI agent.",
        },
      ],
    });

    const raw = result.choices[0]?.message?.content?.trim() || "[]";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    const names: string[] = JSON.parse(cleaned);

    res.json({
      names: names.slice(0, 5),
      tokensUsed: result.usage?.total_tokens || 0,
    });
  } catch (error: any) {
    console.error("Name suggestion error:", error);
    res.status(500).json({ error: error.message || "Failed to suggest names" });
  }
});

export default router;
