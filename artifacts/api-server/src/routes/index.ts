import { Router, type IRouter } from "express";
import healthRouter from "./health";
import supabaseConfigRouter from "./supabase-config";

const router: IRouter = Router();

router.use(healthRouter);
router.use(supabaseConfigRouter);

export default router;
