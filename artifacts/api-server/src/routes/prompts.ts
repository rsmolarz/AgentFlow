import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { promptsTable } from "@workspace/db/schema";
import { eq, desc, ilike, or } from "drizzle-orm";

const router: IRouter = Router();

router.get("/prompts", async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = db.select().from(promptsTable).orderBy(desc(promptsTable.updatedAt));

    const prompts = await query;

    let filtered = prompts;
    if (search && typeof search === "string") {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        p => p.name.toLowerCase().includes(s) || (p.description || "").toLowerCase().includes(s) || p.content.toLowerCase().includes(s)
      );
    }
    if (category && typeof category === "string" && category !== "all") {
      filtered = filtered.filter(p => p.category === category);
    }

    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/prompts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [prompt] = await db.select().from(promptsTable).where(eq(promptsTable.id, id));
    if (!prompt) return res.status(404).json({ error: "Prompt not found" });
    res.json(prompt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/prompts", async (req, res) => {
  try {
    const { name, content, category, tags, description } = req.body;
    if (!name || !content) return res.status(400).json({ error: "Name and content are required" });

    const [prompt] = await db
      .insert(promptsTable)
      .values({
        name,
        content,
        category: category || "general",
        tags: tags || [],
        description: description || "",
      })
      .returning();

    res.status(201).json(prompt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/prompts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, content, category, tags, description } = req.body;

    const [prompt] = await db
      .update(promptsTable)
      .set({
        ...(name !== undefined && { name }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(description !== undefined && { description }),
        updatedAt: new Date(),
      })
      .where(eq(promptsTable.id, id))
      .returning();

    if (!prompt) return res.status(404).json({ error: "Prompt not found" });
    res.json(prompt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/prompts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [deleted] = await db.delete(promptsTable).where(eq(promptsTable.id, id)).returning();
    if (!deleted) return res.status(404).json({ error: "Prompt not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
