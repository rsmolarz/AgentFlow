import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agentsRouter from "./agents";
import workflowsRouter from "./workflows";
import executionsRouter from "./executions";
import templatesRouter from "./templates";
import knowledgeBasesRouter from "./knowledge-bases";
import analyticsRouter from "./analytics";
import featureRequestsRouter from "./feature-requests";
import evaluationsRouter from "./evaluations";
import integrationsRouter from "./integrations";
import settingsRouter from "./settings";
import promptOptimizerRouter from "./prompt-optimizer";
import abTestsRouter from "./ab-tests";
import searchRouter from "./search";
import schedulesRouter from "./schedules";
import webhooksRouter from "./webhooks";
import costAlertsRouter from "./cost-alerts";
import promptsRouter from "./prompts";
import notificationsRouter from "./notifications";
import auditLogsRouter from "./audit-logs";
import agentPresetsRouter from "./agent-presets";
import apiKeysRouter from "./api-keys";
let bridgeRouter: any;
try {
  bridgeRouter = require("./bridge").default;
  console.log("[Bridge] Route module loaded successfully");
} catch (err: any) {
  console.error("[Bridge] Failed to load bridge routes:", err?.message || err);
}

const router: IRouter = Router();

router.use(healthRouter);
router.use(searchRouter);
router.use(agentsRouter);
router.use(promptOptimizerRouter);
router.use(abTestsRouter);
router.use(workflowsRouter);
router.use(executionsRouter);
router.use(templatesRouter);
router.use(knowledgeBasesRouter);
router.use(analyticsRouter);
router.use(featureRequestsRouter);
router.use(evaluationsRouter);
router.use(integrationsRouter);
router.use(settingsRouter);
router.use(schedulesRouter);
router.use(webhooksRouter);
router.use(costAlertsRouter);
router.use(promptsRouter);
router.use(notificationsRouter);
router.use(auditLogsRouter);
router.use(agentPresetsRouter);
router.use(apiKeysRouter);
if (bridgeRouter) {
  router.use("/bridge", bridgeRouter);
  console.log("[Bridge] Routes registered at /bridge");
} else {
  console.warn("[Bridge] Bridge routes NOT registered — module failed to load");
}

export default router;
