import { createElement, useEffect, useState } from "react";
import { useConfig, withWQ } from "@wq/react";
import { Provider as ReduxProvider } from "react-redux";
import store from "./store.js";
import { StoreContext } from "./hooks.js";

const defaultConfig = {
    store: {
        service: "",
        defaults: { format: "json" },
    },
};

function Root({ store: instance = store, children }) {
    const config = useConfig("store"),
        [ready, setReady] = useState(Boolean(instance._store));

    useEffect(() => {
        if (instance._store) {
            return;
        }
        init();
        async function init() {
            await instance.init(config);
            setReady(true);
        }
    }, [instance, config]);

    if (!ready) {
        return null;
    }

    return createElement(
        StoreContext.Provider,
        { value: instance },
        createElement(ReduxProvider, { store: instance._store }, children)
    );
}

export default withWQ(Root, {
    defaults: { config: defaultConfig },
});
