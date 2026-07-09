import express from "express";
import { signupHandler, loginHandler } from "../controllers/auth-controller";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";

const authRouter = express.Router();

/**
 * POST /auth/signup
 * Create a new teacher or parent account.
 * Requires authentication and admin role.
 */
authRouter.post("/signup", authMiddleware, roleMiddleware(["admin"]), signupHandler);

/**
 * POST /auth/login
 * Authenticate and receive a JWT.
 * No authentication required.
 */
authRouter.post("/login", loginHandler);

export default authRouter;
