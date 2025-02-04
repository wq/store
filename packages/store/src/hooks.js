import { createContext, useContext } from "react";
import { useSelector } from "react-redux";

// Adapted from @wq/react

const selectors = {};

function getSelector(name) {
    if (!selectors[name]) {
        selectors[name] = (state) => state[name];
    }
    return selectors[name];
}

export const StoreContext = createContext(null);

export function useStore() {
    return useContext(StoreContext);
}

export function usePluginActions(name) {
    const { plugins } = useStore();
    return plugins[name];
}

export function usePluginState(name) {
    const plugin = usePluginActions(name),
        pluginState = useSelector(getSelector(name));

    if (plugin) {
        return pluginState;
    } else {
        return null;
    }
}

export function usePluginReducer(name) {
    const plugin = usePluginActions(name),
        pluginState = useSelector(getSelector(name));

    if (plugin) {
        return [pluginState, plugin];
    } else {
        return [null, null];
    }
}
