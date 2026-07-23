import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import projectsRouter from "./projects";
import tasksRouter from "./tasks";
import milestonesRouter from "./milestones";
import conversationsRouter from "./conversations";
import memoryRouter from "./memory";
import architectureRouter from "./architecture";
import promptsRouter from "./prompts";
import documentationRouter from "./documentation";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(projectsRouter);
router.use(tasksRouter);
router.use(milestonesRouter);
router.use(conversationsRouter);
router.use(memoryRouter);
router.use(architectureRouter);
router.use(promptsRouter);
router.use(documentationRouter);
router.use(settingsRouter);

export default router;
