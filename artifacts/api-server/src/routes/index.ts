import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agentsRouter from "./agents";
import workflowsRouter from "./workflows";
import executionsRouter from "./executions";
import templatesRouter from "./templates";
import knowledgeBasesRouter from "./knowledge-bases";
import analyticsRouter from "./analytics";
import featureRequestsRouter from "./feature-requests";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agentsRouter);
router.use(workflowsRouter);
router.use(executionsRouter);
router.use(templatesRouter);
router.use(knowledgeBasesRouter);
router.use(analyticsRouter);
router.use(featureRequestsRouter);

export default router;
