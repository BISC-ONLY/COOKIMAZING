import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateOrderBody,
  CreateOrderResponse,
  GetOrderParams,
  GetOrderResponse,
  GetStoreCatalogResponse,
} from "@workspace/api-zod";
import { COOKIMAZINGOrdersTable, db } from "@workspace/db";
import type { SavedOrderCookieSelection, SavedOrderItem, SavedOrderTopping } from "@workspace/db";
import { storeCatalog } from "../lib/store-catalog";

const router: IRouter = Router();

router.get("/store/catalog", (_req, res) => {
  res.json(GetStoreCatalogResponse.parse(storeCatalog));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const input = parsed.data;
  const name = input.customer.name.trim();
  const className = input.customer.className.trim();
  const yearGroup = input.customer.yearGroup.trim();
  if (!name || !className || !yearGroup) {
    res.status(400).json({ error: "Name, class, and year group are required." });
    return;
  }

  if (
    !storeCatalog.orderDays.days.includes(input.requestedWeekday) ||
    storeCatalog.orderDays.unavailableDays.includes(input.requestedWeekday)
  ) {
    res.status(400).json({ error: "That weekday is currently unavailable." });
    return;
  }

  const savedItems: SavedOrderItem[] = [];
  for (const selected of input.items) {
    const products =
      selected.productType === "cookie"
        ? storeCatalog.cookies
        : storeCatalog.shakes;
    const product = products.find((item) => item.id === selected.productId);
    if (!product) {
      res.status(400).json({ error: "One of the selected products is unavailable." });
      return;
    }
    if (!product.toppingsAllowed && selected.toppings.length > 0) {
      res.status(400).json({ error: "Toppings are not available for this product." });
      return;
    }
    if (product.cookieSelectionCount && selected.toppings.length > 0) {
      res.status(400).json({ error: "Choose toppings for each cookie in the trio." });
      return;
    }

    const toppingOptions =
      selected.productType === "cookie"
        ? storeCatalog.cookieToppings
        : storeCatalog.drinkToppings;
    const selectedToppingIds = selected.toppings.map((topping) => topping.id);
    if (new Set(selectedToppingIds).size !== selectedToppingIds.length) {
      res.status(400).json({ error: "A topping can only be added once per item." });
      return;
    }

    const toppings = [];
    for (const selectedTopping of selected.toppings) {
      const topping = toppingOptions.find(
        (option) => option.id === selectedTopping.id,
      );
      if (!topping) {
        res.status(400).json({ error: "One of the selected toppings is unavailable." });
        return;
      }
      toppings.push(topping);
    }

    let cookieSelections: SavedOrderCookieSelection[] | undefined;
    if (product.cookieSelectionCount) {
      const selectedCookies = selected.cookieSelections ?? [];
      if (selectedCookies.length !== product.cookieSelectionCount) {
        res.status(400).json({ error: `Choose ${product.cookieSelectionCount} cookies for the trio.` });
        return;
      }

      cookieSelections = [];
      for (const selectedCookie of selectedCookies) {
        const cookie = storeCatalog.cookies.find(
          (option) => option.id === selectedCookie.cookieId && option.toppingsAllowed && !option.cookieSelectionCount,
        );
        if (!cookie) {
          res.status(400).json({ error: "One of the selected trio cookies is unavailable." });
          return;
        }

        const selectionToppingIds = selectedCookie.toppings.map((topping) => topping.id);
        if (new Set(selectionToppingIds).size !== selectionToppingIds.length) {
          res.status(400).json({ error: "A topping can only be added once per cookie." });
          return;
        }

        const selectionToppings: SavedOrderTopping[] = [];
        for (const selectedTopping of selectedCookie.toppings) {
          const topping = storeCatalog.cookieToppings.find((option) => option.id === selectedTopping.id);
          if (!topping) {
            res.status(400).json({ error: "One of the selected trio toppings is unavailable." });
            return;
          }
          selectionToppings.push(topping);
        }

        cookieSelections.push({
          cookieId: cookie.id,
          cookieName: cookie.name,
          toppings: selectionToppings,
        });
      }
    } else if (selected.cookieSelections?.length) {
      res.status(400).json({ error: "Cookie selections are only available for the trio." });
      return;
    }

    const unitPrice = product.price
      + toppings.reduce((sum, topping) => sum + topping.price, 0)
      + (cookieSelections?.reduce(
        (sum, selection) => sum + selection.toppings.reduce((toppingTotal, topping) => toppingTotal + topping.price, 0),
        0,
      ) ?? 0);
    savedItems.push({
      productId: product.id,
      productType: selected.productType,
      name: product.name,
      quantity: selected.quantity,
      toppings,
      ...(cookieSelections ? { cookieSelections } : {}),
      unitPrice,
      lineTotal: unitPrice * selected.quantity,
    });
  }

  const reference = `CK-${randomBytes(5).toString("hex").toUpperCase()}`;
  const total = savedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const [savedOrder] = await db
    .insert(COOKIMAZINGOrdersTable)
    .values({
      reference,
      customerName: name,
      className,
      yearGroup,
      requestedOrderDay: null,
      requestedWeekday: input.requestedWeekday,
      specialNote: input.specialNote?.trim() || null,
      paymentMethod: "pay_at_school",
      paymentStatus: "due_at_school",
      items: savedItems,
      total,
    })
    .returning();

  if (!savedOrder) {
    req.log.error({ reference }, "Order insert returned no saved row");
    res.status(500).json({ error: "We could not save your order. Please try again." });
    return;
  }

  req.log.info({ reference, itemCount: savedItems.length }, "COOKIMAZING order saved");
  res.status(201).json(
    CreateOrderResponse.parse({
      reference: savedOrder.reference,
      customer: {
        name: savedOrder.customerName,
        className: savedOrder.className,
        yearGroup: savedOrder.yearGroup,
      },
      requestedWeekday: savedOrder.requestedWeekday,
      specialNote: savedOrder.specialNote,
      paymentMethod: savedOrder.paymentMethod,
      paymentStatus: savedOrder.paymentStatus,
      items: savedOrder.items,
      total: savedOrder.total,
      createdAt: savedOrder.createdAt.toISOString(),
    }),
  );
});

router.get("/orders/:reference", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [savedOrder] = await db
    .select()
    .from(COOKIMAZINGOrdersTable)
    .where(eq(COOKIMAZINGOrdersTable.reference, params.data.reference));

  if (!savedOrder) {
    res.status(404).json({ error: "We could not find that order." });
    return;
  }

  res.json(
    GetOrderResponse.parse({
      reference: savedOrder.reference,
      customer: {
        name: savedOrder.customerName,
        className: savedOrder.className,
        yearGroup: savedOrder.yearGroup,
      },
      requestedWeekday: savedOrder.requestedWeekday,
      specialNote: savedOrder.specialNote,
      paymentMethod: savedOrder.paymentMethod,
      paymentStatus: savedOrder.paymentStatus,
      items: savedOrder.items,
      total: savedOrder.total,
      createdAt: savedOrder.createdAt.toISOString(),
    }),
  );
});

export default router;