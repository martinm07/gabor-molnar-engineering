import { mount } from "svelte";
import App from "/shared/components/Form.svelte";

const app = mount(App, { target: document.getElementById("app")! });

export default app;
