import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProductGrid from "@/components/ProductGrid";
import { productService } from "@/services/productService";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    productService
      .getDashboardProducts()
      .then(setProducts)
      .catch((reason) => setError(reason.message || "Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <header className="bg-dark py-5">
        <div className="container px-4 px-lg-5 my-5">
          <div className="text-center text-white">
            <h1 className="display-4 fw-bolder">Welcome to TechGear</h1>
            <p className="lead fw-normal text-white-50 mb-4">BEST COMPONENTS AND PRICES</p>
            <Link to="/products" className="btn btn-light btn-lg px-4">
              Shop Now
            </Link>
          </div>
        </div>
      </header>
      <section className="py-5">
        <div className="container px-4 px-lg-5 mt-5">
          {loading ? <LoadingSpinner label="Loading featured products..." /> : null}
          {!loading && error ? <div className="alert alert-danger">{error}</div> : null}
          {!loading && !error ? <ProductGrid products={products} emptyTitle="No featured products" /> : null}
        </div>
      </section>
    </>
  );
}
