var AuthService = {
    init: function() {
        this.setupTokenCheck();
        this.setupAjaxInterceptor();
    },

    setupTokenCheck: function() {
        $(document).ready(() => {
            if (window.location.hash === '#login' || window.location.hash === '#register') {
                return;
            }

            if (!Utils.validateToken()) {
                window.location.replace('#login');
            }
        });
    },

    setupAjaxInterceptor: function() {
        $(document).ajaxError((event, jqXHR) => {
            if (jqXHR.status === 401) {
                this.logout();
            }
        });
    },

    logout: function() {
        Utils.clearAuth();
        updateNavBar();
        window.location.replace('#login');
    },

    validateToken: function() {
        return Utils.validateToken();
    }
};
