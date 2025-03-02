import { Fragment } from "react";
import { withWQ } from "@wq/react";
import { useModelInstance, useModel, useModelConfig } from "./hooks.js";

export default withWQ(Fragment, {
    name: "Root",
    defaults: {
        components: {
            useModelInstance,
            useModel,
            useModelConfig,
        },
    },
});
