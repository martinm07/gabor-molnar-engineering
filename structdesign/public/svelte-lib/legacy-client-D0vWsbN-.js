import { $n as e, Bn as t, Cr as n, Er as r, G as i, Gn as a, Gt as o, H as s, I as c, J as l, K as u, Kn as d, Ln as f, Mn as p, O as ee, On as te, Q as ne, R as m, Rn as h, Sn as re, U as ie, Ut as ae, Vn as oe, W as g, Wn as _, Wt as se, X as v, Y as ce, Z as y, _ as b, _t as x, a as S, an as C, ar as w, b as T, c as E, cr as le, ct as ue, dt as de, er as fe, et as pe, ft as me, g as he, gr as ge, gt as _e, k as D, l as O, lt as ve, mr as ye, n as be, nn as xe, or as Se, pr as k, qt as A, rn as j, t as M, tn as Ce, v as we, yn as Te, yt as Ee } from "./runtime-CwqRuC4c.js";
import { c as N, i as P, s as F } from "./constants-BmdHRGzy.js";
import { d as De, p as Oe, y as ke } from "./warnings-DUVtILS5.js";
import { t as Ae } from "./flags-COsiZ1kr.js";
import { d as je } from "./utils-CZTeeqkQ.js";
import { c as I, s as L, t as Me, u as R } from "./events-EEnPiKdo.js";
import { t as Ne } from "./create-subscriber-CwUi43MK.js";
//#region src/public/svelte-lib/src/internal/client/dom/reconciler.js
var Pe = globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", { createHTML: (e) => e });
function z(e) {
	return Pe?.createHTML(e) ?? e;
}
function B(e) {
	var t = g("template");
	return t.innerHTML = z(e.replaceAll("<!>", "<!---->")), t.content;
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/template.js
var Fe = w ? "template" : "TEMPLATE", Ie = w ? "script" : "SCRIPT";
function V(e, t) {
	var n = M;
	n.nodes === null && (n.nodes = {
		start: e,
		end: t,
		a: null,
		t: null
	});
}
/*#__NO_SIDE_EFFECTS__*/
function Le(e, n) {
	var r = !!(n & 1), i = !!(n & 2), a, o = !e.startsWith("<!>");
	return () => {
		if (t) return V(h, null), h;
		a === void 0 && (a = B(o ? e : "<!>" + e), r || (a = /* @__PURE__ */ l(a)));
		var n = i || y ? document.importNode(a, !0) : a.cloneNode(!0);
		if (r) {
			var s = /* @__PURE__ */ l(n), c = n.lastChild;
			V(s, c);
		} else V(n, n);
		return n;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function H(e, n, r = "svg") {
	var i = !e.startsWith("<!>"), a = !!(n & 1), o = `<${r}>${i ? e : "<!>" + e}</${r}>`, s;
	return () => {
		if (t) return V(h, null), h;
		if (!s) {
			var e = B(o), n = /* @__PURE__ */ l(e);
			if (a) for (s = document.createDocumentFragment(); /* @__PURE__ */ l(n);) s.appendChild(/* @__PURE__ */ l(n));
			else s = /* @__PURE__ */ l(n);
		}
		var r = s.cloneNode(!0);
		if (a) {
			var i = /* @__PURE__ */ l(r), c = r.lastChild;
			V(i, c);
		} else V(r, r);
		return r;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function U(e, t) {
	return /* @__PURE__ */ H(e, t, "svg");
}
/*#__NO_SIDE_EFFECTS__*/
function Re(e, t) {
	return /* @__PURE__ */ H(e, t, "math");
}
function W(e, t) {
	var n = i();
	for (var r of e) {
		if (typeof r == "string") {
			n.append(u(r));
			continue;
		}
		if (r === void 0 || r[0][0] === "/") {
			n.append(ie(r ? r[0].slice(3) : ""));
			continue;
		}
		let [e, i, ...s] = r, c = e === "svg" ? N : e === "math" ? F : t;
		var a = g(e, c, i?.is);
		for (var o in i) pe(a, o, i[o]);
		s.length > 0 && (a.nodeName === Fe ? a.content : a).append(W(s, a.nodeName === "foreignObject" ? void 0 : c)), n.append(a);
	}
	return n;
}
/*#__NO_SIDE_EFFECTS__*/
function ze(e, n) {
	var r = !!(n & 1), i = !!(n & 2), a;
	return () => {
		if (t) return V(h, null), h;
		a === void 0 && (a = W(e, n & 4 ? N : n & 8 ? F : void 0), r || (a = /* @__PURE__ */ l(a)));
		var o = i || y ? document.importNode(a, !0) : a.cloneNode(!0);
		if (r) {
			var s = /* @__PURE__ */ l(o), c = o.lastChild;
			V(s, c);
		} else V(o, o);
		return o;
	};
}
function Be(e) {
	return () => Ve(e());
}
function Ve(e) {
	if (t) return e;
	let n = e.nodeType === 11, r = e.nodeName === Ie ? [e] : e.querySelectorAll("script"), i = M;
	for (let t of r) {
		let r = g("script");
		for (var a of t.attributes) r.setAttribute(a.name, a.value);
		r.textContent = t.textContent, (n ? e.firstChild === t : e === t) && (i.nodes.start = r), (n ? e.lastChild === t : e === t) && (i.nodes.end = r), t.replaceWith(r);
	}
	return e;
}
function He(e = "") {
	if (!t) {
		var n = u(e + "");
		return V(n, n), n;
	}
	var r = h;
	return r.nodeType === 3 ? ne(r) : (r.before(r = u()), _(r)), V(r, r), r;
}
function Ue() {
	if (t) return V(h, null), h;
	var e = document.createDocumentFragment(), n = document.createComment(""), r = u();
	return e.append(n, r), V(n, r), e;
}
function We(e, n) {
	if (t) {
		var r = M;
		(!(r.f & 32768) || r.nodes.end === null) && (r.nodes.end = h), f();
		return;
	}
	e !== null && e.before(n);
}
function Ge() {
	if (t && h && h.nodeType === 8 && h.textContent?.startsWith("$")) {
		let e = h.textContent.substring(1);
		return f(), e;
	}
	return (window.__svelte ??= {}).uid ??= 1, `c${window.__svelte.uid++}`;
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/blocks/boundary.js
var Ke = fe | e;
function G(e, t, n, r) {
	new qe(e, t, n, r);
}
var qe = class {
	parent;
	is_pending = !1;
	transform_error;
	#e;
	#t = t ? h : null;
	#n;
	#r;
	#i;
	#a = null;
	#o = null;
	#s = null;
	#c = null;
	#l = 0;
	#u = 0;
	#d = !1;
	#f = /* @__PURE__ */ new Set();
	#p = /* @__PURE__ */ new Set();
	#m = null;
	#h = Ne(() => (this.#m = me(this.#l), () => {
		this.#m = null;
	}));
	constructor(e, n, r, i) {
		this.#e = e, this.#n = n, this.#r = (e) => {
			var t = M;
			t.b = this, t.f |= 128, r(e);
		}, this.parent = M.b, this.transform_error = i ?? this.parent?.transform_error ?? ((e) => e), this.#i = he(() => {
			if (t) {
				let e = this.#t;
				f();
				let t = e.data === "[!";
				if (e.data.startsWith("[?")) {
					let t = JSON.parse(e.data.slice(2));
					this.#_(t);
				} else t ? this.#y() : this.#g();
			} else this.#b();
		}, Ke), t && (this.#e = h);
	}
	#g() {
		try {
			this.#a = b(() => this.#r(this.#e));
		} catch (e) {
			this.error(e);
		}
	}
	#_(e) {
		let t = this.#n.failed, { reset: n, invoke_onerror: r } = this.#v(e);
		o(r), t && (this.#s = b(() => {
			t(this.#e, () => e, () => n);
		}));
	}
	#v(e) {
		var t = !1, n = !1;
		let r = () => {
			if (t) {
				ke();
				return;
			}
			t = !0, n && te(), this.#s !== null && D(this.#s, () => {
				this.#s = null;
			}), this.#S(() => {
				this.#b();
			});
		};
		return {
			reset: r,
			invoke_onerror: () => {
				try {
					n = !0, this.#n.onerror?.(e, r), n = !1;
				} catch (e) {
					m(e, this.#i && this.#i.parent);
				}
			}
		};
	}
	#y() {
		let e = this.#n.pending;
		e && (this.is_pending = !0, this.#o = b(() => e(this.#e)), o(() => {
			var e = this.#c = document.createDocumentFragment(), t = u(), n = !1;
			if (e.append(t), this.#a = this.#S(() => {
				try {
					return b(() => this.#r(t));
				} catch (e) {
					try {
						this.error(e), n = !0;
					} catch (e) {
						m(e, this.#i.parent);
					}
					return null;
				}
			}), this.#a === null) {
				this.#c = null, n && this.#x(x);
				return;
			}
			this.#u === 0 && (this.#e.before(e), this.#c = null, D(this.#o, () => {
				this.#o = null;
			}), this.#x(x));
		}));
	}
	#b() {
		try {
			if (this.is_pending = this.has_pending_snippet(), this.#u = 0, this.#l = 0, this.#a = b(() => {
				this.#r(this.#e);
			}), this.#u > 0) {
				var e = this.#c = document.createDocumentFragment();
				ee(this.#a, e);
				let t = this.#n.pending;
				this.#o = b(() => t(this.#e));
			} else this.#x(x);
		} catch (e) {
			this.error(e);
		}
	}
	#x(e) {
		this.is_pending = !1, e.transfer_effects(this.#f, this.#p);
	}
	defer_effect(e) {
		ae(e, this.#f, this.#p);
	}
	is_rendered() {
		return !this.is_pending && (!this.parent || this.parent.is_rendered());
	}
	has_pending_snippet() {
		return !!this.#n.pending;
	}
	#S(e) {
		var t = M, n = be, r = A;
		E(this.#i), O(this.#i), C(this.#i.ctx);
		try {
			return _e.ensure(), e();
		} finally {
			E(t), O(n), C(r);
		}
	}
	#C(e, t) {
		if (!this.has_pending_snippet()) {
			this.parent && this.parent.#C(e, t);
			return;
		}
		this.#u += e, this.#u === 0 && (this.#x(t), this.#o && D(this.#o, () => {
			this.#o = null;
		}), this.#c &&= (this.#e.before(this.#c), null));
	}
	update_pending_count(e, t) {
		this.#C(e, t), this.#l += e, !(!this.#m || this.#d) && (this.#d = !0, o(() => {
			this.#d = !1, this.#m && ue(this.#m, this.#l);
		}));
	}
	get_effect_pending() {
		return this.#h(), S(this.#m);
	}
	error(e) {
		if (!this.#n.onerror && !this.#n.failed) throw e;
		x?.is_fork ? (this.#a && x.skip_effect(this.#a), this.#o && x.skip_effect(this.#o), this.#s && x.skip_effect(this.#s), x.oncommit(() => {
			this.#w(e);
		})) : this.#w(e);
	}
	#w(e) {
		this.#a &&= (T(this.#a), null), this.#o &&= (T(this.#o), null), this.#s &&= (T(this.#s), null), t && (_(this.#t), oe(), _(d()));
		let n = this.#n.failed, r = (e) => {
			let { reset: t, invoke_onerror: r } = this.#v(e);
			r(), n && (this.#s = this.#S(() => {
				try {
					return b(() => {
						var r = M;
						r.b = this, r.f |= 128, n(this.#e, () => e, () => t);
					});
				} catch (e) {
					return m(e, this.#i.parent), null;
				}
			}));
		};
		o(() => {
			var t;
			try {
				t = this.transform_error(e);
			} catch (e) {
				m(e, this.#i && this.#i.parent);
				return;
			}
			typeof t == "object" && t && typeof t.then == "function" ? t.then(r, (e) => m(e, this.#i && this.#i.parent)) : r(t);
		});
	}
};
function Je() {
	M === null && Te();
	var e = M.b;
	return e === null ? 0 : e.get_effect_pending();
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/render.js
var K = !0;
function Ye(e) {
	K = e;
}
function Xe(e, t) {
	var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
	n !== (e[k] ??= e.nodeValue) && (e[k] = n, e.nodeValue = `${n}`);
}
function q(e, t) {
	return X(e, t);
}
function J(e, n) {
	v(), n.intro = n.intro ?? !1;
	let r = n.target, i = t, o = h;
	try {
		for (var c = /* @__PURE__ */ l(r); c && (c.nodeType !== 8 || c.data !== "[");) c = /* @__PURE__ */ ce(c);
		if (!c) throw P;
		a(!0), _(c);
		let t = X(e, {
			...n,
			anchor: c
		});
		return a(!1), t;
	} catch (t) {
		if (t instanceof Error && t.message.split("\n").some((e) => e.startsWith("https://svelte.dev/e/"))) throw t;
		return t !== P && console.warn("Failed to hydrate: ", t), n.recover === !1 && re(), v(), s(r), a(!1), q(e, n);
	} finally {
		a(i), _(o);
	}
}
var Y = /* @__PURE__ */ new Map();
function X(e, { target: n, anchor: r, props: i = {}, events: a, context: o, intro: s = !0, transformError: c }) {
	v();
	var l = void 0, d = we(() => {
		var d = r ?? n.appendChild(u());
		G(d, { pending: () => {} }, (n) => {
			j({});
			var r = A;
			if (o && (r.c = o), a && (i.$$events = a), t && V(n, null), K = s, l = e(n, i) || Ce(), K = !0, t && (M.nodes.end = h, h === null || h.nodeType !== 8 || h.data !== "]")) throw De(), P;
			xe();
		}, c);
		var f = /* @__PURE__ */ new Set(), p = (e) => {
			for (var t = 0; t < e.length; t++) {
				var r = e[t];
				if (!f.has(r)) {
					f.add(r);
					var i = je(r);
					for (let e of [n, document]) {
						var a = Y.get(e);
						a === void 0 && (a = /* @__PURE__ */ new Map(), Y.set(e, a));
						var o = a.get(r);
						o === void 0 ? (e.addEventListener(r, L, { passive: i }), a.set(r, 1)) : a.set(r, o + 1);
					}
				}
			}
		};
		return p(ye(Me)), R.add(p), () => {
			for (var e of f) for (let r of [n, document]) {
				var t = Y.get(r), i = t.get(e);
				--i == 0 ? (r.removeEventListener(e, L), t.delete(e), t.size === 0 && Y.delete(r)) : t.set(e, i);
			}
			R.delete(p), d !== r && d.parentNode?.removeChild(d);
		};
	});
	return Z.set(l, d), l;
}
var Z = /* @__PURE__ */ new WeakMap();
function Q(e, t) {
	let n = Z.get(e);
	return n ? (Z.delete(e), n(t)) : Promise.resolve();
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/legacy/event-modifiers.js
function Ze(e) {
	return function(...t) {
		t[0].isTrusted && e?.apply(this, t);
	};
}
function Qe(e) {
	return function(...t) {
		t[0].target === this && e?.apply(this, t);
	};
}
function $e(e) {
	return function(...t) {
		return t[0].stopPropagation(), e?.apply(this, t);
	};
}
function et(e) {
	var t = !1;
	return function(...n) {
		if (!t) return t = !0, e?.apply(this, n);
	};
}
function tt(e) {
	return function(...t) {
		return t[0].stopImmediatePropagation(), e?.apply(this, t);
	};
}
function nt(e) {
	return function(...t) {
		return t[0].preventDefault(), e?.apply(this, t);
	};
}
function rt(e, [t, n]) {
	c(() => I(e, t, n() ?? r, { passive: !0 }));
}
function it(e, [t, n]) {
	c(() => I(e, t, n() ?? r, { passive: !1 }));
}
//#endregion
//#region src/public/svelte-lib/src/legacy/legacy-client.js
function at(e) {
	return new $(e);
}
function ot(e) {
	return class extends $ {
		constructor(t) {
			super({
				component: e,
				...t
			});
		}
	};
}
var $ = class {
	#e;
	#t;
	constructor(e) {
		var t = /* @__PURE__ */ new Map(), n = (e, n) => {
			var r = /* @__PURE__ */ ve(n, !1, !1);
			return t.set(e, r), r;
		};
		let r = new Proxy({
			...e.props || {},
			$$events: {}
		}, {
			get(e, r) {
				return S(t.get(r) ?? n(r, Reflect.get(e, r)));
			},
			has(e, r) {
				return r === Se || (S(t.get(r) ?? n(r, Reflect.get(e, r))), Reflect.has(e, r));
			},
			set(e, r, i) {
				return de(t.get(r) ?? n(r, i), i), Reflect.set(e, r, i);
			}
		});
		this.#t = (e.hydrate ? J : q)(e.component, {
			target: e.target,
			anchor: e.anchor,
			props: r,
			context: e.context,
			intro: e.intro ?? !1,
			recover: e.recover,
			transformError: e.transformError
		}), !Ae && (!e?.props?.$$host || e.sync === !1) && Ee(), this.#e = r.$$events;
		for (let e of Object.keys(this.#t)) e !== "$set" && e !== "$destroy" && e !== "$on" && ge(this, e, {
			get() {
				return this.#t[e];
			},
			set(t) {
				this.#t[e] = t;
			},
			enumerable: !0
		});
		this.#t.$set = (e) => {
			Object.assign(r, e);
		}, this.#t.$destroy = () => {
			Q(this.#t);
		};
	}
	$set(e) {
		this.#t.$set(e);
	}
	$on(e, t) {
		this.#e[e] = this.#e[e] || [];
		let n = (...e) => t.call(this, ...e);
		return this.#e[e].push(n), () => {
			this.#e[e] = this.#e[e].filter((e) => e !== n);
		};
	}
	$destroy() {
		this.#t.$destroy();
	}
};
function st(e) {
	c(() => {
		e();
		var t = M;
		t.f & 2048 && (Oe("a file (we can't know which one)"), se(t, le));
	});
}
function ct(...e) {
	return function(t) {
		let { stopImmediatePropagation: n } = t, r = !1;
		t.stopImmediatePropagation = () => {
			r = !0, n.call(t);
		};
		let i = [];
		for (let n of e) {
			try {
				n?.call(this, t);
			} catch (e) {
				i.push(e);
			}
			if (r) break;
		}
		for (let e of i) queueMicrotask(() => {
			throw e;
		});
	};
}
function lt() {
	let e = A;
	return e === null && p("createBubbler"), (t) => (r) => {
		let i = e.s.$$events?.[t];
		if (i) {
			let t = n(i) ? i.slice() : [i];
			for (let n of t) n.call(e.x, r);
			return !r.defaultPrevented;
		}
		return !0;
	};
}
//#endregion
export { He as A, V as C, U as D, Re as E, B as M, z as N, ze as O, We as S, Le as T, Xe as _, st as a, G as b, rt as c, tt as d, $e as f, Ye as g, q as h, ct as i, Be as j, Ge as k, nt as l, J as m, lt as n, it as o, Ze as p, at as r, et as s, ot as t, Qe as u, K as v, Ue as w, Je as x, Q as y };
