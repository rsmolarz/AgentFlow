import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { agentsTable } from "@workspace/db/schema";
import { workflowsTable } from "@workspace/db/schema";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ilike, or, sql } from "drizzle-orm";

const router: IRouter = Router();

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function buildSearchText(item: any, type: string): string {
  if (type === "agent") {
    return [item.name, item.description, item.model, item.systemPrompt].filter(Boolean).join(" ");
  }
  if (type === "workflow") {
    const desc = item.description || "";
    const tags = Array.isArray(item.tags) ? item.tags.join(" ") : "";
    return [item.name, desc, tags].filter(Boolean).join(" ");
  }
  return item.name || "";
}

router.get("/search", async (req, res) => {
  try {
    const query = (req.query.q as string || "").trim();
    if (!query) {
      return res.json({ results: [], query: "", mode: "empty" });
    }

    const agents = await db.select().from(agentsTable);
    const workflows = await db.select().from(workflowsTable);

    const allItems = [
      ...agents.map(a => ({ ...a, _type: "agent" as const, _searchText: buildSearchText(a, "agent") })),
      ...workflows.map(w => ({ ...w, _type: "workflow" as const, _searchText: buildSearchText(w, "workflow") })),
    ];

    if (allItems.length === 0) {
      return res.json({ results: [], query, mode: "semantic" });
    }

    let scoredResults: Array<{ item: any; score: number; matchType: string }>;
    let mode = "semantic";

    try {
      const queryEmbedding = await getEmbedding(query);
      const itemTexts = allItems.map(item => item._searchText);
      const embeddingsResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: itemTexts,
      });

      scoredResults = allItems.map((item, i) => {
        const similarity = cosineSimilarity(queryEmbedding, embeddingsResponse.data[i].embedding);
        const nameBonus = item.name?.toLowerCase().includes(query.toLowerCase()) ? 0.15 : 0;
        return {
          item,
          score: Math.min(similarity + nameBonus, 1),
          matchType: nameBonus > 0 ? "name + semantic" : "semantic",
        };
      });
    } catch {
      mode = "fuzzy";
      const lowerQuery = query.toLowerCase();
      scoredResults = allItems.map(item => {
        const text = item._searchText.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(lowerQuery);
        const textMatch = text.includes(lowerQuery);
        let score = 0;
        if (nameMatch) score = 0.9;
        else if (textMatch) score = 0.6;
        else {
          const words = lowerQuery.split(/\s+/);
          const matched = words.filter(w => text.includes(w)).length;
          score = (matched / words.length) * 0.5;
        }
        return {
          item,
          score,
          matchType: nameMatch ? "name" : textMatch ? "content" : "partial",
        };
      });
    }

    const results = scoredResults
      .filter(r => r.score > 0.25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(r => ({
        id: r.item.id,
        type: r.item._type,
        name: r.item.name,
        description: r.item.description || r.item._searchText.substring(0, 100),
        score: Math.round(r.score * 100),
        matchType: r.matchType,
        status: r.item.status,
        model: r.item._type === "agent" ? r.item.model : undefined,
        tags: r.item._type === "workflow" ? r.item.tags : undefined,
      }));

    res.json({ results, query, mode, totalItems: allItems.length });
  } catch (error: any) {
    console.error("Search error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
