import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useStore } from "@wq/store";
import { useModel, useModelConfig } from "@wq/model";

const FAILURE = "failure",
    ERROR = "error";

export function useSubmitForm() {
    const outbox = useStore().plugins.outbox;
    return useCallback(
        ({
            url,
            storage,
            backgroundSync,
            has_files,
            outboxId,
            preserve,
            data: vals,
            csrftoken,
            config: conf,
            postSaveNav,
        }) => {
            return submitForm({
                url,
                storage,
                backgroundSync,
                has_files,
                outboxId,
                preserve,
                data: vals,
                csrftoken,
                config: conf,
                postSaveNav,
                outbox,
            });
        },
        [outbox]
    );
}

// Extracted from @wq/app/src/app.js
export async function submitForm({
    url,
    storage,
    backgroundSync,
    has_files,
    outboxId,
    preserve,
    data: vals,
    config: conf,
    csrftoken,
    postSaveNav,
    outbox,
}) {
    var options = {
        url: url,
    };

    if (storage) {
        options.storage = storage;
    } else if (!backgroundSync) {
        options.storage = "temporary";
    } else if (has_files && navigator.product !== "ReactNative") {
        options.storage = "store";
    }

    if (_hasNestedObject(vals)) {
        if (has_files) {
            vals = _flattenJson(vals);
        } else {
            options.json = true;
        }
    }

    if (outboxId) {
        options.id = outboxId;
        if (preserve && preserve.split) {
            options.preserve = preserve.split(/,/);
        }
    }
    if (vals._method) {
        options.method = vals._method;
        delete vals._method;
    } else {
        options.method = "POST";
    }

    if (conf) {
        options.modelConf = conf;
        if (conf.label_template) {
            if (typeof conf.label_template === "function") {
                options.label = conf.label_template(vals);
            } else if (typeof conf.label_template === "string") {
                options.label = conf.label_template;
                const keys = (
                    conf.label_template.match(/\{\{(.+?)\}\}/g) || []
                ).map((key) => key.slice(2, -2));
                for (const key of keys) {
                    if (["#", "^", "/"].some((char) => key.startsWith(char))) {
                        console.warn(
                            "#, ^, or / longer supported in label_template, use a function instead."
                        );
                        continue;
                    }
                    options.label = options.label.replace(key, vals[key] || "");
                }
            }
        }
    }

    if (csrftoken) {
        options.csrftoken = csrftoken;
    }
    var item = await outbox.save(vals, options);
    if (backgroundSync) {
        if (postSaveNav) {
            // Send user to next screen while app syncs in background
            postSaveNav(item, false);
        }
        return [item, null];
    }

    // Submit form immediately and wait for server to respond
    item = await outbox.waitForItem(item.id);
    if (!item) {
        return [item, FAILURE];
    }
    if (item.synced) {
        // Item was synced
        if (postSaveNav) {
            postSaveNav(item, true);
        }
        return [item, null];
    }
    // Something went wrong
    if (!item.error) {
        // Save failed without server error: probably offline
        // FIXME: waitForItem() probably doesn't resolve until back online.
        if (postSaveNav) {
            postSaveNav(item, false);
        }
        return [item, null];
    } else if (typeof item.error === "string") {
        // Save failed and error information is not in JSON format
        // (likely a 500 server failure)
        return [item, FAILURE];
    } else {
        // Save failed and error information is in JSON format
        // (likely a 400 bad data error)
        return [item, ERROR];
    }
}

function _hasNestedObject(value) {
    return Object.values(value).some(
        (val) =>
            typeof val === "object" &&
            (!Array.isArray(val) || typeof val[0] === "object")
    );
}

function _flattenJson(value, prefix = "") {
    const result = {};
    if (prefix) {
        if (value === null || value === undefined) {
            return { [prefix]: "" };
        } else if (typeof value !== "object") {
            return { [prefix]: value };
        }
    }
    Object.entries(value).forEach(([key, val]) => {
        const fullKey = prefix ? `${prefix}[${key}]` : key;
        if (Array.isArray(val)) {
            val.forEach((row, i) =>
                Object.assign(result, _flattenJson(row, `${fullKey}[${i}]`))
            );
        } else if (typeof val === "object") {
            if (_isFile(val)) {
                result[fullKey] = val;
            } else if (_isGeometry(val)) {
                result[fullKey] = JSON.stringify(val);
            } else {
                Object.assign(result, _flattenJson(val, fullKey));
            }
        } else {
            result[fullKey] = val;
        }
    });
    return result;
}

function _isFile(val) {
    return val && val.type && val.name && (val.body || val.uri);
}

function _isGeometry(val) {
    return val && val.type && val.coordinates;
}

// Extracted from @wq/react/src/hooks.js
function selectOutbox(state) {
    return state.offline.outbox;
}

export function useOutbox() {
    const outbox = useSelector(selectOutbox),
        {
            outbox: { parseOutbox },
        } = useStore().plugins;
    return useMemo(() => {
        if (outbox) {
            return parseOutbox(outbox);
        } else {
            return [];
        }
    }, [outbox, parseOutbox]);
}

export function useUnsynced(modelNameOrConf) {
    const outbox = useOutbox(),
        {
            outbox: { filterUnsynced },
            orm: { models },
        } = useStore().plugin,
        modelConf =
            typeof modelNameOrConf === "string"
                ? models[modelNameOrConf].config
                : modelNameOrConf;
    return useMemo(() => {
        return filterUnsynced(outbox, modelConf);
    }, [outbox, modelConf]);
}

export function useList(name, contextList) {
    const modelConf = useModelConfig(name),
        modelList = useModel(modelConf.page),
        unsynced = useUnsynced(modelConf);

    return useMemo(() => {
        let list;
        if (contextList) {
            // Context list should generally already equal model list, unless
            // there has been a sync or other model update since last RENDER.
            const seen = {};
            modelList.forEach((row) => (seen[row.id] = true));
            list = modelList.concat(
                (contextList || []).filter((row) => !seen[row.id])
            );
        } else {
            // Context list probably came directly from server, ignore local model
            list = contextList || [];
        }
        const empty = !list || !list.length;

        return {
            page_config: modelConf,
            list,
            unsynced: contextList ? [] : unsynced,
            empty,
        };
    }, [contextList, modelConf, modelList, unsynced]);
}
