import { Bn as e, Gt as t, N as n, c as r, gr as i, l as a, n as o, t as s, zt as c } from "./runtime-CwqRuC4c.js";
import { n as l } from "./constants-BmdHRGzy.js";
import { s as u } from "./warnings-DUVtILS5.js";
//#region src/public/svelte-lib/src/internal/client/dom/elements/events.js
var d = Symbol("events"), f = /* @__PURE__ */ new Set(), p = /* @__PURE__ */ new Set();
function m(t) {
	if (!e) return;
	t.removeAttribute("onload"), t.removeAttribute("onerror");
	let n = t.__e;
	n !== void 0 && (t.__e = void 0, queueMicrotask(() => {
		t.isConnected && t.dispatchEvent(n);
	}));
}
function h(e, n, r, i = {}) {
	function a(e) {
		if (i.capture || S.call(n, e), !e.cancelBubble) return c(() => r?.call(this, e));
	}
	return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? (a.__removed = !1, t(() => {
		a.__removed || n.addEventListener(e, a, i);
	})) : n.addEventListener(e, a, i), a;
}
function g(e, t, n, r = {}) {
	var i = h(t, e, n, r);
	return () => {
		i.__removed = !0, e.removeEventListener(t, i, r);
	};
}
function _(e, t, r, i, a) {
	var o = {
		capture: i,
		passive: a
	}, s = h(e, t, r, o);
	(t === document.body || t === window || t === document || t instanceof HTMLMediaElement) && n(() => {
		s.__removed = !0, t.removeEventListener(e, s, o);
	});
}
function v(e, t, n) {
	(t[d] ??= {})[e] = n;
}
function y(e) {
	for (var t = 0; t < e.length; t++) f.add(e[t]);
	for (var n of p) n(e);
}
var b = null, x = !1;
function S(e) {
	var t = this, n = t.ownerDocument, c = e.type, l = e.composedPath?.() || [], u = l[0] || e.target;
	b = e, x || (x = !0, setTimeout(() => {
		x = !1, b = null;
	}));
	var f = 0, p = b === e && e[d];
	if (p) {
		var m = l.indexOf(p);
		if (m !== -1 && (t === document || t === window)) {
			e[d] = t;
			return;
		}
		var h = l.indexOf(t);
		if (h === -1) return;
		m <= h && (f = m);
	}
	if (u = l[f] || e.target, u !== t) {
		i(e, "currentTarget", {
			configurable: !0,
			get() {
				return u || n;
			}
		});
		var g = o, _ = s;
		a(null), r(null);
		try {
			for (var v, y = []; u !== null && u !== t;) {
				try {
					var S = u[d]?.[c];
					S != null && (!u.disabled || e.target === u) && S.call(u, e);
				} catch (e) {
					v ? y.push(e) : v = e;
				}
				if (e.cancelBubble) break;
				f++, u = f < l.length ? l[f] : null;
			}
			if (v) {
				for (let e of y) queueMicrotask(() => {
					throw e;
				});
				throw v;
			}
		} finally {
			e[d] = t, delete e.currentTarget, a(g), r(_);
		}
	}
}
function C(e, t, n, r, i, a = !1, o = !1) {
	let s, c;
	try {
		s = e();
	} catch (e) {
		c = e;
	}
	if (typeof s != "function" && (a || s != null || c)) {
		let e = r?.[l], t = i ? ` at ${e}:${i[0]}:${i[1]}` : ` in ${e}`, a = n[0]?.eventPhase < Event.BUBBLING_PHASE ? "capture" : "", s = `\`${n[0]?.type + a}\` handler${t}`;
		if (u(s, o ? "remove the trailing `()`" : "add a leading `() =>`"), c) throw c;
	}
	s?.apply(t, n);
}
//#endregion
export { v as a, g as c, y as i, m as l, C as n, _ as o, h as r, S as s, f as t, p as u };
