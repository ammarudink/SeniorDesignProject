let Utils = {
    _lastValidation: 0,
    _validationInterval: 1000,
    _lastValidationResult: false,

    init: function() {
        this.setupAjaxInterceptor();
        this._lastValidationResult = this.validateToken();
    },

    setupAjaxInterceptor: function() {
        $.ajaxSetup({
            beforeSend: function(xhr) {
                const token = localStorage.getItem('user_token');
                if (token) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                    xhr.setRequestHeader('Authentication', 'Bearer ' + token);
                }
            }
        });
    },

    parseJwt: function(token) {
        if (!token) return null;

        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }

            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(base64));
        } catch (e) {
            console.error('JWT parse error:', e);
            return null;
        }
    },

    validateToken: function() {
        const now = Date.now();
        if (now - this._lastValidation < this._validationInterval) {
            return this._lastValidationResult;
        }

        const token = localStorage.getItem('user_token');
        this._lastValidation = now;

        if (!token) {
            this._lastValidationResult = false;
            return false;
        }

        try {
            const decoded = this.parseJwt(token);
            const currentTime = Math.floor(Date.now() / 1000);

            if (!decoded || (decoded.exp && decoded.exp < currentTime)) {
                this.clearAuth();
                return false;
            }

            if (!localStorage.getItem('user_data')) {
                const fallbackUser = {
                    UserID: Number(decoded.sub),
                    Email: decoded.email,
                    Role: decoded.role,
                    Name: decoded.name
                };
                localStorage.setItem('user_data', JSON.stringify(fallbackUser));
            }

            this._lastValidationResult = true;
            return true;
        } catch (e) {
            console.error('Token validation failed:', e);
            this.clearAuth();
            return false;
        }
    },

    isLoggedIn: function() {
        return this.validateToken();
    },

    getCurrentUser: function() {
        const userData = localStorage.getItem('user_data');
        if (!userData) return null;

        try {
            return JSON.parse(userData);
        } catch (e) {
            console.error('Failed to parse user_data:', e);
            return null;
        }
    },

    setCurrentUser: function(user) {
        localStorage.setItem('user_data', JSON.stringify(user));
        if (user?.UserID) {
            localStorage.setItem('user_id', user.UserID);
        }
    },

    clearAuth: function() {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_id');
        localStorage.removeItem('wishlist');
        this._lastValidationResult = false;
    }
};
