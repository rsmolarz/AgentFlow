import { db } from "@workspace/db";
import { agentsTable, workflowsTable, executionsTable, executionLogsTable, knowledgeBasesTable, documentsTable } from "@workspace/db/schema";

async function seed() {
  console.log("Seeding database...");

  const agents = await db.insert(agentsTable).values([
    {
      name: "Research Analyst",
      description: "Deep research agent that searches the web, cross-references sources, and generates comprehensive reports",
      role: "researcher",
      goal: "Conduct thorough research and provide well-sourced analysis",
      backstory: "You are a senior research analyst with expertise in synthesizing information from multiple sources",
      model: "gpt-4o",
      provider: "openai",
      temperature: 0.3,
      maxTokens: 8192,
      tools: ["web_search", "document_reader", "data_analysis"],
      memoryEnabled: true,
      status: "active",
      systemPrompt: "You are a meticulous research analyst. Always cite your sources and provide balanced analysis.",
      icon: "search",
      color: "#6366f1",
      executionCount: 156,
      avgResponseTime: 4.2,
      successRate: 97.5,
    },
    {
      name: "Code Assistant",
      description: "Expert coding agent that writes, reviews, and debugs code across multiple programming languages",
      role: "developer",
      goal: "Write clean, efficient, and well-documented code",
      backstory: "You are a senior software engineer with 15 years of experience across multiple tech stacks",
      model: "gpt-4o",
      provider: "openai",
      temperature: 0.2,
      maxTokens: 4096,
      tools: ["code_execution", "file_reader", "terminal"],
      memoryEnabled: true,
      status: "active",
      systemPrompt: "You are a senior software engineer. Write clean, production-ready code with proper error handling.",
      icon: "code",
      color: "#10b981",
      executionCount: 342,
      avgResponseTime: 2.8,
      successRate: 99.1,
    },
    {
      name: "Content Creator",
      description: "Creates engaging content for blogs, social media, and marketing campaigns with SEO optimization",
      role: "writer",
      goal: "Create compelling, engaging content that resonates with the target audience",
      backstory: "You are an award-winning content strategist with expertise in digital marketing",
      model: "claude-3-5-sonnet",
      provider: "anthropic",
      temperature: 0.8,
      maxTokens: 4096,
      tools: ["web_search", "image_generation"],
      memoryEnabled: true,
      status: "active",
      icon: "pen-tool",
      color: "#f59e0b",
      executionCount: 89,
      avgResponseTime: 5.1,
      successRate: 95.3,
    },
    {
      name: "Data Processor",
      description: "Processes, transforms, and analyzes large datasets. Generates visualizations and statistical reports.",
      role: "analyst",
      goal: "Extract meaningful insights from data",
      model: "gpt-4o",
      provider: "openai",
      temperature: 0.1,
      maxTokens: 8192,
      tools: ["data_query", "code_execution", "chart_generation"],
      memoryEnabled: false,
      status: "active",
      icon: "bar-chart-2",
      color: "#8b5cf6",
      executionCount: 234,
      avgResponseTime: 3.5,
      successRate: 98.7,
    },
    {
      name: "Customer Support Bot",
      description: "Handles customer inquiries, troubleshoots issues, and provides product recommendations",
      role: "support",
      goal: "Resolve customer issues quickly and professionally",
      model: "gpt-4o-mini",
      provider: "openai",
      temperature: 0.5,
      tools: ["knowledge_query", "ticket_system"],
      memoryEnabled: true,
      status: "active",
      icon: "headphones",
      color: "#ec4899",
      executionCount: 1243,
      avgResponseTime: 1.2,
      successRate: 94.8,
    },
    {
      name: "Email Drafter",
      description: "Drafts professional emails with appropriate tone and formatting for various business contexts",
      role: "communicator",
      goal: "Write clear, professional emails that achieve the desired outcome",
      model: "gpt-4o-mini",
      provider: "openai",
      temperature: 0.6,
      tools: [],
      memoryEnabled: true,
      status: "inactive",
      icon: "mail",
      color: "#14b8a6",
      executionCount: 67,
      avgResponseTime: 1.8,
      successRate: 99.5,
    },
  ]).returning();

  const workflows = await db.insert(workflowsTable).values([
    {
      name: "Content Research & Publishing",
      description: "End-to-end content pipeline: research topic, generate outline, write draft, review, optimize for SEO, and publish",
      status: "active",
      tags: ["content", "automation", "seo"],
      definition: {
        nodes: [
          { id: "trigger-1", type: "trigger", label: "New Topic Request", position: { x: 300, y: 50 }, data: { triggerType: "manual" } },
          { id: "agent-1", type: "agent", label: "Research Topic", position: { x: 300, y: 200 }, data: { agentId: agents[0].id }, agentId: agents[0].id },
          { id: "agent-2", type: "llm_call", label: "Generate Outline", position: { x: 300, y: 350 }, data: { model: "gpt-4o" } },
          { id: "agent-3", type: "agent", label: "Write Draft", position: { x: 300, y: 500 }, data: { agentId: agents[2].id }, agentId: agents[2].id },
          { id: "condition-1", type: "condition", label: "Quality Check", position: { x: 300, y: 650 }, data: { condition: "quality_score > 0.8" } },
          { id: "transform-1", type: "transform", label: "SEO Optimize", position: { x: 150, y: 800 }, data: {} },
          { id: "agent-4", type: "agent", label: "Revise Draft", position: { x: 450, y: 800 }, data: { agentId: agents[2].id }, agentId: agents[2].id },
          { id: "output-1", type: "output", label: "Publish Content", position: { x: 300, y: 950 }, data: {} },
        ],
        edges: [
          { id: "e1", source: "trigger-1", target: "agent-1" },
          { id: "e2", source: "agent-1", target: "agent-2" },
          { id: "e3", source: "agent-2", target: "agent-3" },
          { id: "e4", source: "agent-3", target: "condition-1" },
          { id: "e5", source: "condition-1", target: "transform-1", label: "Pass" },
          { id: "e6", source: "condition-1", target: "agent-4", label: "Fail" },
          { id: "e7", source: "agent-4", target: "condition-1" },
          { id: "e8", source: "transform-1", target: "output-1" },
        ],
      },
      executionCount: 47,
      avgDuration: 45.2,
      successRate: 93.6,
    },
    {
      name: "Lead Qualification Pipeline",
      description: "Automated lead scoring and qualification with enrichment, outreach, and CRM routing",
      status: "active",
      tags: ["sales", "leads", "crm"],
      definition: {
        nodes: [
          { id: "webhook-1", type: "webhook", label: "New Lead Webhook", position: { x: 300, y: 50 }, data: {} },
          { id: "api-1", type: "api_call", label: "Enrich Lead Data", position: { x: 300, y: 200 }, data: { url: "https://api.clearbit.com/enrich" } },
          { id: "agent-1", type: "agent", label: "Score Lead", position: { x: 300, y: 350 }, data: { agentId: agents[3].id }, agentId: agents[3].id },
          { id: "condition-1", type: "condition", label: "High Score?", position: { x: 300, y: 500 }, data: { condition: "score > 80" } },
          { id: "agent-2", type: "agent", label: "Compose Email", position: { x: 150, y: 650 }, data: { agentId: agents[5].id }, agentId: agents[5].id },
          { id: "output-1", type: "output", label: "Route to Sales", position: { x: 450, y: 650 }, data: {} },
        ],
        edges: [
          { id: "e1", source: "webhook-1", target: "api-1" },
          { id: "e2", source: "api-1", target: "agent-1" },
          { id: "e3", source: "agent-1", target: "condition-1" },
          { id: "e4", source: "condition-1", target: "agent-2", label: "Low" },
          { id: "e5", source: "condition-1", target: "output-1", label: "High" },
        ],
      },
      executionCount: 123,
      avgDuration: 12.8,
      successRate: 98.4,
    },
    {
      name: "Code Review Automation",
      description: "Automated code review pipeline with security scanning, style checking, and improvement suggestions",
      status: "active",
      tags: ["development", "code-review", "ci-cd"],
      definition: {
        nodes: [
          { id: "trigger-1", type: "trigger", label: "PR Created", position: { x: 300, y: 50 }, data: { triggerType: "webhook" } },
          { id: "code-1", type: "code", label: "Parse Diff", position: { x: 300, y: 200 }, data: {} },
          { id: "parallel-1", type: "parallel", label: "Parallel Analysis", position: { x: 300, y: 350 }, data: {} },
          { id: "agent-1", type: "agent", label: "Security Scan", position: { x: 100, y: 500 }, data: { agentId: agents[1].id }, agentId: agents[1].id },
          { id: "agent-2", type: "agent", label: "Code Quality", position: { x: 300, y: 500 }, data: { agentId: agents[1].id }, agentId: agents[1].id },
          { id: "agent-3", type: "agent", label: "Performance Check", position: { x: 500, y: 500 }, data: { agentId: agents[1].id }, agentId: agents[1].id },
          { id: "transform-1", type: "transform", label: "Merge Results", position: { x: 300, y: 650 }, data: {} },
          { id: "output-1", type: "output", label: "Post Review", position: { x: 300, y: 800 }, data: {} },
        ],
        edges: [
          { id: "e1", source: "trigger-1", target: "code-1" },
          { id: "e2", source: "code-1", target: "parallel-1" },
          { id: "e3", source: "parallel-1", target: "agent-1" },
          { id: "e4", source: "parallel-1", target: "agent-2" },
          { id: "e5", source: "parallel-1", target: "agent-3" },
          { id: "e6", source: "agent-1", target: "transform-1" },
          { id: "e7", source: "agent-2", target: "transform-1" },
          { id: "e8", source: "agent-3", target: "transform-1" },
          { id: "e9", source: "transform-1", target: "output-1" },
        ],
      },
      executionCount: 89,
      avgDuration: 28.5,
      successRate: 99.1,
    },
    {
      name: "Customer Feedback Analysis",
      description: "Collects customer feedback, performs sentiment analysis, categorizes issues, and generates action reports",
      status: "draft",
      tags: ["customer", "feedback", "analysis"],
      definition: {
        nodes: [
          { id: "trigger-1", type: "trigger", label: "Feedback Received", position: { x: 300, y: 50 }, data: {} },
          { id: "agent-1", type: "agent", label: "Sentiment Analysis", position: { x: 300, y: 200 }, data: { agentId: agents[4].id }, agentId: agents[4].id },
          { id: "kb-1", type: "knowledge_query", label: "Find Similar Issues", position: { x: 300, y: 350 }, data: {} },
          { id: "condition-1", type: "condition", label: "Negative?", position: { x: 300, y: 500 }, data: {} },
          { id: "output-1", type: "output", label: "Alert Team", position: { x: 150, y: 650 }, data: {} },
          { id: "output-2", type: "output", label: "Log & Archive", position: { x: 450, y: 650 }, data: {} },
        ],
        edges: [
          { id: "e1", source: "trigger-1", target: "agent-1" },
          { id: "e2", source: "agent-1", target: "kb-1" },
          { id: "e3", source: "kb-1", target: "condition-1" },
          { id: "e4", source: "condition-1", target: "output-1", label: "Yes" },
          { id: "e5", source: "condition-1", target: "output-2", label: "No" },
        ],
      },
      executionCount: 0,
      avgDuration: 0,
      successRate: 0,
    },
  ]).returning();

  const now = new Date();
  const executionData = [];
  for (let i = 0; i < 30; i++) {
    const wf = workflows[Math.floor(Math.random() * 3)];
    const daysAgo = Math.floor(Math.random() * 14);
    const startTime = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 24 * 60 * 60 * 1000);
    const duration = 5 + Math.random() * 60;
    const endTime = new Date(startTime.getTime() + duration * 1000);
    const status = Math.random() < 0.85 ? "completed" : Math.random() < 0.5 ? "failed" : "cancelled";
    const tokens = Math.floor(Math.random() * 5000) + 500;

    executionData.push({
      workflowId: wf.id,
      workflowName: wf.name,
      status,
      inputData: { topic: "Sample input " + (i + 1) },
      outputData: status === "completed" ? { result: "Completed successfully" } : undefined,
      error: status === "failed" ? "Simulated error in step processing" : undefined,
      startedAt: startTime,
      completedAt: endTime,
      duration,
      tokensUsed: tokens,
      cost: tokens * 0.00003,
      currentStep: status === "completed" ? "Done" : "Processing",
      totalSteps: wf.definition.nodes.length,
      completedSteps: status === "completed" ? wf.definition.nodes.length : Math.floor(Math.random() * wf.definition.nodes.length),
    });
  }

  await db.insert(executionsTable).values(executionData);

  const kbs = await db.insert(knowledgeBasesTable).values([
    {
      name: "Product Documentation",
      description: "Complete product documentation including user guides, API references, and FAQs",
      documentCount: 45,
      totalChunks: 892,
      embeddingModel: "text-embedding-3-small",
      status: "ready",
    },
    {
      name: "Customer Support KB",
      description: "Knowledge base for customer support agents with troubleshooting guides and common issues",
      documentCount: 128,
      totalChunks: 2456,
      embeddingModel: "text-embedding-3-small",
      status: "ready",
    },
    {
      name: "Company Policies",
      description: "Internal company policies, procedures, and compliance documentation",
      documentCount: 23,
      totalChunks: 456,
      embeddingModel: "text-embedding-3-small",
      status: "ready",
    },
  ]).returning();

  await db.insert(documentsTable).values([
    { knowledgeBaseId: kbs[0].id, title: "Getting Started Guide", content: "Welcome to our platform...", sourceType: "text", chunkCount: 15, status: "indexed" },
    { knowledgeBaseId: kbs[0].id, title: "API Reference v2.0", content: "REST API documentation...", sourceType: "text", chunkCount: 42, status: "indexed" },
    { knowledgeBaseId: kbs[0].id, title: "Integration Guide", content: "How to integrate with third-party services...", sourceType: "url", sourceUrl: "https://docs.example.com/integrations", chunkCount: 28, status: "indexed" },
    { knowledgeBaseId: kbs[1].id, title: "Troubleshooting FAQ", content: "Common issues and solutions...", sourceType: "text", chunkCount: 35, status: "indexed" },
    { knowledgeBaseId: kbs[1].id, title: "Billing Issues", content: "How to resolve billing-related problems...", sourceType: "text", chunkCount: 12, status: "indexed" },
    { knowledgeBaseId: kbs[2].id, title: "Employee Handbook", content: "Company policies and procedures...", sourceType: "file", chunkCount: 67, status: "indexed" },
  ]);

  console.log("Seed complete!");
  console.log(`  - ${agents.length} agents`);
  console.log(`  - ${workflows.length} workflows`);
  console.log(`  - ${executionData.length} executions`);
  console.log(`  - ${kbs.length} knowledge bases`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
