import { C as e, c as t, j as n, l as r, n as i, t as a, w as o } from "./runtime-CwqRuC4c.js";
import { t as s } from "./create-subscriber-CwUi43MK.js";
import { a as c, i as l, n as u, r as d, t as f } from "./shared-SkG8kz8H.js";
//#region src/public/svelte-lib/src/store/index-client.js
function p(o, s) {
	var l = a, u = i, d = o();
	let f = c(d, (s) => {
		var c = d !== o(), f, p = i, m = a;
		r(u), t(l);
		try {
			f = e(() => {
				n(() => {
					let e = o();
					c && s(e);
				});
			});
		} finally {
			r(p), t(m);
		}
		return c = !0, f;
	});
	return s ? {
		set: s,
		update: (e) => s(e(o())),
		subscribe: f.subscribe
	} : { subscribe: f.subscribe };
}
function m(e) {
	let t, n = s((n) => {
		let r = !1, i = e.subscribe((e) => {
			t = e, r && n();
		});
		return r = !0, i;
	});
	function r() {
		return o() ? (n(), t) : u(e);
	}
	return "set" in e ? {
		get current() {
			return r();
		},
		set current(t) {
			e.set(t);
		}
	} : { get current() {
		return r();
	} };
}
//#endregion
export { f as derived, m as fromStore, u as get, d as readable, l as readonly, p as toStore, c as writable };
