import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { agentsTable, workflowsTable } from "@workspace/db/schema";
import { ApplyTemplateParams, ListTemplatesQueryParams } from "@workspace/api-zod";

const templates = [
  {
    id: "customer-support-agent",
    name: "Customer Support Agent",
    description: "An intelligent customer support agent that handles inquiries, resolves issues, and escalates complex problems. Includes sentiment analysis and knowledge base integration.",
    category: "agent" as const,
    icon: "headphones",
    tags: ["support", "customer-service", "nlp"],
    preview: { model: "gpt-4o", provider: "openai", tools: ["web_search", "knowledge_query"] },
    popularity: 95,
  },
  {
    id: "data-analyst-agent",
    name: "Data Analysis Agent",
    description: "Processes and analyzes data from various sources. Generates insights, creates summaries, and identifies patterns using advanced statistical methods.",
    category: "agent" as const,
    icon: "bar-chart-2",
    tags: ["analytics", "data", "insights"],
    preview: { model: "gpt-4o", provider: "openai", tools: ["code_execution", "data_query"] },
    popularity: 88,
  },
  {
    id: "content-writer-agent",
    name: "Content Writer Agent",
    description: "Creates high-quality content including blog posts, social media content, marketing copy, and technical documentation with SEO optimization.",
    category: "agent" as const,
    icon: "pen-tool",
    tags: ["content", "writing", "marketing"],
    preview: { model: "claude-3-5-sonnet", provider: "anthropic", tools: ["web_search"] },
    popularity: 82,
  },
  {
    id: "code-reviewer-agent",
    name: "Code Review Agent",
    description: "Automatically reviews code for bugs, security vulnerabilities, performance issues, and best practices. Supports multiple programming languages.",
    category: "agent" as const,
    icon: "code",
    tags: ["development", "code-review", "security"],
    preview: { model: "gpt-4o", provider: "openai", tools: ["code_execution"] },
    popularity: 90,
  },
  {
    id: "research-workflow",
    name: "Deep Research Pipeline",
    description: "Multi-step research workflow that searches the web, extracts key information, cross-references sources, and generates comprehensive research reports.",
    category: "workflow" as const,
    icon: "search",
    tags: ["research", "analysis", "report"],
    preview: {},
    popularity: 85,
  },
  {
    id: "content-pipeline",
    name: "Content Generation Pipeline",
    description: "End-to-end content pipeline: research topic, generate outline, write draft, review and edit, optimize for SEO, and publish.",
    category: "workflow" as const,
    icon: "file-text",
    tags: ["content", "automation", "pipeline"],
    preview: {},
    popularity: 78,
  },
  {
    id: "lead-qualifier",
    name: "Lead Qualification Workflow",
    description: "Automated lead qualification pipeline that scores leads, enriches data, sends personalized outreach, and routes qualified leads to sales.",
    category: "workflow" as const,
    icon: "users",
    tags: ["sales", "leads", "automation"],
    preview: {},
    popularity: 72,
  },
  {
    id: "email-automation",
    name: "Email Automation Starter",
    description: "Complete email automation workflow with trigger-based sending, personalization, A/B testing support, and analytics tracking.",
    category: "starter" as const,
    icon: "mail",
    tags: ["email", "automation", "starter"],
    preview: {},
    popularity: 70,
  },
  {
    id: "chatbot-starter",
    name: "Conversational Chatbot Starter",
    description: "Ready-to-deploy chatbot with memory, context awareness, multi-turn conversation support, and integration with knowledge bases.",
    category: "starter" as const,
    icon: "message-circle",
    tags: ["chatbot", "conversation", "starter"],
    preview: {},
    popularity: 92,
  },
  {
    id: "rag-pipeline",
    name: "RAG Pipeline Starter",
    description: "Retrieval-Augmented Generation pipeline with document ingestion, vector search, context assembly, and grounded response generation.",
    category: "starter" as const,
    icon: "database",
    tags: ["rag", "retrieval", "knowledge"],
    preview: {},
    popularity: 88,
  },
];

const router: IRouter = Router();

router.get("/templates", (req, res) => {
  const query = ListTemplatesQueryParams.parse(req.query);
  let filtered = templates;
  if (query.category) {
    filtered = templates.filter((t) => t.category === query.category);
  }
  res.json(filtered);
});

router.post("/templates/:templateId/apply", async (req, res) => {
  try {
    const { templateId } = ApplyTemplateParams.parse(req.params);
    const template = templates.find((t) => t.id === templateId);
    if (!template) return res.status(404).json({ error: "Template not found" });

    if (template.category === "agent") {
      const [agent] = await db
        .insert(agentsTable)
        .values({
          name: template.name,
          description: template.description,
          role: template.tags[0] || "assistant",
          model: template.preview?.model || "gpt-4o",
          provider: template.preview?.provider || "openai",
          tools: template.preview?.tools || [],
          icon: template.icon,
          status: "active",
        })
        .returning();

      return res.status(201).json({
        agentId: agent.id,
        message: `Agent "${template.name}" created from template`,
      });
    }

    if (template.category === "workflow" || template.category === "starter") {
      const sampleNodes = [
        { id: "trigger-1", type: "trigger", label: "Start Trigger", position: { x: 250, y: 50 }, data: {} },
        { id: "agent-1", type: "agent", label: "Process Input", position: { x: 250, y: 200 }, data: {} },
        { id: "condition-1", type: "condition", label: "Check Result", position: { x: 250, y: 350 }, data: {} },
        { id: "output-1", type: "output", label: "Return Result", position: { x: 250, y: 500 }, data: {} },
      ];
      const sampleEdges = [
        { id: "e1", source: "trigger-1", target: "agent-1" },
        { id: "e2", source: "agent-1", target: "condition-1" },
        { id: "e3", source: "condition-1", target: "output-1", label: "success" },
      ];

      const [workflow] = await db
        .insert(workflowsTable)
        .values({
          name: template.name,
          description: template.description,
          tags: template.tags,
          definition: { nodes: sampleNodes, edges: sampleEdges },
          status: "draft",
        })
        .returning();

      return res.status(201).json({
        workflowId: workflow.id,
        message: `Workflow "${template.name}" created from template`,
      });
    }

    res.status(400).json({ error: "Unknown template category" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
