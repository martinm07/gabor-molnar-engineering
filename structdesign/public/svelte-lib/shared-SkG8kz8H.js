import { Er as e, In as t, kr as n } from "./runtime-CwqRuC4c.js";
import { t as r } from "./utils-BaJXbWQO.js";
//#region src/public/svelte-lib/src/store/shared/index.js
var i = [];
function a(e, t) {
	return { subscribe: o(e, t).subscribe };
}
function o(n, r = e) {
	let a = null, o = /* @__PURE__ */ new Set();
	function s(e) {
		if (t(n, e) && (n = e, a)) {
			let e = !i.length;
			for (let e of o) e[1](), i.push(e, n);
			if (e) {
				for (let e = 0; e < i.length; e += 2) i[e][0](i[e + 1]);
				i.length = 0;
			}
		}
	}
	function c(e) {
		s(e(n));
	}
	function l(t, i = e) {
		let l = [t, i];
		return o.add(l), o.size === 1 && (a = r(s, c) || e), t(n), () => {
			o.delete(l), o.size === 0 && a && (a(), a = null);
		};
	}
	return {
		set: s,
		update: c,
		subscribe: l
	};
}
function s(t, i, o) {
	let s = !Array.isArray(t), c = s ? [t] : t;
	if (!c.every(Boolean)) throw Error("derived() expects stores as input, got a falsy value");
	let l = i.length < 2;
	return a(o, (t, a) => {
		let o = !1, u = [], d = 0, f = e, p = () => {
			if (d) return;
			f();
			let n = i(s ? u[0] : u, t, a);
			l ? t(n) : f = typeof n == "function" ? n : e;
		}, m = c.map((e, t) => r(e, (e) => {
			u[t] = e, d &= ~(1 << t), o && p();
		}, () => {
			d |= 1 << t;
		}));
		return o = !0, p(), function() {
			n(m), f(), o = !1;
		};
	});
}
function c(e) {
	return { subscribe: e.subscribe.bind(e) };
}
function l(e) {
	let t;
	return r(e, (e) => t = e)(), t;
}
//#endregion
export { o as a, c as i, l as n, a as r, s as t };
