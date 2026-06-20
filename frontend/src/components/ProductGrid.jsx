import ProductCard from "@/components/ProductCard";
import EmptyState from "@/components/EmptyState";

export default function ProductGrid({
  products,
  emptyTitle = "No products found",
  desktopColumns = 4,
  onWishlistChange,
}) {
  if (!products.length) {
    return <EmptyState title={emptyTitle} description="Try changing the current filter." />;
  }

  const gridClassName =
    desktopColumns === 3
      ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className={gridClassName}>
      {products.map((product) => (
        <ProductCard
          key={product.ProductID}
          product={product}
          onWishlistChange={onWishlistChange}
        />
      ))}
    </div>
  );
}
