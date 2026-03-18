var ProfileService = {
    init: function() {
        if (!Utils.validateToken()) {
            window.location.replace('#login');
            return;
        }

        if (!window.location.hash.startsWith('#profile')) {
            return;
        }

        this.loadProfile();
        this.loadOrderHistory();
        this.checkAdminStatus();
    },

    loadProfile: function() {
        const cachedUser = Utils.getCurrentUser();
        if (cachedUser) {
            $("#name").val(cachedUser.Name || '');
            $("#email").val(cachedUser.Email || '');
            $("#address").val(cachedUser.Address || '');
            $("#role").val(cachedUser.Role || '');
        }

        $.ajax({
            url: Constants.project_base_url() + "auth/me",
            type: "GET",
            success: function(result) {
                const userData = result.data;
                Utils.setCurrentUser(userData);
                $("#name").val(userData.Name || '');
                $("#email").val(userData.Email || '');
                $("#address").val(userData.Address || '');
                $("#role").val(userData.Role || '');
            },
            error: function(xhr) {
                toastr.error(xhr.responseJSON?.message || 'Error loading profile');
            }
        });
    },

    loadOrderHistory: function() {
        $.ajax({
            url: Constants.project_base_url() + "orders",
            type: "GET",
            success: function(result) {
                $("#orderHistoryBody").empty();

                (result.data || []).forEach(order => {
                    const totalAmount = order.TotalAmount ? Number(order.TotalAmount).toFixed(2) : '0.00';
                    const row = `
                        <tr>
                            <td>${order.OrderID}</td>
                            <td>${totalAmount} KM</td>
                            <td>${order.Status}</td>
                        </tr>`;
                    $("#orderHistoryBody").append(row);
                });
            },
            error: function(xhr) {
                toastr.error(xhr.responseJSON?.message || 'Error loading orders');
            }
        });
    },

    checkAdminStatus: function() {
        const user = Utils.getCurrentUser();
        $("#adminControls").toggle(user?.Role === 'Admin');
    },

    loadProductsIntoSelect: function() {
        $.ajax({
            url: Constants.project_base_url() + "products",
            type: "GET",
            data: {
                page: 1,
                limit: 100
            },
            success: function(result) {
                $("#productSelect").empty();
                (result.data?.products || []).forEach(product => {
                    $("#productSelect").append(`
                        <option value="${product.ProductID}">${product.Name} - Current Price: ${product.Price}KM${product.SalePrice ? ` (Sale: ${product.SalePrice}KM)` : ''}</option>
                    `);
                });
            },
            error: function(xhr) {
                toastr.error(xhr.responseJSON?.message || 'Error loading products');
            }
        });
    },

    updateProduct: function() {
        const productId = $("#productSelect").val();
        const newPrice = $("#updatePrice").val();
        const salePriceValue = $("#updateSalePrice").val();

        $.ajax({
            url: Constants.project_base_url() + "products/" + productId,
            type: "PATCH",
            data: JSON.stringify({
                Price: Number(newPrice),
                SalePrice: salePriceValue ? Number(salePriceValue) : null
            }),
            contentType: "application/json",
            success: function() {
                toastr.success('Product updated successfully');
                $("#updateProductModal").modal('hide');
                ProfileService.loadProductsIntoSelect();
            },
            error: function(xhr) {
                toastr.error(xhr.responseJSON?.message || 'Error updating product');
            }
        });
    },

    deleteUser: function() {
        const user = Utils.getCurrentUser();
        if (!user) {
            return;
        }

        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        $.ajax({
            url: Constants.project_base_url() + "users/" + user.UserID,
            type: "DELETE",
            success: function() {
                Utils.clearAuth();
                updateNavBar();
                toastr.success('Account deleted successfully');
                window.location.replace("#login");
            },
            error: function(xhr) {
                toastr.error(xhr.responseJSON?.message || 'Error deleting account');
            }
        });
    }
};
