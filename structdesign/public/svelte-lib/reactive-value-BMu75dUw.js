import { t as e } from "./create-subscriber-CwUi43MK.js";
//#region src/public/svelte-lib/src/reactivity/reactive-value.js
var t = class {
	#e;
	#t;
	constructor(t, n) {
		this.#e = t, this.#t = e(n);
	}
	get current() {
		return this.#t(), this.#e();
	}
};
//#endregion
export { t };
