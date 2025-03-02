import { useMemo } from "react";
import { useSelector } from "react-redux";
import * as ReduxORM from "redux-orm";
import { useStore } from "@wq/store";

const { createSelector } = ReduxORM;

export function useModelInstance(name) {
    const store = useStore(),
        model = store.plugins.orm.models[name];

    if (!model) {
        throw new Error(`Unknown model name ${name}`);
    }
}

// Extracted from @wq/react/src/hooks.js
export function useModel(name, filter) {
    const model = useModelInstance(name),
        selector = useMemo(() => {
            let selector;
            if (
                typeof filter === "function" ||
                (typeof filter === "object" && !Array.isArray(filter))
            ) {
                // Filter by query
                selector = createSelector(model.orm, (session) =>
                    model.getQuerySet(session).filter(filter).toRefArray()
                );
            } else if (filter) {
                // Filter by id (default ModelSelectorSpec behavior)
                selector = (state) =>
                    createSelector(model.orm[name])(state, filter);
            } else {
                // All objects (use getQuerySet() to leverage config.ordering)
                selector = createSelector(model.orm, (session) =>
                    model.getQuerySet(session).toRefArray()
                );
            }
            return selector;
        }, [model, filter]);

    return useSelector(selector);
}

export function useModelConfig(name) {
    const model = useModelInstance(name);
    return model.config;
}
