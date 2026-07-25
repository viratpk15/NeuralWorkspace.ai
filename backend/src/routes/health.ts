import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/health", (_req, res) => {
  const data = {
    status: "ok",
    service: "neural-workspace-backend",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(data);
});

export default router;
