import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/legacy-styles.css";
import "./styles/legacy-product.css";
import "./styles/react-overrides.css";
import "./styles/tailwind.css";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { ToastProvider } from "./contexts/ToastContext";
import { WishlistProvider } from "./contexts/WishlistContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>,
);
