var ProductService = {
    init: function() {
        this.attachEventHandlers();

        if (window.Utils && Utils.isLoggedIn()) {
            this.syncWishlistCache();
        }
    },

    getProductPageUrl: function(productId) {
        return '#product';
    },

    setSelectedProductId: function(productId) {
        if (productId) {
            sessionStorage.setItem('selectedProductId', String(productId));
        }
    },

    getSelectedProductId: function() {
        return sessionStorage.getItem('selectedProductId');
    },

    normalizeProductHash: function() {
        const hash = window.location.hash || '';
        if (!hash.startsWith('#product?')) {
            return;
        }

        const query = hash.includes('?') ? hash.split('?')[1] : '';
        const productId = new URLSearchParams(query).get('id');
        if (productId) {
            this.setSelectedProductId(productId);
        }

        history.replaceState(null, '', `${window.location.pathname}${window.location.search}#product`);
    },

    openProduct: function(productId) {
        this.setSelectedProductId(productId);

        if (window.location.hash === '#product') {
            this.loadProductPageFromHash();
            return;
        }

        window.location.hash = '#product';
    },

    fetchProductById: async function(productId) {
        const response = await fetch(Constants.project_base_url() + `products/${productId}`, {
            headers: {
                Accept: 'application/json'
            }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const error = new Error(data.message || 'Failed to load product');
            error.status = response.status;
            throw error;
        }

        return data.data;
    },

    formatPriceHtml: function(product) {
        if (product.SalePrice) {
            return `
                <span class="text-muted text-decoration-line-through">${product.Price} KM</span>
                <span class="text-danger ms-2">${product.SalePrice} KM</span>
            `;
        }

        return `${product.Price} KM`;
    },

    setProductViewState: function(state, message) {
        const loading = $('#product-loading');
        const error = $('#product-error');
        const content = $('#product-content');

        if (!loading.length || !error.length || !content.length) {
            return;
        }

        loading.toggleClass('d-none', state !== 'loading');
        error.toggleClass('d-none', state !== 'error');
        content.toggleClass('d-none', state !== 'ready');

        if (message) {
            $('#product-error-message').text(message);
        }
    },

    renderProductPage: function(product) {
        const wishlist = this.getWishlistCache();
        const isInWishlist = wishlist.includes(product.ProductID);
        const actions = $('#product-actions');

        $('#product-name').text(product.Name || 'Unnamed product');
        $('#product-category').text(`Category: ${product.Category || 'Uncategorized'}`);
        $('#product-description').text(product.Description || 'No description available.');
        $('#product-price').html(this.formatPriceHtml(product));
        $('#product-image')
            .attr('src', product.Images || 'frontend/assets/noImage.png')
            .attr('alt', product.Name || 'Product image');

        actions.html(`
            <button class="btn btn-outline-dark add-to-cart"
                data-id="${product.ProductID}"
                data-name="${product.Name || ''}"
                data-price="${product.SalePrice || product.Price || ''}">
                <i class="bi-cart-fill me-1"></i>
                Add to cart
            </button>
            <img src="frontend/assets/${isInWishlist ? 'fheart.png' : 'nfheart.png'}"
                 class="wishlist-icon"
                 style="width: 24px; height: 24px; cursor: pointer;"
                 data-id="${product.ProductID}"
                 alt="Wishlist" />
        `);

        this.setProductViewState('ready');
    },

    loadProductDetails: async function(productId) {
        const relatedContainer = $('#related-items');

        if (relatedContainer.length) {
            relatedContainer.empty();
        }

        if (!productId) {
            this.setProductViewState('error', 'Product not found');
            return;
        }

        this.setProductViewState('loading');

        try {
            const product = await this.fetchProductById(productId);

            if (!product) {
                this.setProductViewState('error', 'Product not found');
                return;
            }

            this.renderProductPage(product);

            if (product.Category && relatedContainer.length) {
                this.getRelatedProducts(product.ProductID, product.Category);
            }
        } catch (error) {
            const message = error.status === 404
                ? 'Product not found'
                : (error.message || 'Failed to load product details');
            this.setProductViewState('error', message);
        }
    },

    loadProductPageFromHash: function() {
        this.normalizeProductHash();
        return this.loadProductDetails(this.getSelectedProductId());
    },

    attachEventHandlers: function() {
        $(document).off('click', '.add-to-cart').on('click', '.add-to-cart', async (e) => {
            e.preventDefault();
            const button = $(e.currentTarget);
            await this.addToCart(button);
        });

        $(document).off('click', '.product-link').on('click', '.product-link', (e) => {
            const productId = Number($(e.currentTarget).data('id'));
            if (!productId) {
                return;
            }

            e.preventDefault();
            this.openProduct(productId);
        });

        $(document).off('click', '.wishlist-icon').on('click', '.wishlist-icon', async (e) => {
            e.preventDefault();
            const icon = $(e.currentTarget);
            const productId = Number(icon.data('id'));
            await this.toggleWishlist(productId, icon);
        });
    },

    getWishlistCache: function() {
        try {
            return JSON.parse(localStorage.getItem('wishlist') || '[]');
        } catch {
            return [];
        }
    },

    setWishlistCache: function(ids) {
        localStorage.setItem('wishlist', JSON.stringify(ids));
    },

    syncWishlistCache: function() {
        return $.ajax({
            url: Constants.project_base_url() + "wishlist",
            type: "GET"
        }).then((result) => {
            const ids = (result.data || []).map((item) => item.ProductID);
            this.setWishlistCache(ids);
            return ids;
        }).catch(() => []);
    },

    toggleWishlist: async function(productId, icon) {
        const cache = this.getWishlistCache();
        const isInWishlist = cache.includes(productId);

        try {
            if (isInWishlist) {
                await $.ajax({
                    url: Constants.project_base_url() + `wishlist/${productId}`,
                    type: "DELETE"
                });
                this.setWishlistCache(cache.filter((id) => id !== productId));
                icon.attr('src', 'frontend/assets/nfheart.png');
                toastr.success('Removed from wishlist');
            } else {
                await $.ajax({
                    url: Constants.project_base_url() + "wishlist",
                    type: "POST",
                    data: JSON.stringify({ ProductID: productId }),
                    contentType: "application/json"
                });
                this.setWishlistCache([...cache, productId]);
                icon.attr('src', 'frontend/assets/fheart.png');
                toastr.success('Added to wishlist');
            }

            if (window.location.hash.startsWith('#product')) {
                this.loadProductPageFromHash();
            }

            if (typeof updateWishlistPage === 'function' && window.location.hash.startsWith('#wishlist')) {
                updateWishlistPage();
            }
        } catch (xhr) {
            toastr.error(xhr.responseJSON?.message || 'Failed to update wishlist');
        }
    },

    addToCart: async function(button) {
        const productId = Number(button.data('id'));

        try {
            await $.ajax({
                url: Constants.project_base_url() + "cart",
                type: "POST",
                data: JSON.stringify({
                    ProductID: productId,
                    Quantity: 1
                }),
                contentType: "application/json"
            });

            if (typeof updateCartCount === 'function') {
                await updateCartCount();
            }

            toastr.success('Product added to cart');
        } catch (xhr) {
            toastr.error(xhr.responseJSON?.message || 'Failed to add product to cart');
        }
    },

    getRelatedProducts: function(productId, category) {
        return $.ajax({
            url: Constants.project_base_url() + `products/related?category=${encodeURIComponent(category)}&exclude=${productId}`,
            type: "GET",
            success: (result) => {
                const products = result?.data || [];
                const container = $('#related-items');
                container.empty();

                products.forEach((product) => {
                    container.append(this.renderProductCard(product));
                });
            }
        });
    },

    getDashboardProducts: function() {
        return $.ajax({
            url: Constants.project_base_url() + "products/dashboard",
            type: "GET",
            beforeSend: function() {
                $.blockUI({ message: '<h3>Loading products...</h3>' });
            },
            success: (result) => {
                const products = result?.data || [];
                const container = $('#dashboard-items');
                container.empty();

                products.forEach((product) => {
                    container.append(this.renderProductCard(product));
                });
            },
            error: function(xhr) {
                toastr.error(xhr.responseJSON?.message || 'Failed to load products');
            },
            complete: function() {
                $.unblockUI();
            }
        });
    },

    getOnSaleProducts: function() {
        return $.ajax({
            url: Constants.project_base_url() + "products",
            type: "GET",
            data: {
                onSale: true,
                limit: 50
            }
        });
    },

    getCategories: function() {
        return $.ajax({
            url: Constants.project_base_url() + "products/categories",
            type: "GET"
        }).then((result) => {
            const categories = result?.data || [];
            const list = $('#category-filters .list-group');

            if (!list.length) {
                return categories;
            }

            list.empty();
            categories.forEach((category) => {
                const id = `category-${category.replace(/\s+/g, '-').toLowerCase()}`;
                list.append(`
                    <li class="list-group-item">
                        <div class="form-check">
                            <input class="form-check-input category-filter" type="checkbox" value="${category}" id="${id}">
                            <label class="form-check-label" for="${id}">${category}</label>
                        </div>
                    </li>
                `);
            });

            $(document).off('change', '.category-filter').on('change', '.category-filter', () => {
                this.getAllProducts(1);
            });

            return categories;
        });
    },

    updateProduct: function(productId, data) {
        return $.ajax({
            url: Constants.project_base_url() + "products/" + productId,
            type: "PATCH",
            data: JSON.stringify(data),
            contentType: "application/json"
        });
    },

    renderProductCard: function(product) {
        const wishlist = this.getWishlistCache();
        const isInWishlist = wishlist.includes(product.ProductID);
        const productUrl = this.getProductPageUrl(product.ProductID);

        return `
            <div class="col mb-5">
                <div class="card h-100">
                    ${product.SalePrice ? '<div class="badge bg-dark text-white position-absolute" style="top: 0.5rem; right: 0.5rem">Sale</div>' : ''}
                    <a href="${productUrl}" class="product-link" data-id="${product.ProductID}">
                        <img class="card-img-top" src="${product.Images || 'frontend/assets/noImage.png'}" alt="${product.Name}">
                    </a>
                    <div class="card-body p-4">
                        <div class="text-center">
                            <h5 class="fw-bolder"><a href="${productUrl}" class="product-link text-decoration-none text-dark" data-id="${product.ProductID}">${product.Name}</a></h5>
                            <div class="price mb-3">
                                ${product.SalePrice ?
                                    `<span class="text-muted text-decoration-line-through">${product.Price}KM</span> ${product.SalePrice}KM` :
                                    `${product.Price}KM`}
                            </div>
                        </div>
                    </div>
                    <div class="card-footer p-4 pt-0 border-top-0 bg-transparent">
                        <div class="text-center">
                            <div class="d-flex justify-content-center align-items-center gap-2 mb-1">
                                <button class="btn btn-outline-dark add-to-cart"
                                    data-id="${product.ProductID}"
                                    data-name="${product.Name}"
                                    data-price="${product.SalePrice || product.Price}">
                                    Add to cart
                                </button>
                                <img src="frontend/assets/${isInWishlist ? 'fheart.png' : 'nfheart.png'}"
                                     class="wishlist-icon"
                                     style="width: 24px; height: 24px; cursor: pointer;"
                                     id="wishlist-icon-${product.ProductID}"
                                     data-id="${product.ProductID}"
                                     alt="Add to wishlist" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getAllProducts: function(page = 1) {
        const selectedCategories = Array.from(document.querySelectorAll('.category-filter:checked'))
            .map((checkbox) => checkbox.value);

        return $.ajax({
            url: Constants.project_base_url() + "products",
            type: "GET",
            data: {
                page: page,
                limit: 9,
                categories: JSON.stringify(selectedCategories)
            },
            success: (result) => {
                const payload = result?.data || {};
                const products = payload.products || [];
                const pagination = payload.pagination || {};

                const container = $('#product-container');
                container.empty();

                products.forEach((product) => {
                    container.append(this.renderProductCard(product));
                });

                if (typeof updatePagination === 'function') {
                    updatePagination(pagination.page || 1, pagination.totalPages || 1);
                }
            },
            error: function(xhr) {
                toastr.error(xhr.responseJSON?.message || 'Failed to load products');
            }
        });
    }
};
