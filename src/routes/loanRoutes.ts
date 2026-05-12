import { Router } from "express";
import { LoanController } from "../controllers/loanController";

const router = Router();

router.get("/overdue", LoanController.getOverdue);
router.get("/", LoanController.getAll);
router.post("/", LoanController.create);
router.put("/:id/return", LoanController.returnBook);

export default router;
