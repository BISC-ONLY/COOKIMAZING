import { storeCatalog } from './data/store-catalog';

type IncomingTopping = {
  id: string;
  name: string;
};

type IncomingCookieSelection = {
  cookieId: string;
  toppings?: IncomingTopping[];
};

type IncomingItem = {
  productId: string;
  productType: 'cookie' | 'shake';
  quantity: number;
  toppings?: IncomingTopping[];
  cookieSelections?: IncomingCookieSelection[];
};

type IncomingOrder = {
  customer: {
    name: string;
    className: string;
    yearGroup: string;
  };
  requestedWeekday: string;
  specialNote?: string;
  paymentMethod: 'pay_at_school';
  items: IncomingItem[];
};

type StoredOrder = {
  reference: string;
  customer: {
    name: string;
    className: string;
    yearGroup: string;
  };
  requestedWeekday: string;
  specialNote: string | null;
  paymentMethod: 'pay_at_school';
  paymentStatus: 'due_at_school';
  items: Array<{
    productId: string;
    productType: 'cookie' | 'shake';
    name: string;
    quantity: number;
    toppings: Array<{ id: string; name: string; price: number }>;
    cookieSelections?: Array<{
      cookieId: string;
      cookieName: string;
      toppings: Array<{ id: string; name: string; price: number }>;
    }>;
    unitPrice: number;
    lineTotal: number;
  }>;
  total: number;
  createdAt: string;
};

const isStaticMode =
  import.meta.env.PROD ||
  window.location.protocol === 'file:';

if (isStaticMode) {
  const originalFetch = window.fetch.bind(window);
  const ORDERS_KEY = 'COOKIMAZING-orders-v1';

  function response(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  function getOrders(): Record<string, StoredOrder> {
    try {
      return JSON.parse(
        window.localStorage.getItem(ORDERS_KEY) || '{}',
      ) as Record<string, StoredOrder>;
    } catch {
      return {};
    }
  }

  function saveOrder(order: StoredOrder) {
    const orders = getOrders();
    orders[order.reference] = order;
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  function staticCatalog() {
    const base = import.meta.env.BASE_URL;

    const fixImage = (image: string) =>
  image.startsWith('data:')
    ? image
    : image
      ? `${base}${image.replace(/^\/+/, '')}`
      : '';

    return {
      ...storeCatalog,
      cookies: storeCatalog.cookies.map((product) => ({
        ...product,
        image: fixImage(product.image),
      })),
      shakes: storeCatalog.shakes.map((product) => ({
        ...product,
        image: fixImage(product.image),
      })),
    };
  }

  function createStaticOrder(input: IncomingOrder): StoredOrder {
    if (!input.customer?.name?.trim()) {
      throw new Error('Name is required.');
    }

    if (!input.customer?.className?.trim()) {
      throw new Error('Class is required.');
    }

    if (!input.customer?.yearGroup?.trim()) {
      throw new Error('Year group is required.');
    }

    if (
      !storeCatalog.orderDays.days.includes(
        input.requestedWeekday as never,
      ) ||
      storeCatalog.orderDays.unavailableDays.includes(
        input.requestedWeekday as never,
      )
    ) {
      throw new Error('That weekday is currently unavailable.');
    }

    const savedItems = input.items.map((selected) => {
      const products =
        selected.productType === 'cookie'
          ? storeCatalog.cookies
          : storeCatalog.shakes;

      const product = products.find(
        (item) => item.id === selected.productId,
      );

      if (!product) {
        throw new Error('One of the selected products is unavailable.');
      }

      const toppingOptions =
        selected.productType === 'cookie'
          ? storeCatalog.cookieToppings
          : storeCatalog.drinkToppings;

      const toppings = (selected.toppings || []).map((selectedTopping) => {
        const topping = toppingOptions.find(
          (option) => option.id === selectedTopping.id,
        );

if (!topping) {
  throw new Error('One of the selected toppings is unavailable.');
}

if (product.blockedToppingIds?.includes(topping.id)) {
  throw new Error(
    `You cannot add ${topping.name} to ${product.name}.`,
  );
}

return topping;
      });

      let cookieSelections:
        | StoredOrder['items'][number]['cookieSelections']
        | undefined;

      if (product.cookieSelectionCount) {
        if (
          !selected.cookieSelections ||
          selected.cookieSelections.length !== product.cookieSelectionCount
        ) {
          throw new Error(
            `Choose ${product.cookieSelectionCount} cookies for the trio.`,
          );
        }

        cookieSelections = selected.cookieSelections.map((selection) => {
          const cookie = storeCatalog.cookies.find(
            (item) =>
              item.id === selection.cookieId &&
              item.toppingsAllowed &&
              !item.cookieSelectionCount,
          );

          if (!cookie) {
            throw new Error(
              'One of the selected trio cookies is unavailable.',
            );
          }

          const selectionToppings = (selection.toppings || []).map(
            (selectedTopping) => {
              const topping = storeCatalog.cookieToppings.find(
                (option) => option.id === selectedTopping.id,
              );

              if (!topping) {
                throw new Error(
                  'One of the selected trio toppings is unavailable.',
                );
              }

              return topping;
            },
          );

          return {
            cookieId: cookie.id,
            cookieName: cookie.name,
            toppings: selectionToppings,
          };
        });
      }

      const toppingTotal = toppings.reduce(
        (sum, topping) => sum + topping.price,
        0,
      );

      const cookieToppingTotal =
        cookieSelections?.reduce(
          (sum, selection) =>
            sum +
            selection.toppings.reduce(
              (innerSum, topping) => innerSum + topping.price,
              0,
            ),
          0,
        ) ?? 0;

      const unitPrice =
        product.price + toppingTotal + cookieToppingTotal;

      return {
        productId: product.id,
        productType: selected.productType,
        name: product.name,
        quantity: selected.quantity,
        toppings,
        ...(cookieSelections ? { cookieSelections } : {}),
        unitPrice,
        lineTotal: unitPrice * selected.quantity,
      };
    });

let reference: string;

do {
  reference = Math.floor(10000000 + Math.random() * 90000000).toString();
} while (getOrders()[reference]);

    const total = savedItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );

    const order: StoredOrder = {
      reference,
      customer: {
        name: input.customer.name.trim(),
        className: input.customer.className.trim(),
        yearGroup: input.customer.yearGroup.trim(),
      },
      requestedWeekday: input.requestedWeekday,
      specialNote: input.specialNote?.trim() || null,
      paymentMethod: 'pay_at_school',
      paymentStatus: 'due_at_school',
      items: savedItems,
      total,
      createdAt: new Date().toISOString(),
    };

    saveOrder(order);
    return order;
  }

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const rawUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    const url = new URL(rawUrl, window.location.href);
    const path = url.pathname;
    const method = (init?.method || 'GET').toUpperCase();

    if (path === '/api/store/catalog' && method === 'GET') {
      return response(staticCatalog());
    }

    if (path === '/api/orders' && method === 'POST') {
      try {
        const body =
          typeof init?.body === 'string'
            ? JSON.parse(init.body)
            : {};

        return response(
          createStaticOrder(body as IncomingOrder),
          201,
        );
      } catch (error) {
        return response(
          {
            error:
              error instanceof Error
                ? error.message
                : 'Could not save the order.',
          },
          400,
        );
      }
    }

const orderMatch = path.match(/^\/api\/orders\/([^/]+)$/);

    if (orderMatch && method === 'GET') {
      const reference = decodeURIComponent(orderMatch[1]);
      const order = getOrders()[reference];

      if (!order) {
        return response(
          { error: 'We could not find that order.' },
          404,
        );
      }

      return response(order);
    }

    return originalFetch(input, init);
  };
}