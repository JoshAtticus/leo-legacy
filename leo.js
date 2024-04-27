var leo = {
    plugins: {
        disable: function(pluginName) {
            if (localStorage.getItem(pluginName) === null) {
                return 'Error: Plugin does not exist.';
            } else if (localStorage.getItem(pluginName) === 'false') {
                return 'Error: Plugin is already disabled.';
            } else {
                localStorage.setItem(pluginName, 'false');
                location.reload();
            }
        },
        enable: function(pluginName) {
            if (localStorage.getItem(pluginName) === null) {
                return 'Error: Plugin does not exist.';
            } else {
                localStorage.setItem(pluginName, 'true');
                location.reload();
            }
        },
        list: function() {
            return fetchplugins();
        }
    },
    session: {
        reload: function() {
            location.reload();
        },
        reset: function() {
            localStorage.clear();
        }
    }
};

async function fetchplugins() {
    try {
    // remember to bring this back when final
    //    const response = await fetch('./plugins.json');
        const response = await fetch('plugins.json');
        const pluginsdata = await response.json();
        return pluginsdata;
    } catch (error) {
        console.error('Error fetching or parsing plugins data:', error);
        return [];
    }
}