import ds, { Store, getStore } from "./store.js";
import * as storage from "./storage.native.js";
import Root from "./Root.js";

ds.setEngine(storage);

export default ds;
export { Store, getStore, Root };
export * from "./hooks.js";
