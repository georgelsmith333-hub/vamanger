import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import clientsRouter from "./clients";
import ebayAccountsRouter from "./ebay-accounts";
import wiseCardsRouter from "./wise-cards";
import bankAccountsRouter from "./bank-accounts";
import invoicesRouter from "./invoices";
import violationsRouter from "./violations";
import tasksRouter from "./tasks";
import earningsRouter from "./earnings";
import expensesRouter from "./expenses";
import recoveryRouter from "./recovery";
import dailyLoginsRouter from "./daily-logins";
import adminRouter from "./admin";
import sheetsRouter from "./sheets";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(adminRouter);
router.use(clientsRouter);
router.use(ebayAccountsRouter);
router.use(wiseCardsRouter);
router.use(bankAccountsRouter);
router.use(invoicesRouter);
router.use(violationsRouter);
router.use(tasksRouter);
router.use(earningsRouter);
router.use(expensesRouter);
router.use(recoveryRouter);
router.use(dailyLoginsRouter);
router.use(sheetsRouter);

export default router;
