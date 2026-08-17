import { Router } from "express";
import { postContact } from "../controllers/contact-controller";

const contactRouter = Router();

contactRouter.post("/", postContact);

export default contactRouter;
