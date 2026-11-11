import { GenerativeUISurface } from "@copilotkit/react-core/v2/generative-ui";
import { shopUI } from "./catalog";

// HARNESS: Product and ProductRow are used by the doc but never defined on the page; minimal stubs.
type Product = { name: string; price: number; imageUrl: string };
function ProductRow({ products }: { products: Product[] }) {
  return <div data-testid="product-row">{products.map((p) => <span key={p.name} style={{ marginRight: 12 }}>{p.name} ${p.price}</span>)}</div>;
}

export function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <GenerativeUISurface
      id="featured"
      ui={shopUI}
      description="The Featured Products row of the home page. When the customer asks to see products here, show them as a ProductGrid with one ProductCard for each product. When they ask for the featured products again, delete this surface."
      components={["ProductGrid", "ProductCard"]}
      fallback={<ProductRow products={products} />}
    />
  );
}
