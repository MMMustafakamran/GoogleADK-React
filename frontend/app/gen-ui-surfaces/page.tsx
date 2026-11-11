"use client";
import { CopilotChat } from "@copilotkit/react-core/v2";
import { FeaturedProducts } from "./featured";

// HARNESS: sample products for the fallback row (the doc passes products but never shows any)
const PRODUCTS = [
  { name: "Trail Runner", price: 89, imageUrl: "https://picsum.photos/seed/a/200" },
  { name: "Road Racer", price: 129, imageUrl: "https://picsum.photos/seed/b/200" },
];

export default function Page() {
  return (
    <>
      <h2>Featured Products</h2>
      <FeaturedProducts products={PRODUCTS} />
      <CopilotChat agentId="my_agent" />{/* HARNESS: agentId -> the quickstart ADK agent */}
    </>
  );
}
