"use client";
import { useState } from "react";
import { CopilotChat } from "@copilotkit/react-core/v2";
import { CartActions, type Cart } from "./actions";

export default function Page() {
  // HARNESS: a minimal cart store so the doc's CartActions has something to add to
  const [items, setItems] = useState<Cart["items"]>([]);
  const cart: Cart = { items, addItem: (productId, quantity) => setItems((xs) => [...xs, { productId, quantity }]) };
  return (
    <>
      <CartActions cart={cart} />
      <p data-testid="cart">Cart: {items.map((i) => `${i.productId} x${i.quantity}`).join(", ") || "empty"}</p>
      <CopilotChat agentId="my_agent" />{/* HARNESS: agentId -> the quickstart ADK agent */}
    </>
  );
}
