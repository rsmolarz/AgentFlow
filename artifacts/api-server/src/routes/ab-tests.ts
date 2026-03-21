import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { abTestsTable, abTestResultsTable, agentsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.get("/ab-tests", async (_req, res) => {
  try {
    const tests = await db
      .select()
      .from(abTestsTable)
      .orderBy(desc(abTestsTable.createdAt));
    res.json(tests);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/ab-tests/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [test] = await db.select().from(abTestsTable).where(eq(abTestsTable.id, id));
    if (!test) return res.status(404).json({ error: "A/B test not found" });

    const results = await db
      .select()
      .from(abTestResultsTable)
      .where(eq(abTestResultsTable.testId, id))
      .orderBy(desc(abTestResultsTable.createdAt));

    const [agentA] = await db.select().from(agentsTable).where(eq(agentsTable.id, test.agentAId));
    const [agentB] = await db.select().from(agentsTable).where(eq(agentsTable.id, test.agentBId));

    res.json({ ...test, results, agentA, agentB });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/ab-tests", async (req, res) => {
  try {
    const { name, description, agentAId, agentBId, testPrompts } = req.body;
    if (!name || !agentAId || !agentBId) {
      return res.status(400).json({ error: "name, agentAId, and agentBId are required" });
    }
    if (agentAId === agentBId) {
      return res.status(400).json({ error: "Agent A and Agent B must be different" });
    }

    const [test] = await db.insert(abTestsTable).values({
      name,
      description: description || "",
      agentAId: Number(agentAId),
      agentBId: Number(agentBId),
      testPrompts: testPrompts || [],
      status: "draft",
    }).returning();

    res.status(201).json(test);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/ab-tests/:id/run", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [test] = await db.select().from(abTestsTable).where(eq(abTestsTable.id, id));
    if (!test) return res.status(404).json({ error: "A/B test not found" });

    if (test.status === "running") {
      return res.status(409).json({ error: "Test is already running" });
    }

    const [agentA] = await db.select().from(agentsTable).where(eq(agentsTable.id, test.agentAId));
    const [agentB] = await db.select().from(agentsTable).where(eq(agentsTable.id, test.agentBId));
    if (!agentA || !agentB) return res.status(404).json({ error: "One or both agents not found" });

    const prompts = (test.testPrompts && test.testPrompts.length > 0)
      ? test.testPrompts.slice(0, 10)
      : ["Explain your role and capabilities in detail."];

    await db.update(abTestsTable)
      .set({ status: "running", updatedAt: new Date() })
      .where(eq(abTestsTable.id, id));

    const results = [];

    for (const prompt of prompts) {
      const startA = Date.now();
      let responseA = "";
      let tokensA = 0;
      try {
        const completionA = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: agentA.systemPrompt || `You are ${agentA.name}, a ${agentA.role}. ${agentA.goal}` },
            { role: "user", content: prompt },
          ],
          temperature: agentA.temperature ?? 0.7,
          max_tokens: Math.min(agentA.maxTokens ?? 2048, 2048),
        });
        responseA = completionA.choices[0]?.message?.content?.trim() || "(no response)";
        tokensA = completionA.usage?.total_tokens ?? 0;
      } catch (e: any) {
        responseA = `Error: ${e.message}`;
      }
      const durationA = (Date.now() - startA) / 1000;

      const startB = Date.now();
      let responseB = "";
      let tokensB = 0;
      try {
        const completionB = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: agentB.systemPrompt || `You are ${agentB.name}, a ${agentB.role}. ${agentB.goal}` },
            { role: "user", content: prompt },
          ],
          temperature: agentB.temperature ?? 0.7,
          max_tokens: Math.min(agentB.maxTokens ?? 2048, 2048),
        });
        responseB = completionB.choices[0]?.message?.content?.trim() || "(no response)";
        tokensB = completionB.usage?.total_tokens ?? 0;
      } catch (e: any) {
        responseB = `Error: ${e.message}`;
      }
      const durationB = (Date.now() - startB) / 1000;

      const costPerToken = 0.00003;
      const costA = Math.round(tokensA * costPerToken * 10000) / 10000;
      const costB = Math.round(tokensB * costPerToken * 10000) / 10000;

      let scores;
      let winner = "";
      try {
        const judgeCompletion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an impartial AI response quality judge. Given a prompt and two responses (A and B), rate each on these dimensions (1-10 scale):
- relevance: How well does it address the prompt?
- coherence: Is the response well-structured and logical?
- helpfulness: How useful and actionable is the response?
- overall: Overall quality score

Respond ONLY with valid JSON in this exact format:
{"agentA":{"relevance":N,"coherence":N,"helpfulness":N,"overall":N},"agentB":{"relevance":N,"coherence":N,"helpfulness":N,"overall":N},"winner":"A or B or tie"}`
            },
            {
              role: "user",
              content: `Prompt: "${prompt}"\n\nResponse A:\n${responseA.slice(0, 2000)}\n\nResponse B:\n${responseB.slice(0, 2000)}`
            },
          ],
          temperature: 0.3,
          max_tokens: 300,
        });
        const judgeText = judgeCompletion.choices[0]?.message?.content?.trim() || "";
        const parsed = JSON.parse(judgeText);
        scores = { agentA: parsed.agentA, agentB: parsed.agentB };
        winner = parsed.winner === "A" ? "A" : parsed.winner === "B" ? "B" : "tie";
      } catch {
        scores = {
          agentA: { relevance: 0, coherence: 0, helpfulness: 0, overall: 0 },
          agentB: { relevance: 0, coherence: 0, helpfulness: 0, overall: 0 },
        };
        winner = "tie";
      }

      const [result] = await db.insert(abTestResultsTable).values({
        testId: id,
        prompt,
        agentAResponse: responseA,
        agentBResponse: responseB,
        agentATokens: tokensA,
        agentBTokens: tokensB,
        agentADuration: Math.round(durationA * 100) / 100,
        agentBDuration: Math.round(durationB * 100) / 100,
        agentACost: costA,
        agentBCost: costB,
        winner,
        scores,
      }).returning();

      results.push(result);
    }

    const allResults = await db
      .select()
      .from(abTestResultsTable)
      .where(eq(abTestResultsTable.testId, id));

    await db.update(abTestsTable)
      .set({ status: "completed", totalRuns: allResults.length, updatedAt: new Date() })
      .where(eq(abTestsTable.id, id));

    res.json({ test: { ...test, status: "completed", totalRuns: allResults.length }, results });
  } catch (error: any) {
    const id = Number(req.params.id);
    await db.update(abTestsTable)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(abTestsTable.id, id))
      .catch(() => {});
    console.error("A/B test run error:", error);
    res.status(500).json({ error: error.message || "Failed to run A/B test" });
  }
});

router.delete("/ab-tests/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(abTestsTable).where(eq(abTestsTable.id, id));
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
