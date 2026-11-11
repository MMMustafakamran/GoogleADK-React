import { useGenerativeUIFunction } from "@copilotkit/react-core/v2/generative-ui";
import { shopUI } from "./catalog";

// HARNESS: Cart is used by the doc but never defined; minimal type
export type Cart = { items: { productId: string; quantity: number }[]; addItem: (id: string, q: number) => void };

export function CartActions({ cart }: { cart: Cart }) {
  useGenerativeUIFunction(shopUI, "addToCart", ({ productId, quantity }) => {
    cart.addItem(productId, quantity);
    return { added: productId };
  });
  return null;
}
