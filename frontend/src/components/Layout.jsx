import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

function navClassName({ isActive }) {
  return `nav-link${isActive ? " active" : ""}`;
}

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const collapseRef = useRef(null);
  const productsToggleRef = useRef(null);
  const userToggleRef = useRef(null);
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const productsMenuActive =
    location.pathname === "/products" ||
    location.pathname === "/onsale" ||
    location.pathname.startsWith("/products/");

  function closeNavigationUi() {
    if (window.bootstrap && collapseRef.current) {
      const collapse = window.bootstrap.Collapse.getOrCreateInstance(collapseRef.current, {
        toggle: false,
      });
      collapse.hide();
    }

    if (window.bootstrap && productsToggleRef.current) {
      const dropdown = window.bootstrap.Dropdown.getOrCreateInstance(productsToggleRef.current);
      dropdown.hide();
    }

    if (window.bootstrap && userToggleRef.current) {
      const dropdown = window.bootstrap.Dropdown.getOrCreateInstance(userToggleRef.current);
      dropdown.hide();
    }
  }

  useEffect(() => {
    closeNavigationUi();
  }, [location.pathname]);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container px-4 px-lg-5">
        <Link className="navbar-brand" to="/" onClick={closeNavigationUi}>
          Tech<span style={{ fontWeight: "bold" }}>Gear</span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent" ref={collapseRef}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4">
            <li className="nav-item">
              <NavLink className={navClassName} to="/" onClick={closeNavigationUi}>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={navClassName} to="/wishlist" onClick={closeNavigationUi}>
                Wishlist
              </NavLink>
            </li>
            <li className="nav-item dropdown">
              <button
                ref={productsToggleRef}
                className={`nav-link dropdown-toggle products-dropdown-toggle${productsMenuActive ? " active" : ""}`}
                id="productsDropdown"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Products
              </button>
              <ul className="dropdown-menu products-dropdown-menu" aria-labelledby="productsDropdown">
                <li>
                  <Link className="dropdown-item" to="/products" onClick={closeNavigationUi}>
                    All Products
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/onsale" onClick={closeNavigationUi}>
                    On Sale
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
          <div className="d-flex align-items-center gap-3">
            <Link className="btn btn-outline-dark" to="/cart" onClick={closeNavigationUi}>
              <i className="bi-cart-fill me-1" /> Cart
              <span className="badge bg-dark text-white ms-1 rounded-pill">{cartCount}</span>
            </Link>
            {!isAuthenticated ? (
              <>
                <Link className="btn btn-outline-dark login-nav-button" to="/login" onClick={closeNavigationUi}>
                  Login
                </Link>
                <Link className="btn btn-dark text-white" to="/register" onClick={closeNavigationUi}>
                  Register
                </Link>
              </>
            ) : (
              <div className="dropdown">
                <button
                  ref={userToggleRef}
                  className="nav-link dropdown-toggle user-dropdown-toggle text-decoration-none d-flex align-items-center gap-2"
                  data-bs-toggle="dropdown"
                  type="button"
                >
                  <img src="/assets/profileIcon.png" alt="Profile" style={{ width: 30, height: 30 }} />
                  <span>{user?.Name}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end products-dropdown-menu">
                  <li>
                    <Link className="dropdown-item" to="/profile" onClick={closeNavigationUi}>
                      My Profile
                    </Link>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      type="button"
                      onClick={() => {
                        closeNavigationUi();
                        logout();
                        navigate("/login", { replace: true });
                      }}
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-content">
        <Outlet />
      </main>
      <footer className="py-5 bg-dark text-white text-center mt-auto">
        <div className="container">
          <p className="m-0 text-center text-white">Copyright © Your Website 2023</p>
        </div>
      </footer>
    </div>
  );
}
