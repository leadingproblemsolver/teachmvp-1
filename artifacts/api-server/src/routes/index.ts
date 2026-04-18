import { Router, type IRouter } from "express";
import healthRouter from "./health";
import crystallizerRouter from "./crystallizer/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(crystallizerRouter);

export default router;
