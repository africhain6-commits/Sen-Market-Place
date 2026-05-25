import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import listingsRouter from "./listings";
import messagesRouter from "./messages";
import usersRouter from "./users";
import adminRouter from "./admin";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(listingsRouter);
router.use(messagesRouter);
router.use(usersRouter);
router.use(adminRouter);
router.use(storageRouter);

export default router;
