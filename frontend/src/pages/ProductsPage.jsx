import { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProductGrid from "@/components/ProductGrid";
import { productService } from "@/services/productService";

export default function ProductsPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    productService.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");

    productService
      .getProducts({ page: pagination.page, limit: 9, categories: selectedCategories })
      .then((result) => {
        setProducts(result.products || []);
        setPagination((previous) => ({
          ...previous,
          page: result.pagination?.page || 1,
          totalPages: result.pagination?.totalPages || 1,
        }));
      })
      .catch((reason) => setError(reason.message || "Failed to load products"))
      .finally(() => setLoading(false));
  }, [pagination.page, selectedCategories]);

  const pages = useMemo(
    () => Array.from({ length: pagination.totalPages }, (_, index) => index + 1),
    [pagination.totalPages],
  );

  function toggleCategory(category) {
    setPagination((previous) => ({ ...previous, page: 1 }));
    setSelectedCategories((previous) =>
      previous.includes(category)
        ? previous.filter((entry) => entry !== category)
        : [...previous, category],
    );
  }

  return (
    <section className="py-5">
      <div className="container px-4 px-lg-5 mt-5">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <div>
            <h1 className="display-6 fw-bolder mb-1">All Products</h1>
            <p className="text-muted mb-0">Browse the full catalog with 9 products per page.</p>
          </div>
          <div className="text-muted small">
            Showing page {pagination.page} of {pagination.totalPages}
          </div>
        </div>

        <div className="row">
          <div className="col-lg-3 mb-4">
            <div className="category-sidebar">
              <h4 className="fw-bolder mb-3">Categories</h4>
              <div className="category-filter-panel">
                <div className="form-check category-filter-option">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="all-categories"
                    checked={selectedCategories.length === 0}
                    onChange={() => {
                      setSelectedCategories([]);
                      setPagination((previous) => ({ ...previous, page: 1 }));
                    }}
                  />
                  <label className="form-check-label" htmlFor="all-categories">
                    All Categories
                  </label>
                </div>
                <hr className="my-3" />
                {categories.map((category) => {
                  const inputId = `category-${category.replace(/\s+/g, "-").toLowerCase()}`;

                  return (
                    <div className="form-check category-filter-option" key={category}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={inputId}
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                      />
                      <label className="form-check-label" htmlFor={inputId}>
                        {category}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-lg-9">
            {loading ? <LoadingSpinner label="Loading products..." /> : null}
            {!loading && error ? <div className="alert alert-danger">{error}</div> : null}
            {!loading && !error ? <ProductGrid products={products} desktopColumns={3} /> : null}
            {!loading && !error && pagination.totalPages > 1 ? (
              <nav className="mt-4">
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${pagination.page <= 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      type="button"
                      onClick={() =>
                        setPagination((previous) => ({ ...previous, page: Math.max(1, previous.page - 1) }))
                      }
                    >
                      Previous
                    </button>
                  </li>
                  {pages.map((pageNumber) => (
                    <li key={pageNumber} className={`page-item ${pageNumber === pagination.page ? "active" : ""}`}>
                      <button
                        className="page-link"
                        type="button"
                        onClick={() => setPagination((previous) => ({ ...previous, page: pageNumber }))}
                      >
                        {pageNumber}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${pagination.page >= pagination.totalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      type="button"
                      onClick={() =>
                        setPagination((previous) => ({
                          ...previous,
                          page: Math.min(previous.totalPages || 1, previous.page + 1),
                        }))
                      }
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
