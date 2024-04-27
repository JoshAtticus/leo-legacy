var leo = {
    plugins: {
        disable: function (pluginName) {
            const restrictedNames = ['token', 'settings', 'uname', 'permissions', 'meoglass_bg'];
            if (restrictedNames.includes(pluginName)) {
                return 'Error: Modification of this item is not allowed.';
            }
            if (localStorage.getItem(pluginName) === null) {
                return 'Error: Plugin does not exist.';
            } else if (localStorage.getItem(pluginName) === 'false') {
                return 'Error: Plugin is already disabled.';
            } else {
                localStorage.setItem(pluginName, 'false');
                location.reload();
            }
        },
        enable: function (pluginName) {
            const restrictedNames = ['token', 'settings', 'uname', 'permissions', 'meoglass_bg'];
            if (restrictedNames.includes(pluginName)) {
                return 'Error: Modification of this item is not allowed.';
            }
            if (localStorage.getItem(pluginName) === null) {
                return 'Error: Plugin does not exist.';
            } else {
                localStorage.setItem(pluginName, 'true');
                location.reload();
            }
        },
        list: function () {
            return window.fetchplugins();
        }
    },
    session: {
        reload: function () {
            location.reload();
        },
        reset: function () {
            localStorage.clear();
            location.reload();
        }
    },
    meower: {
        logout: function () {
            window.logout(false);
            location.reload();
        },
        login: function (username, password) {
            window.login(username, password);
        },
        post: function (content) {
            window.newpost(content);
        }
    }
};