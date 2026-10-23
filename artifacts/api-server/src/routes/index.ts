import { Router, type IRouter } from "express";
import healthRouter from "./health";
import supabaseConfigRouter from "./supabase-config";
import travelSummaryRouter from "./travel-summary";

const router: IRouter = Router();

router.use(healthRouter);
router.use(supabaseConfigRouter);
router.use(travelSummaryRouter);

export default router;
