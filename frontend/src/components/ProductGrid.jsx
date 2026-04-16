import ProductCard from "@/components/ProductCard";
import EmptyState from "@/components/EmptyState";

export default function ProductGrid({
  products,
  emptyTitle = "No products found",
  desktopColumns = 4,
}) {
  if (!products.length) {
    return <EmptyState title={emptyTitle} description="Try changing the current filter." />;
  }

  const gridClassName =
    desktopColumns === 3
      ? "row gx-4 gx-lg-5 row-cols-2 row-cols-md-3 row-cols-xl-3"
      : "row gx-4 gx-lg-5 row-cols-2 row-cols-md-3 row-cols-xl-4";

  return (
    <div className={gridClassName}>
      {products.map((product) => (
        <ProductCard key={product.ProductID} product={product} />
      ))}
    </div>
  );
}
