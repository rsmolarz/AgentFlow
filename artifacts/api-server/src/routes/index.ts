import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agentsRouter from "./agents";
import workflowsRouter from "./workflows";
import executionsRouter from "./executions";
import templatesRouter from "./templates";
import knowledgeBasesRouter from "./knowledge-bases";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agentsRouter);
router.use(workflowsRouter);
router.use(executionsRouter);
router.use(templatesRouter);
router.use(knowledgeBasesRouter);
router.use(analyticsRouter);

export default router;
