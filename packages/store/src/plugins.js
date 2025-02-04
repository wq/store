// Adapted from @wq/app

let pcount = 0;

export function registerPlugin(store, plugin) {
    if (store._store) {
        throw new Error("Store already initialized!");
    }
    if (Array.isArray(plugin)) {
        plugin.forEach((p) => registerPlugin(store, p));
        return;
    }
    if (plugin.dependencies) {
        registerPlugin(store, plugin.dependencies);
    }
    if (store.plugins[plugin.name]) {
        if (store.plugins[plugin.name] === plugin) {
            return;
        } else {
            throw new Error(
                `${store.name} store already has a plugin named ${plugin.name}!`
            );
        }
    }
    pcount++;
    if (!plugin.name) {
        plugin.name = "plugin" + pcount;
    }
    store.plugins[plugin.name] = plugin;
    plugin.store = store;
}

export function applyPlugins(store, config) {
    for (const [name, plugin] of Object.entries(store.plugins)) {
        if (plugin.ajax) {
            config.ajax = plugin.ajax.bind(plugin);
        }
        if (plugin.reducer) {
            let persist = false,
                restore = null;
            if (typeof plugin.persist === "function") {
                persist = plugin.persist.bind(plugin);
                restore = plugin.restore
                    ? plugin.restore.bind(plugin)
                    : (state) => state;
            } else if (plugin.persist) {
                persist = true;
            }
            store.addReducer(
                name,
                (state, action) => plugin.reducer(state, action),
                persist,
                restore
            );
        }
        if (plugin.actions) {
            Object.assign(plugin, store.bindActionCreators(plugin.actions));
        }
        if (plugin.subscriber) {
            store.subscribe(() => plugin.subscriber(store.getState()));
        }
    }
}

export async function initPlugins(store, config) {
    for (const plugin of Object.values(store.plugins)) {
        if (plugin.init) {
            await plugin.init(config && config[plugin.name]);
        }
    }
}
