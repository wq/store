import { Model, model as createModel, getRootFields } from "./model.js";
import Root from "./Root.js";
import { useModelInstance, useModel, useModelConfig } from "./hooks.js";

const orm = {
    // Plugin attributes
    name: "orm",
    type: "orm",
    createModels(config) {
        for (const conf of Object.values(config?.pages || [])) {
            if (!conf.list) {
                continue;
            }
            const model = createModel(conf);
            this.models[conf.name] = model;
            if (!this._orm) {
                this._orm = model.orm;
            }
        }
    },
    actions: {
        reset() {
            return { type: "ORM_RESET" };
        },
    },
    reducer(state, action) {
        if (!this._orm) {
            return state || {};
        }
        return this._orm.reducer(state, action);
    },
    persist: true,

    // Custom attributes
    models: {},
    async prefetchAll() {
        const result = await Promise.all(
            Object.values(this.models).map((model) => model.prefetch())
        );
        return result;
    },
};

export default orm;

export {
    Model,
    createModel,
    createModel as model,
    getRootFields,
    Root,
    useModelInstance,
    useModel,
    useModelConfig,
};
