import { Fragment } from "react";
import { withWQ } from "@wq/react";
import { useSubmitForm, useOutbox, useUnsynced, useList } from "./hooks.js";

export default withWQ(Fragment, {
    name: "Root",
    defaults: {
        components: {
            useSubmitForm,
            useOutbox,
            useUnsynced,
            useList,
        },
    },
});
