import { render, waitFor } from "@testing-library/react";
import React, { useEffect } from "react";
import ds, { Root, usePluginReducer } from "../index.js";

ds.use({
    name: "myPlugin",
    async init() {
        await new Promise((resolve) => setTimeout(resolve, 10));
        this.someInit = true;
    },
    actions: {
        setName(name) {
            return { type: "SET_NAME", name };
        },
    },
    reducer(state, action) {
        if (action.type === "SET_NAME") {
            return { ...state, name: action.name };
        }
        return state || { name: null };
    },
});

function TestComponent() {
    const [{ name }, { setName }] = usePluginReducer("myPlugin");
    useEffect(() => {
        setName("Test");
    }, []);
    return <div>{name}</div>;
}

test("usePluginReducer", async () => {
    expect(() => ds.use({ name: "myPlugin" })).toThrow(
        "main store already has a plugin named myPlugin!"
    );

    render(
        <Root>
            <TestComponent />
        </Root>
    );

    await waitFor(() => expect(ds.getState()["myPlugin"].name).toBe("Test"));

    expect(ds.plugins.myPlugin.someInit).toBe(true);

    expect(() => ds.use({ name: "anotherPlugin" })).toThrow(
        "Store already initialized!"
    );
});
