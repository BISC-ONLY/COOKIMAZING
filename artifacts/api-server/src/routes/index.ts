import { Router, type IRouter } from "express";
import { GetStoreCatalogResponse } from "@workspace/api-zod";

import healthRouter from "./health";
import { storeCatalog } from "../lib/store-catalog";

const router: IRouter = Router();

router.use(healthRouter);

router.get("/store/catalog", (_req, res) => {
  res.json(GetStoreCatalogResponse.parse(storeCatalog));
});

if (process.env["DATABASE_URL"]) {
  const { default: ordersRouter } = await import("./orders");
  router.use(ordersRouter);
}

export default router;