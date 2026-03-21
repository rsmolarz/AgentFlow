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

const router: IRouter = Router();

router.use(healthRouter);
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

export default router;
