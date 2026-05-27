import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import listingsRouter from "./listings";
import messagesRouter from "./messages";
import usersRouter from "./users";
import adminRouter from "./admin";
import storageRouter from "./storage";
import favoritesRouter from "./favorites";
import reviewsRouter from "./reviews";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(listingsRouter);
router.use(messagesRouter);
router.use(usersRouter);
router.use(adminRouter);
router.use(storageRouter);
router.use(favoritesRouter);
router.use(reviewsRouter);
router.use(notificationsRouter);

export default router;
