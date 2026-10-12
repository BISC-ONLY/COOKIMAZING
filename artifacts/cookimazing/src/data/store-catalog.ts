type Product = {

  id: string;

  name: string;

  description: string;

  price: number;

  image: string;

  toppingsAllowed: boolean;

  blockedToppingIds?: string[];

  cookieSelectionCount?: number;

};

type Topping = {
  id: string;
  name: string;
  price: number;
};

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
type Weekday = (typeof weekdays)[number];

type StoreCatalogData = {
  cookies: Product[];
  shakes: Product[];
  cookieToppings: Topping[];
  drinkToppings: Topping[];
  orderDays: {
    days: Weekday[];
    unavailableDays: Weekday[];
  };
};

export const storeCatalog: StoreCatalogData = {
  cookies: [
    {
      id: "kinder-cookie",
      name: "Kinder Cookie",
      description: "Loaded with Kinder chocolate chunks.",
      price: 60,
      image: "/images/kinder-cookie.png",
  toppingsAllowed: true,
blockedToppingIds: ["cookie-kinder"],
    },
    {
  id: "mm-cookie",
  name: "M&M Cookie",
  description: "Filled with M&M chocolate candies.",
  price: 60,
  image: "/images/mm-cookie.png",
  toppingsAllowed: true,
  blockedToppingIds: ["cookie-mm"],
},
    {
      id: "smores-cookie",
      name: "S’mores Cookie",
      description: "Graham crackers, chocolate, and marshmallows.",
      price: 60,
      image: "/images/smores-cookie.png",
toppingsAllowed: true,
blockedToppingIds: ["cookie-marshmallows"],
    },
    {
      id: "oreo-cookie",
      name: "Oreo Cookie",
      description: "Loaded with Oreo pieces.",
      price: 60,
      image: "/images/oreo-cookie.png",
toppingsAllowed: true,
blockedToppingIds: ["cookie-oreo"],
    },
   {
  id: "biscoff-cookie",
  name: "Biscoff Cookie",
  description: "Biscoff spread and crunchy Biscoff pieces.",
  price: 60,
  image: "/images/biscoff-cookie.png",
  toppingsAllowed: true,
  blockedToppingIds: ["cookie-biscoff"],
},
    {
      id: "every-cookie-box",
      name: "The Big Box",
      description: "A box featuring every cookie flavor on the menu.",
      price: 360,
      image: "/images/every-cookie-box.png",
      toppingsAllowed: true,
    },
    {
      id: "triple-cookies",
      name: "Trio Cookies",
      description: "Choose any three regular cookies and toppings for each.",
      price: 180,
      image: "/images/triple-cookies.png",
      toppingsAllowed: true,
      cookieSelectionCount: 3,
    },
  ],
  shakes: [
    {
      id: "chocolate-shake",
      name: "Chocolate Shake",
      description: "A rich, creamy classic chocolate shake.",
      price: 70,
    image: "Chocolate-Shake.jpg",
      toppingsAllowed: true,
    },
    {
      id: "vanilla-shake",
      name: "Vanilla Shake",
      description: "A smooth, creamy classic vanilla shake.",
      price: 70,
      image: "Vannila-Shake.jpg",
      toppingsAllowed: true,
    },
    {
      id: "oreo-vanilla-shake",
      name: "Oreo Vanilla Shake",
      description: "Creamy vanilla blended with Oreo pieces.",
      price: 70,
      image: "/images/oreo-vanilla-shake.png",
      toppingsAllowed: true,
    },
    {
      id: "oreo-chocolate-shake",
      name: "Oreo Chocolate Shake",
      description: "Rich chocolate shake with Oreo pieces.",
      price: 70,
      image: "/images/oreo-chocolate-shake.png",
      toppingsAllowed: true,
    },
  ],
  cookieToppings: [
    { id: "cookie-mm", name: "M&M’s", price: 5 },
    { id: "cookie-marshmallows", name: "Marshmallows", price: 5 },
    { id: "cookie-oreo", name: "Oreos", price: 5 },
    { id: "cookie-biscoff", name: "Biscoff", price: 5 },
    { id: "cookie-kinder", name: "Kinder", price: 5 },
    { id: "cookie-chocolate-drizzle", name: "Chocolate drizzle", price: 5 },
  ],
  drinkToppings: [
    { id: "drink-crushed-oreos", name: "Crushed Oreos", price: 5 },
    { id: "drink-marshmallows", name: "Marshmallows", price: 5 },
    { id: "drink-whipped-cream", name: "Whipped cream", price: 5 },
    { id: "drink-chocolate-drizzle", name: "Chocolate drizzle", price: 5 },
  ],
  orderDays: {
    days: [...weekdays],
unavailableDays: ["Friday", "Saturday"],
  },
};
