import { Router } from "express";
import { MemberController } from "../controllers/memberController";

const router = Router();

router.get("/", MemberController.getAll);
router.get("/:id", MemberController.getById);
router.post("/", MemberController.create);
router.put("/:id", MemberController.update);
router.delete("/:id", MemberController.delete);

export default router;
