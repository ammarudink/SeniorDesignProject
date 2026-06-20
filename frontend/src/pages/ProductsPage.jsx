import { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProductGrid from "@/components/ProductGrid";
import { productService } from "@/services/productService";

export default function ProductsPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    productService.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");

    productService
      .getProducts({
        page: pagination.page,
        limit: 9,
        categories: selectedCategories,
        search: searchTerm,
        sort: sortBy,
      })
      .then((result) => {
        setProducts(result.products || []);
        setPagination((previous) => ({
          ...previous,
          page: result.pagination?.page || 1,
          total: result.pagination?.total || 0,
          totalPages: result.pagination?.totalPages || 1,
        }));
      })
      .catch((reason) => setError(reason.message || "Failed to load products"))
      .finally(() => setLoading(false));
  }, [pagination.page, searchTerm, selectedCategories, sortBy]);

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

  function handleSearchSubmit(event) {
    event.preventDefault();
    setPagination((previous) => ({ ...previous, page: 1 }));
    setSearchTerm(searchInput.trim());
  }

  function handleSortChange(event) {
    setPagination((previous) => ({ ...previous, page: 1 }));
    setSortBy(event.target.value);
  }

  function clearFilters() {
    setSearchInput("");
    setSearchTerm("");
    setSortBy("newest");
    setSelectedCategories([]);
    setPagination((previous) => ({ ...previous, page: 1 }));
  }

  return (
    <section className="py-5 px-3 sm:px-4">
      <div className="container px-4 px-lg-5 mt-3 sm:mt-5 max-w-7xl">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <div>
            <h1 className="display-6 fw-bolder mb-1">All Products</h1>
            <p className="text-muted mb-0">Browse the full catalog with 9 products per page.</p>
          </div>
          <div className="text-muted small">
            {pagination.total} products found
          </div>
        </div>

        <div className="row gy-4">
          <div className="col-lg-3 mb-4">
            <div className="category-sidebar sticky-lg-top">
              <h4 className="fw-bolder mb-3">Categories</h4>
              <div className="category-filter-panel grid gap-2">
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
            <div className="catalog-toolbar">
              <form className="catalog-search-form" onSubmit={handleSearchSubmit}>
                <input
                  className="form-control min-h-11"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search products, categories, or descriptions"
                  aria-label="Search products"
                />
                <button className="btn btn-dark min-h-11" type="submit">
                  Search
                </button>
              </form>
              <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                <select
                  className="form-select catalog-sort-select min-h-11"
                  value={sortBy}
                  onChange={handleSortChange}
                  aria-label="Sort products"
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="name-asc">Name: A to Z</option>
                </select>
                <button className="btn btn-outline-dark min-h-11" type="button" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            </div>
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
