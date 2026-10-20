import { a as e, dt as t, ft as n } from "../runtime-CwqRuC4c.js";
import "../index-client-CHdY4_o-.js";
import { c as r } from "../events-EEnPiKdo.js";
import "../events.js";
import { t as i } from "../reactive-value-BMu75dUw.js";
//#region src/public/svelte-lib/src/reactivity/window/index.js
var a = new i(() => window.scrollX, (e) => r(window, "scroll", e)), o = new i(() => window.scrollY, (e) => r(window, "scroll", e)), s = new i(() => window.innerWidth, (e) => r(window, "resize", e)), c = new i(() => window.innerHeight, (e) => r(window, "resize", e)), l = new i(() => window.outerWidth, (e) => r(window, "resize", e)), u = new i(() => window.outerHeight, (e) => r(window, "resize", e)), d = new i(() => window.screenLeft, (e) => {
	let t = window.screenLeft, n = requestAnimationFrame(function r() {
		n = requestAnimationFrame(r), t !== (t = window.screenLeft) && e();
	});
	return () => {
		cancelAnimationFrame(n);
	};
}), f = new i(() => window.screenTop, (e) => {
	let t = window.screenTop, n = requestAnimationFrame(function r() {
		n = requestAnimationFrame(r), t !== (t = window.screenTop) && e();
	});
	return () => {
		cancelAnimationFrame(n);
	};
}), p = new i(() => navigator.onLine, (e) => {
	let t = r(window, "online", e), n = r(window, "offline", e);
	return () => {
		t(), n();
	};
}), m = /* @__PURE__ */ new class {
	#e = n(window.devicePixelRatio);
	#t() {
		let e = r(window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`), "change", () => {
			t(this.#e, window.devicePixelRatio), e(), this.#t();
		});
	}
	constructor() {
		this.#t();
	}
	get current() {
		return e(this.#e), window.devicePixelRatio;
	}
}();
//#endregion
export { m as devicePixelRatio, c as innerHeight, s as innerWidth, p as online, u as outerHeight, l as outerWidth, d as screenLeft, f as screenTop, a as scrollX, o as scrollY };
