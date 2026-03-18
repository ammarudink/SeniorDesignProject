var UserService = {
    init: function () {
        // Listen for hash changes to initialize forms
        $(window).on('hashchange', () => {
            this.setupAjaxHeaders();
            if (window.location.hash === '#login') {
                setTimeout(() => this.initializeLoginForm(), 100);
            } else if (window.location.hash === '#register') {
                setTimeout(() => this.initializeRegisterForm(), 100);
            }
        });

        // Initialize on page load
        $(document).ready(() => {
            this.setupAjaxHeaders();
            if (window.location.hash === '#login') {
                setTimeout(() => this.initializeLoginForm(), 100);
            } else if (window.location.hash === '#register') {
                setTimeout(() => this.initializeRegisterForm(), 100);
            }
        });
    },

    setupAjaxHeaders: function() {
        $.ajaxSetup({
            beforeSend: function(xhr) {
                const token = localStorage.getItem('user_token');
                if (token) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                }
            }
        });
    },

    initializeLoginForm: function() {
        const loginForm = $('#loginForm');
        if (!loginForm.length) return;

        if (loginForm.data('validator')) {
            loginForm.validate().destroy();
        }

        loginForm.validate({
            errorElement: 'div',
            errorClass: 'invalid-feedback',
            errorPlacement: function(error, element) {
                error.insertAfter(element);
            },
            highlight: function(element) {
                $(element).addClass('is-invalid').removeClass('is-valid');
            },
            unhighlight: function(element) {
                $(element).addClass('is-valid').removeClass('is-invalid');
            },
            rules: {
                Email: {
                    required: true,
                    email: true
                },
                Password: {
                    required: true,
                    minlength: 6
                }
            },
            messages: {
                Email: {
                    required: "Please enter your email",
                    email: "Please enter a valid email"
                },
                Password: {
                    required: "Please enter your password",
                    minlength: "Password must be at least 6 characters"
                }
            },
            submitHandler: (form) => {
                const loginData = {
                    Email: $('#loginEmail').val().trim(),
                    Password: $('#loginPassword').val()
                };
                this.login(loginData);
                return false;
            }
        });
    },

    initializeRegisterForm: function() {
    const registerForm = $('#registerForm');
    if (!registerForm.length) return;

    if (registerForm.data('validator')) {
        registerForm.validate().destroy();
    }

    $.validator.addMethod("passwordMatch", function(value, element) {
        return this.optional(element) || value === $('#password').val();
    }, "Passwords don't match");

    registerForm.validate({
        errorElement: 'div',
        errorClass: 'invalid-feedback',
        errorPlacement: function(error, element) {
            error.insertAfter(element);
        },
        highlight: function(element) {
            $(element).addClass('is-invalid').removeClass('is-valid');
        },
        unhighlight: function(element) {
            $(element).addClass('is-valid').removeClass('is-invalid');
        },
        rules: {
            Name: {
                required: true,
                minlength: 2
            },
            Email: {
                required: true,
                email: true
            },
            Password: {
                required: true,
                minlength: 6
            },
            ConfirmPassword: {
                required: true,
                equalTo: "#password"
            },
            Address: {
                required: true,
                minlength: 5
            }
        },
        messages: {
            Name: {
                required: "Please enter your name",
                minlength: "Name must be at least 2 characters"
            },
            Email: {
                required: "Please enter your email",
                email: "Please enter a valid email"
            },
            Password: {
                required: "Please enter your password",
                minlength: "Password must be at least 6 characters"
            },
            ConfirmPassword: {
                required: "Please confirm your password",
                equalTo: "Passwords don't match"
            },
            Address: {
                required: "Please enter your address",
                minlength: "Address must be at least 5 characters"
            }
        },
        submitHandler: function(form) {
        const userData = {
            Name: $('#registerName').val().trim(),
            Email: $('#registerEmail').val().trim(),
            Password: $('#password').val(),
            Address: $('#registerAddress').val().trim(),
            Role: $('#registerRole').val()
        };

        if (userData.Role === 'Admin') {
            userData.AdminPassword = $('#adminPassword').val();
            if (!userData.AdminPassword) {
                toastr.error('Admin password is required');
                return false;
            }
        }
        const submitButton = $(form).find('button[type="submit"]');
        submitButton.prop('disabled', true);
        submitButton.find('.normal-text').addClass('d-none');
        submitButton.find('.loading-text').addClass('d-none');

        $.ajax({
            url: Constants.project_base_url() + "auth/register",
            type: "POST",
            data: JSON.stringify(userData),
            contentType: "application/json",
            dataType: "json",
            success: function(response) {
                console.log('Registration response:', response);
                if (response && response.data) {
                    toastr.success('Registration successful!');
                    window.location.hash = '#login';
                } else {
                    toastr.error(response?.message || 'Registration failed');
                }
            },
            error: function(xhr, status, error) {
                console.error('Registration error details:', {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText,
                    error: error
                });
                
                let errorMessage = 'Registration failed';
                try {
                    if (xhr.getResponseHeader('content-type')?.includes('application/json')) {
                        const response = JSON.parse(xhr.responseText);
                        errorMessage = response.message || errorMessage;
                    } else {
                        errorMessage = 'Server error occurred. Please try again later.';
                    }
                } catch (e) {
                    console.error('Error parsing response:', e);
                }
                
                toastr.error(errorMessage);
            },
            complete: function() {
                submitButton.prop('disabled', false);
                submitButton.find('.normal-text').removeClass('d-none');
                submitButton.find('.loading-text').addClass('d-none');
            }
        });
        return false;
    }
    });

    // Initialize password validation
    $('#password, #confirmPassword').on('keyup', this.validatePasswords);
    $('#registerRole').on('change', this.toggleAdminPasswordField);
},

    login: function(loginData) {
        console.log('Login attempt with:', loginData.Email);
        
        $.ajax({
            url: Constants.project_base_url() + 'auth/login',
            type: 'POST',
            data: JSON.stringify(loginData),
            contentType: 'application/json',
            dataType: 'json',
            beforeSend: function() {
                $('#loginForm button[type="submit"]').prop('disabled', true)
                    .html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...');
            },
            success: (response) => {
                if (response?.token && response?.user) {
                    localStorage.setItem('user_token', response.token);
                    localStorage.setItem('user_id', response.user.UserID);
                    Utils.setCurrentUser(response.user);
                    
                    Utils.setupAjaxInterceptor();
                    $('#loginForm')[0].reset();
                    updateNavBar();
                    ProductService.syncWishlistCache();
                    updateCartCount();
                    
                    toastr.success(`Welcome back, ${response.user.Name}!`); 
                    
                    setTimeout(() => {
                        window.location.hash = '#dashboard'; 
                    }, 500);
                } else {
                    toastr.error(response?.message || 'Invalid response from server');
                }
            },
            error: function(xhr) {
                console.error('Login error:', xhr.responseJSON);
                toastr.error(xhr.responseJSON?.message || 'Login failed. Please check your credentials.');
            },
            complete: function() {
                $('#loginForm button[type="submit"]').prop('disabled', false)
                    .html('Login');
            }
        });
    },

    register: function(userData) {
        $.blockUI({ message: '<h3>Creating account...</h3>' });
        $.ajax({
            url: Constants.project_base_url() + "auth/register",
            type: "POST",
            data: JSON.stringify(userData),
            contentType: "application/json",
            dataType: "json",
            success: function(result) {
                $.unblockUI();
                if (result && result.token) {
                    localStorage.setItem("user_token", result.token);
                    localStorage.setItem('user_id', result.user.UserID);
                    Utils.setCurrentUser(result.user);
                    
                    Utils.setupAjaxInterceptor();
                    updateNavBar();
                    ProductService.syncWishlistCache();
                    updateCartCount();
                    
                    window.location.hash = '#dashboard';
                    toastr.success('Registration successful');
                } else {
                    toastr.error(result.message || 'Registration failed');
                }
            },
            error: function(xhr) {
                $.unblockUI();
                console.error('Registration error:', xhr.responseJSON);
                toastr.error(xhr.responseJSON?.message || 'Registration failed');
            }
        });
    },

    validatePasswords: function() {
        const password = $('#password').val();
        const confirmPassword = $('#confirmPassword').val();
        const errorElement = $('#passwordError');
        
        if (confirmPassword.length > 0) {
            errorElement.toggle(password !== confirmPassword);
        }
        return password === confirmPassword;
    },

    toggleAdminPasswordField: function() {
        const adminPasswordField = $('#adminPasswordField');
        const registerRole = $('#registerRole').val();
        
        if (registerRole === 'Admin') {
            adminPasswordField.html(`
                <label for="adminPassword" class="form-label">Admin Password</label>
                <input type="password" class="form-control" id="adminPassword" name="AdminPassword" required>
            `).show();
        } else {
            adminPasswordField.hide().empty();
        }
    },

    logout: function() {
        Utils.clearAuth();
        
        $("#loginNavItem, #registerNavItem").show();
        $("#userDropdown").hide();
        $("#userName").text('');
        $("#cart-count").text('0');
        
        window.location.hash = '#login';
        toastr.success('Logged out successfully');
    },

    // Helper method to check if user is logged in
    isLoggedIn: function() {
        return !!localStorage.getItem('user_token');
    },

    // Helper method to get current user data
    getCurrentUser: function() {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    }
};
