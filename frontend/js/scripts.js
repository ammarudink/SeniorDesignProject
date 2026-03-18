function updateNavBar() {
    const user = Utils.getCurrentUser();
    const isLoggedIn = Utils.isLoggedIn() && !!user;

    $("#loginNavItem, #registerNavItem").toggle(!isLoggedIn);
    $("#userDropdown").toggleClass("d-none", !isLoggedIn);
    $("#userName").text(isLoggedIn ? user.Name : "");
}

function attachAddToCartListeners() {
    ProductService.attachEventHandlers();
}

function attachAddToWishlistListeners() {
    ProductService.attachEventHandlers();
}

function attachProductLinkListeners() {
    ProductService.attachEventHandlers();
}

function updatePagination(currentPage, totalPages) {
    const pagination = $("#pagination");
    if (!pagination.length) return;

    pagination.empty();

    const createPageItem = (label, page, disabled, active) => `
        <li class="page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}">
            <a class="page-link" href="#" data-page="${page}">${label}</a>
        </li>
    `;

    pagination.append(createPageItem("Previous", currentPage - 1, currentPage <= 1, false));

    for (let page = 1; page <= totalPages; page += 1) {
        pagination.append(createPageItem(page, page, false, page === currentPage));
    }

    pagination.append(createPageItem("Next", currentPage + 1, currentPage >= totalPages, false));

    pagination.find(".page-link").off("click").on("click", function (event) {
        event.preventDefault();
        const targetPage = Number($(this).data("page"));
        if (!Number.isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
            ProductService.getAllProducts(targetPage);
        }
    });
}

async function updateCartCount() {
    const cartCount = document.getElementById("cart-count");
    if (!cartCount) return 0;

    if (!Utils.isLoggedIn()) {
        cartCount.textContent = "0";
        return 0;
    }

    try {
        const result = await $.ajax({
            url: Constants.project_base_url() + "cart",
            type: "GET"
        });

        const totalQuantity = (result.data || []).reduce((sum, item) => sum + Number(item.Quantity || 0), 0);
        cartCount.textContent = totalQuantity;
        return totalQuantity;
    } catch (xhr) {
        cartCount.textContent = "0";
        return 0;
    }
}

async function renderCart() {
    const cartItemsContainer = $("#cart-items");
    const cartTotal = $("#cart-total");

    if (!cartItemsContainer.length || !cartTotal.length) {
        return [];
    }

    if (!Utils.isLoggedIn()) {
        cartItemsContainer.html('<tr><td colspan="5" class="text-center">Please login to view your cart.</td></tr>');
        cartTotal.text("0.00KM");
        return [];
    }

    try {
        const result = await $.ajax({
            url: Constants.project_base_url() + "cart",
            type: "GET"
        });

        const items = result.data || [];
        window.__cartItems = items;
        cartItemsContainer.empty();

        if (!items.length) {
            cartItemsContainer.html('<tr><td colspan="5" class="text-center">Your cart is empty.</td></tr>');
            cartTotal.text("0.00KM");
            return [];
        }

        let total = 0;

        items.forEach((item) => {
            const product = item.Product || {};
            const unitPrice = Number(product.SalePrice || product.Price || 0);
            const quantity = Number(item.Quantity || 0);
            const lineTotal = unitPrice * quantity;
            total += lineTotal;

            cartItemsContainer.append(`
                <tr>
                    <td>${product.Name || "Unknown Product"}</td>
                    <td>${unitPrice.toFixed(2)} KM</td>
                    <td>
                        <div class="input-group input-group-sm" style="width: 120px;">
                            <button class="btn btn-outline-secondary btn-sm-width quantity-decrease" type="button" data-cart-id="${item.CartID}">-</button>
                            <input class="form-control cart-quantity text-center" value="${quantity}" min="1" readonly>
                            <button class="btn btn-outline-secondary btn-sm-width quantity-increase" type="button" data-cart-id="${item.CartID}">+</button>
                        </div>
                    </td>
                    <td>${lineTotal.toFixed(2)} KM</td>
                    <td><button class="btn btn-sm btn-danger remove-from-cart" data-cart-id="${item.CartID}">Remove</button></td>
                </tr>
            `);
        });

        cartTotal.text(`${total.toFixed(2)}KM`);
        await updateCartCount();
        return items;
    } catch (xhr) {
        cartItemsContainer.html('<tr><td colspan="5" class="text-center">Failed to load cart.</td></tr>');
        cartTotal.text("0.00KM");
        toastr.error(xhr.responseJSON?.message || "Failed to load cart");
        return [];
    }
}

async function updateQuantity(cartId, change) {
    const items = window.__cartItems || [];
    const existingItem = items.find((item) => Number(item.CartID) === Number(cartId));
    if (!existingItem) return;

    const nextQuantity = Math.max(1, Number(existingItem.Quantity) + change);

    try {
        await $.ajax({
            url: Constants.project_base_url() + `cart/${cartId}`,
            type: "PATCH",
            data: JSON.stringify({ Quantity: nextQuantity }),
            contentType: "application/json"
        });

        await renderCart();
    } catch (xhr) {
        toastr.error(xhr.responseJSON?.message || "Failed to update cart");
    }
}

async function removeFromCart(cartId) {
    try {
        await $.ajax({
            url: Constants.project_base_url() + `cart/${cartId}`,
            type: "DELETE"
        });

        await renderCart();
    } catch (xhr) {
        toastr.error(xhr.responseJSON?.message || "Failed to remove item from cart");
    }
}

function initializeCreditCardValidation() {
    $("#cardNumber").off("input").on("input", function () {
        this.value = this.value.replace(/\D/g, "").slice(0, 16);
    });

    $("#cvc").off("input").on("input", function () {
        this.value = this.value.replace(/\D/g, "").slice(0, 3);
    });

    $("#expiryDate").off("input").on("input", function () {
        let value = this.value.replace(/\D/g, "").slice(0, 4);
        if (value.length >= 3) {
            value = `${value.slice(0, 2)}/${value.slice(2)}`;
        }
        this.value = value;
    });
}

async function submitCheckout(paymentPayload) {
    try {
        const orderResponse = await $.ajax({
            url: Constants.project_base_url() + "orders",
            type: "POST",
            data: JSON.stringify({ useCart: true }),
            contentType: "application/json"
        });

        const order = orderResponse.data;

        await $.ajax({
            url: Constants.project_base_url() + "payments",
            type: "POST",
            data: JSON.stringify({
                OrderID: order.OrderID,
                ...paymentPayload
            }),
            contentType: "application/json"
        });

        toastr.success("Order placed successfully");
        $("#creditCardModal").modal("hide");
        $("#credit-card-form")[0]?.reset();
        await renderCart();

        if (window.location.hash.startsWith("#profile")) {
            ProfileService.loadOrderHistory();
        }
    } catch (xhr) {
        toastr.error(xhr.responseJSON?.message || "Failed to place order");
    }
}

function initializeCartPage() {
    renderCart();

    $("#cart-items")
        .off("click", ".quantity-increase")
        .on("click", ".quantity-increase", function () {
            updateQuantity($(this).data("cart-id"), 1);
        });

    $("#cart-items")
        .off("click", ".quantity-decrease")
        .on("click", ".quantity-decrease", function () {
            updateQuantity($(this).data("cart-id"), -1);
        });

    $("#cart-items")
        .off("click", ".remove-from-cart")
        .on("click", ".remove-from-cart", function () {
            removeFromCart($(this).data("cart-id"));
        });

    $("#checkout-form").off("submit").on("submit", function (event) {
        event.preventDefault();

        if (!Utils.isLoggedIn()) {
            toastr.error("Please login to checkout");
            window.location.hash = "#login";
            return;
        }

        const paymentMethod = $('input[name="paymentMethod"]:checked').val();
        if (paymentMethod === "credit-card") {
            $("#creditCardModal").modal("show");
            return;
        }

        submitCheckout({
            PaymentMethod: "cash"
        });
    });

    $("#credit-card-form").off("submit").on("submit", function (event) {
        event.preventDefault();

        submitCheckout({
            PaymentMethod: "credit-card",
            CardNumber: $("#cardNumber").val(),
            ExpiryDate: $("#expiryDate").val(),
            Cvc: $("#cvc").val()
        });
    });
}

async function updateWishlistPage() {
    const container = $("#wishlist-items");
    if (!container.length) return;

    if (!Utils.isLoggedIn()) {
        container.html('<div class="col text-center">Please login to view your wishlist.</div>');
        return;
    }

    try {
        const result = await $.ajax({
            url: Constants.project_base_url() + "wishlist",
            type: "GET"
        });

        const items = result.data || [];
        const ids = items.map((item) => item.ProductID);
        localStorage.setItem("wishlist", JSON.stringify(ids));
        container.empty();

        if (!items.length) {
            container.html('<div class="col text-center">Your wishlist is empty.</div>');
            return;
        }

        items.forEach((item) => {
            const product = item.Product;
            container.append(`
                <div class="col mb-5">
                    <div class="card h-100">
                        ${product.SalePrice ? '<div class="badge bg-dark text-white position-absolute" style="top: 0.5rem; right: 0.5rem">Sale</div>' : ''}
                        <a href="${ProductService.getProductPageUrl(product.ProductID)}" class="product-link" data-id="${product.ProductID}">
                            <img class="card-img-top" src="${product.Images || 'frontend/assets/noImage.png'}" alt="${product.Name}" />
                        </a>
                        <div class="card-body p-4">
                            <div class="text-center">
                                <a href="${ProductService.getProductPageUrl(product.ProductID)}" class="product-link text-decoration-none text-dark" data-id="${product.ProductID}">
                                    <h5 class="fw-bolder">${product.Name}</h5>
                                </a>
                                <div class="price mb-3">
                                    ${product.SalePrice ?
                                        `<span class="text-muted text-decoration-line-through">${product.Price}KM</span> ${product.SalePrice}KM` :
                                        `${product.Price}KM`}
                                </div>
                            </div>
                        </div>
                        <div class="card-footer p-4 pt-0 border-top-0 bg-transparent text-center">
                            <button class="btn btn-outline-dark mt-auto remove-from-wishlist" data-id="${product.ProductID}">Remove</button>
                        </div>
                    </div>
                </div>
            `);
        });

        $(".remove-from-wishlist").off("click").on("click", async function () {
            const productId = Number($(this).data("id"));
            try {
                await $.ajax({
                    url: Constants.project_base_url() + `wishlist/${productId}`,
                    type: "DELETE"
                });
                await updateWishlistPage();
                toastr.success("Removed from wishlist");
            } catch (xhr) {
                toastr.error(xhr.responseJSON?.message || "Failed to remove wishlist item");
            }
        });
    } catch (xhr) {
        container.html('<div class="col text-center">Failed to load wishlist.</div>');
    }
}

function fetchOnSaleItems() {
    const itemsContainer = $("#onsale-items");
    if (!itemsContainer.length) return;

    ProductService.getOnSaleProducts().then((result) => {
        const products = result.data?.products || [];
        itemsContainer.empty();

        if (!products.length) {
            itemsContainer.html('<div class="col-12 text-center"><p>No items currently on sale.</p></div>');
            return;
        }

        products.forEach((product) => {
            itemsContainer.append(ProductService.renderProductCard(product));
        });
    }).catch((xhr) => {
        toastr.error(xhr.responseJSON?.message || "Failed to load on-sale products");
    });
}

function loadProductsIntoSelect() {
    ProfileService.loadProductsIntoSelect();
}

function updateProduct() {
    ProfileService.updateProduct();
}

function deleteUser() {
    ProfileService.deleteUser();
}

updateNavBar();
updateCartCount();

