import { A as e, Bn as t, Bt as n, C as r, Cr as i, D as a, Dr as o, Dt as s, Er as c, F as l, Ft as u, Gn as d, Gt as f, H as p, Hn as m, I as h, In as g, J as _, Jn as v, K as y, Kn as b, L as x, Ln as S, Lt as C, M as w, Mn as T, N as E, O as D, Or as ee, Ot as te, P as ne, Qn as re, Rn as O, Rt as ie, S as k, St as ae, Tn as oe, Tr as se, Tt as ce, U as le, Un as ue, Vt as de, W as A, Wn as j, Xt as fe, Y as pe, Yt as me, _ as M, _n as he, _t as N, a as P, ar as ge, at as _e, b as F, bn as ve, br as ye, c as be, ct as xe, d as Se, dr as I, dt as Ce, en as we, er as Te, f as L, fn as Ee, fr as De, ft as R, g as z, gn as Oe, gr as ke, gt as Ae, hn as je, i as Me, j as B, jn as Ne, jt as Pe, k as Fe, kn as Ie, kr as Le, l as Re, lt as ze, mr as Be, mt as Ve, n as He, nr as Ue, o as We, on as Ge, or as Ke, ot as qe, qn as Je, qt as V, rr as Ye, sn as Xe, sr as Ze, t as H, tn as Qe, tr as $e, tt as et, wn as tt, wr as nt, wt as rt, x as it, xr as at, xt as ot, yr as U, yt as st, zt as ct } from "./runtime-CwqRuC4c.js";
import { c as lt, i as ut, l as W, n as G, o as dt, r as ft, s as pt, t as mt } from "./constants-BmdHRGzy.js";
import { _ as ht, a as gt, c as _t, d as vt, g as yt, h as bt, i as xt, t as St } from "./warnings-DUVtILS5.js";
import { a as Ct, t as wt } from "./flags-COsiZ1kr.js";
import { f as Tt, n as Et, o as Dt, v as Ot, y as kt } from "./utils-CZTeeqkQ.js";
import { a as At, i as jt, r as Mt } from "./events-EEnPiKdo.js";
import { C as K, M as Nt, N as Pt, S as Ft, g as q, r as It, v as Lt } from "./legacy-client-D0vWsbN-.js";
import { a as Rt, i as zt, n as Bt, r as Vt } from "./attributes-B8hyih9T.js";
import { t as Ht } from "./utils-BaJXbWQO.js";
import { n as Ut } from "./shared-SkG8kz8H.js";
//#region src/public/svelte-lib/src/attachments/index.js
function Wt() {
	return Symbol(mt);
}
function Gt(e, t = c) {
	return (n) => {
		let { update: r, destroy: i } = L(() => e(n, t()) ?? {});
		if (r) {
			var a = !1;
			B(() => {
				let e = t();
				a && r(e);
			}), a = !0;
		}
		i && E(i);
	};
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dev/assign.js
function Kt(e, t, n, r) {
	return e !== t && typeof t == "object" && I in t && St(n, kt(r)), e;
}
function qt(e, t, n, r, i) {
	return Kt(n === "=" ? e[t] = r : n === "&&=" ? e[t] &&= r() : n === "||=" ? e[t] ||= r() : n === "??=" ? e[t] ??= r() : null, L(() => e[t]), t, i);
}
async function Jt(e, t, n, r, i) {
	return Kt(n === "=" ? e[t] = await r : n === "&&=" ? e[t] &&= await r() : n === "||=" ? e[t] ||= await r() : n === "??=" ? e[t] ??= await r() : null, L(() => e[t]), t, i);
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dev/css.js
var Yt = /* @__PURE__ */ new Map();
function Xt(e) {
	var t = Yt.get(e);
	if (t) {
		for (let e of t) e.remove();
		Yt.delete(e);
	}
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dev/elements.js
function Zt(e, n, r) {
	return (...i) => {
		let a = e(...i);
		return $t(t ? a : a.nodeType === 11 ? a.firstChild : a, n, r), a;
	};
}
function Qt(e, t, n) {
	e.__svelte_meta = {
		parent: fe,
		loc: {
			file: t,
			line: n[0],
			column: n[1]
		}
	}, n[2] && $t(e.firstChild, t, n[2]);
}
function $t(e, n, r) {
	for (var i = 0, a = 0; e && i < r.length;) {
		if (t && e.nodeType === 8) {
			var o = e;
			o.data[0] === "[" ? a += 1 : o.data[0] === "]" && --a;
		}
		a === 0 && e.nodeType === 1 && Qt(e, n, r[i++]), e = e.nextSibling;
	}
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dev/hmr.js
function en(e) {
	let n = R(e);
	function r(e, r) {
		let i = {}, a = {}, o, s = !1, c = e;
		return z(() => {
			if (i !== (i = P(n))) {
				if (o) {
					for (var e in a) delete a[e];
					F(o);
				}
				o = M(() => {
					c = c[Ye] ?? c, s && q(!1);
					var e = new.target ? new i(c, r) : i(c, r);
					e && Object.defineProperties(a, Object.getOwnPropertyDescriptors(e)), s && q(!0);
				});
				var t = o.nodes;
				if (t) {
					var l = H;
					l.nodes ? (l.nodes.start = t.start, l.nodes.end = t.end) : l.nodes = {
						start: t.start,
						end: t.end,
						a: null,
						t: null
					};
				}
			}
		}, Te), s = !0, t && (c = O), a;
	}
	return r[G] = e[G], r[ft] = {
		fn: e,
		current: n,
		update: (e) => {
			Ce(r[ft].current, e[ft].fn), e[ft].current = r[ft].current;
		}
	}, r;
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dev/ownership.js
function tn(e) {
	let t = V?.function, n = V?.p?.function;
	return {
		mutation: (r, i, a, o, s) => {
			let c = i[0];
			if (nn(e, c) || !n) return a;
			let l = e;
			for (let e = 0; e < i.length - 1; e++) if (l = l[i[e]], !l?.[I]) return a;
			let u = kt(`${t[G]}:${o}:${s}`);
			return yt(c, u, r, n[G]), a;
		},
		binding: (r, i, a) => {
			!nn(e, r) && n && a()?.[I] && bt(t[G], r, i[G], n[G]);
		}
	};
}
function nn(e, t) {
	let n = I in e || Ke in e;
	return !!U(e, t)?.set || n && t in e || !(t in e);
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dev/legacy.js
function rn(e) {
	e && Oe(e[G] ?? "a component", e.name);
}
function an() {
	let e = V?.function;
	function t(t) {
		je(t, e[G]);
	}
	return {
		$destroy: () => t("$destroy()"),
		$on: () => t("$on(...)"),
		$set: () => t("$set(...)")
	};
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dev/inspect.js
function on(e, t, n = !1) {
	x("$inspect");
	let r = !0, i = W;
	it(() => {
		i = W;
		try {
			var a = e();
		} catch (e) {
			i = e;
			return;
		}
		var o = Ee(a, !0, !0);
		L(() => {
			if (n) {
				if (t(...o), !r) {
					let e = Xe("$inspect(...)");
					e && (console.groupCollapsed("stack trace"), console.log(e), console.groupEnd());
				}
			} else t(r ? "init" : "update", ...o);
		}), r = !1;
	}), B(() => {
		try {
			e();
		} catch {}
		i !== W && (console.error(i), i = W);
	});
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/blocks/async.js
function sn(e, n = [], r = [], i) {
	var a = t, o = null;
	if (a && (S(), o = b(!1), K(e, o)), r.length === 0 && n.every((e) => e.settled)) {
		i(e), a && j(o);
		return;
	}
	if (a) {
		var s = O;
		j(o);
	}
	te(n, [], r, (t) => {
		a && (d(!0), j(s));
		try {
			for (let e of t) P(e);
			i(e, ...t);
		} finally {
			a && d(!1);
		}
	});
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dev/validation.js
function cn(e, ...t) {
	(typeof e != "object" || !(e instanceof Node)) && Ne();
	for (let e of t) typeof e != "function" && Ne();
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/blocks/branches.js
var J = class {
	anchor;
	#e = /* @__PURE__ */ new Map();
	#t = /* @__PURE__ */ new Map();
	#n = /* @__PURE__ */ new Map();
	#r = /* @__PURE__ */ new Set();
	#i = !0;
	constructor(e, t = !0) {
		this.anchor = e, this.#i = t;
	}
	#a = (e) => {
		if (this.#e.has(e)) {
			var t = this.#e.get(e), n = this.#t.get(t);
			if (n) w(n), this.#r.delete(t);
			else {
				var r = this.#n.get(t);
				r && (w(r.effect), this.#t.set(t, r.effect), this.#n.delete(t), r.fragment.lastChild.remove(), this.anchor.before(r.fragment), n = r.effect);
			}
			for (let [t, n] of this.#e) {
				if (this.#e.delete(t), t === e) break;
				let r = this.#n.get(n);
				r && (F(r.effect), this.#n.delete(n));
			}
			for (let [e, r] of this.#t) {
				if (e === t || this.#r.has(e)) continue;
				let i = () => {
					if (Array.from(this.#e.values()).includes(e)) {
						var t = document.createDocumentFragment();
						D(r, t), t.append(y()), this.#n.set(e, {
							effect: r,
							fragment: t
						});
					} else F(r);
					this.#r.delete(e), this.#t.delete(e);
				};
				this.#i || !n ? (this.#r.add(e), Fe(r, i, !1)) : i();
			}
		}
	};
	#o = (e) => {
		this.#e.delete(e);
		let t = Array.from(this.#e.values());
		for (let [e, n] of this.#n) t.includes(e) || (F(n.effect), this.#n.delete(e));
	};
	ensure(e, n) {
		var r = N, i = et();
		if (n && !this.#t.has(e) && !this.#n.has(e)) {
			if (i) {
				var a = document.createDocumentFragment(), o = y();
				a.append(o), this.#n.set(e, {
					effect: M(() => n(o)),
					fragment: a
				});
			} else this.#t.set(e, M(() => n(this.anchor)));
		}
		if (this.#e.set(r, e), i) {
			for (let [t, n] of this.#t) t === e ? r.unskip_effect(n) : r.skip_effect(n);
			for (let [t, n] of this.#n) t === e ? r.unskip_effect(n.effect) : r.skip_effect(n.effect);
			r.oncommit(this.#a), r.ondiscard(this.#o);
		} else t && (this.anchor = O), this.#a(r);
	}
}, ln = 0, un = 1, dn = 2;
function fn(e, n, r, i, a) {
	t && S();
	var o = we(), c = W, l = o ? R(c) : /* @__PURE__ */ ze(c, !1, !1), p = o ? R(c) : /* @__PURE__ */ ze(c, !1, !1), m = new J(e);
	z(() => {
		var o = N, c = n(), h = !1;
		let g = t && se(c) === (e.data === "[!");
		if (g && (j(b()), d(!1)), se(c)) {
			var _ = s(), v = !1;
			let e = (e) => {
				if (!h) {
					v = !0, _(!1), N === o && o.deactivate(), Ae.ensure();
					try {
						e();
					} finally {
						u(!1), ot || st();
					}
				}
			};
			c.then((t) => {
				e(() => {
					xe(l, t), m.ensure(un, i && ((e) => i(e, l)));
				});
			}, (t) => {
				e(() => {
					if (xe(p, t), m.ensure(dn, a && ((e) => a(e, p))), !a) throw p.v;
				});
			}), t ? m.ensure(ln, r) : f(() => {
				v || e(() => {
					m.ensure(ln, r);
				});
			});
		} else xe(l, c), m.ensure(un, i && ((e) => i(e, l)));
		return g && d(!0), () => {
			h = !0;
		};
	});
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/blocks/if.js
function pn(e, n, r = !1) {
	var i;
	t && (i = O, S());
	var a = new J(e), o = r ? Te : 0;
	function s(e, n) {
		if (t) {
			var r = m(i);
			if (e !== parseInt(r.substring(1))) {
				var o = b();
				j(o), a.anchor = o, d(!1), a.ensure(e, n), d(!0);
				return;
			}
		}
		a.ensure(e, n);
	}
	z(() => {
		var e = !1;
		n((t, n = 0) => {
			e = !0, s(n, t);
		}), e || s(-1, null);
	}, o);
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/blocks/key.js
var mn = Symbol("NaN");
function hn(e, n, r) {
	t && S();
	var i = new J(e), a = !we();
	z(() => {
		var e = n();
		e !== e && (e = mn), a && typeof e == "object" && e && (e = {}), i.ensure(e, r);
	});
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/blocks/css-props.js
function gn(e, n) {
	t && j(/* @__PURE__ */ _(e)), B(() => {
		var t = n();
		for (var r in t) {
			var i = t[r];
			i == null || i === "" ? e.style.removeProperty(r) : e.style.setProperty(r, i);
		}
	});
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/blocks/each.js
function _n(e, t) {
	return t;
}
function vn(e, t, n) {
	for (var r = [], i = t.length, a, o = t.length, s = 0; s < i; s++) {
		let n = t[s];
		Fe(n, () => {
			if (a) {
				if (a.pending.delete(n), a.done.add(n), a.pending.size === 0) {
					var t = e.outrogroups;
					yn(e, Be(a.done)), t.delete(a), t.size === 0 && (e.outrogroups = null);
				}
			} else --o;
		}, !1);
	}
	if (o === 0) {
		var c = r.length === 0 && n !== null && e.pending.size === 0;
		if (c) {
			var l = n, u = l.parentNode;
			p(u), u.append(l), e.items.clear();
		}
		yn(e, t, !c);
	} else a = {
		pending: new Set(t),
		done: /* @__PURE__ */ new Set()
	}, (e.outrogroups ??= /* @__PURE__ */ new Set()).add(a);
}
function yn(e, t, n = !0) {
	var r;
	if (e.pending.size > 0) {
		r = /* @__PURE__ */ new Set();
		for (let t of e.pending.values()) for (let n of t) r.add(e.items.get(n).e);
	}
	for (var i = 0; i < t.length; i++) {
		var a = t[i];
		if (r?.has(a)) {
			a.f |= re;
			let e = document.createDocumentFragment();
			D(a, e);
		} else F(t[i], n);
	}
}
var bn;
function xn(e, n, r, a, o, s = null) {
	var c = e, l = /* @__PURE__ */ new Map();
	if (n & 4) {
		var u = e;
		c = t ? j(/* @__PURE__ */ _(u)) : u.appendChild(y());
	}
	t && S();
	var f = null, p = /* @__PURE__ */ ce(() => {
		var e = r();
		return i(e) ? e : e == null ? [] : Be(e);
	}), h, g = /* @__PURE__ */ new Map(), v = !0;
	function x(e) {
		T.effect.f & 16384 || (T.pending.delete(e), T.fallback = f, Cn(T, h, c, n, a), f !== null && (h.length === 0 ? f.f & 33554432 ? (f.f ^= re, Tn(f, null, c)) : w(f) : Fe(f, () => {
			f = null;
		})));
	}
	function C(e) {
		T.pending.delete(e);
	}
	var T = {
		effect: z(() => {
			h = P(p);
			var e = h.length;
			let i = !1;
			t && m(c) === "[!" != (e === 0) && (c = b(), j(c), d(!1), i = !0);
			for (var u = /* @__PURE__ */ new Set(), _ = N, S = et(), w = 0; w < e; w += 1) {
				t && O.nodeType === 8 && O.data === "]" && (c = O, i = !0, d(!1));
				var T = h[w], E = a(T, w), D = v ? null : l.get(E);
				D ? (D.v && xe(D.v, T), D.i && xe(D.i, w), S && _.unskip_effect(D.e)) : (D = wn(l, v ? c : bn ??= y(), T, E, w, o, n, r), v || (D.e.f |= re), l.set(E, D)), u.add(E);
			}
			if (e === 0 && s && !f && (v ? f = M(() => s(c)) : (f = M(() => s(bn ??= y())), f.f |= re)), e > u.size && he("", "", ""), t && e > 0 && j(b()), !v) {
				if (g.set(_, u), S) {
					for (let [e, t] of l) u.has(e) || _.skip_effect(t.e);
					_.oncommit(x), _.ondiscard(C);
				} else x(_);
			}
			i && d(!0), P(p);
		}),
		flags: n,
		items: l,
		pending: g,
		outrogroups: null,
		fallback: f
	};
	v = !1, t && (c = O);
}
function Sn(e) {
	for (; e !== null && !(e.f & 32);) e = e.next;
	return e;
}
function Cn(e, t, n, r, i) {
	var a = !!(r & 8), o = t.length, s = e.items, c = Sn(e.effect.first), l, u = null, d, p = [], m = [], h, g, _, v;
	if (a) for (v = 0; v < o; v += 1) h = t[v], g = i(h, v), _ = s.get(g).e, _.f & 33554432 || (_.nodes?.a?.measure(), (d ??= /* @__PURE__ */ new Set()).add(_));
	for (v = 0; v < o; v += 1) {
		if (h = t[v], g = i(h, v), _ = s.get(g).e, e.outrogroups !== null) for (let t of e.outrogroups) t.pending.delete(_), t.done.delete(_);
		if (_.f & 8192 && (w(_), a && (_.nodes?.a?.unfix(), (d ??= /* @__PURE__ */ new Set()).delete(_))), _.f & 33554432) {
			if (_.f ^= re, _ === c) Tn(_, null, n);
			else {
				var y = u ? u.next : c;
				_ === e.effect.last && (e.effect.last = _.prev), _.prev && (_.prev.next = _.next), _.next && (_.next.prev = _.prev), Y(e, u, _), Y(e, _, y), Tn(_, y, n), u = _, p = [], m = [], c = Sn(u.next);
				continue;
			}
		}
		if (_ !== c) {
			if (l !== void 0 && l.has(_)) {
				if (p.length < m.length) {
					var b = m[0], x;
					u = b.prev;
					var S = p[0], C = p[p.length - 1];
					for (x = 0; x < p.length; x += 1) Tn(p[x], b, n);
					for (x = 0; x < m.length; x += 1) l.delete(m[x]);
					Y(e, S.prev, C.next), Y(e, u, S), Y(e, C, b), c = b, u = C, --v, p = [], m = [];
				} else l.delete(_), Tn(_, c, n), Y(e, _.prev, _.next), Y(e, _, u === null ? e.effect.first : u.next), Y(e, u, _), u = _;
				continue;
			}
			for (p = [], m = []; c !== null && c !== _;) (l ??= /* @__PURE__ */ new Set()).add(c), m.push(c), c = Sn(c.next);
			if (c === null) continue;
		}
		_.f & 33554432 || p.push(_), u = _, c = Sn(_.next);
	}
	if (e.outrogroups !== null) {
		for (let t of e.outrogroups) t.pending.size === 0 && (yn(e, Be(t.done)), e.outrogroups?.delete(t));
		e.outrogroups.size === 0 && (e.outrogroups = null);
	}
	if (c !== null || l !== void 0) {
		var T = [];
		if (l !== void 0) for (_ of l) _.f & 8192 || T.push(_);
		for (; c !== null;) !(c.f & 8192) && c !== e.fallback && T.push(c), c = Sn(c.next);
		var E = T.length;
		if (E > 0) {
			var D = r & 4 && o === 0 ? n : null;
			if (a) {
				for (v = 0; v < E; v += 1) T[v].nodes?.a?.measure();
				for (v = 0; v < E; v += 1) T[v].nodes?.a?.fix();
			}
			vn(e, T, D);
		}
	}
	a && f(() => {
		if (d !== void 0) for (_ of d) _.nodes?.a?.apply();
	});
}
function wn(e, t, n, r, i, a, o, s) {
	var c = o & 1 ? o & 16 ? R(n) : /* @__PURE__ */ ze(n, !1, !1) : null, l = o & 2 ? R(i) : null;
	return {
		v: c,
		i: l,
		e: M(() => (a(t, c ?? n, l ?? i, s), () => {
			e.delete(r);
		}))
	};
}
function Tn(e, t, n) {
	if (e.nodes) for (var r = e.nodes.start, i = e.nodes.end, a = t && !(t.f & 33554432) ? t.nodes.start : n; r !== null;) {
		var o = /* @__PURE__ */ pe(r);
		if (a.before(r), r === i) return;
		r = o;
	}
}
function Y(e, t, n) {
	t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
function En(n, r, i = !1, a = !1, o = !1, s = !1) {
	var c = n, l = "";
	if (i) {
		var u = n;
		t && (c = j(/* @__PURE__ */ _(u)));
	}
	ne(() => {
		var n = H;
		if (l === (l = r() ?? "")) {
			t && S();
			return;
		}
		if (i && !t) {
			n.nodes = null, u.innerHTML = l, l !== "" && K(/* @__PURE__ */ _(u), u.lastChild);
			return;
		}
		if (n.nodes !== null && (e(n.nodes.start, n.nodes.end), n.nodes = null), l !== "") {
			if (t) {
				for (var s = O.data, d = S(), f = d; d !== null && (d.nodeType !== 8 || d.data !== "");) f = d, d = /* @__PURE__ */ pe(d);
				if (d === null) throw vt(), ut;
				K(O, f), c = j(d);
				return;
			}
			var p = A(a ? "svg" : o ? "math" : "template", a ? lt : o ? pt : void 0);
			p.innerHTML = l;
			var m = a || o ? p : p.content;
			if (K(/* @__PURE__ */ _(m), m.lastChild), a || o) for (; /* @__PURE__ */ _(m);) c.before(/* @__PURE__ */ _(m));
			else c.before(m);
		}
	});
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/blocks/slot.js
function Dn(e, n, r, i, a) {
	if (t && S(), n.$$host?.$$shadowRoot) {
		let t = A("slot");
		if (r !== "default" && (t.name = r), Ft(e, t), a !== null) {
			let e = y();
			t.append(e), a(e);
		}
		return;
	}
	var o = n.$$slots?.[r], s = !1;
	o === !0 && (o = n[r === "default" ? "children" : r], s = !0), o === void 0 ? a !== null && a(e) : o(e, s ? () => i : i);
}
function On(e) {
	let t = {};
	e.children && (t.default = !0);
	for (let n in e.$$slots) t[n] = !0;
	return t;
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/blocks/snippet.js
function kn(e, t, ...n) {
	var r = new J(e);
	z(() => {
		let e = t() ?? null;
		r.ensure(e, e && ((t) => e(t, ...n)));
	}, Te);
}
function An(e, t) {
	let n = (n, ...r) => {
		var i = me;
		Ge(e);
		try {
			return t(n, ...r);
		} finally {
			Ge(i);
		}
	};
	return Rt(n), n;
}
function jn(e) {
	return (n, ...r) => {
		var i = e(...r), a;
		if (t) a = O, S();
		else {
			var o = i.render().trim(), s = Nt(o);
			a = /* @__PURE__ */ _(s), n.before(a);
		}
		let c = i.setup?.(a);
		K(a, a), typeof c == "function" && E(c);
	};
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/blocks/svelte-component.js
function Mn(e, n, r) {
	var i;
	t && (i = O, S());
	var a = new J(e);
	z(() => {
		var e = n() ?? null;
		if (t && m(i) === "[" != (e !== null)) {
			var o = b();
			j(o), a.anchor = o, d(!1), a.ensure(e, e && ((t) => r(t, e))), d(!0);
			return;
		}
		a.ensure(e, e && ((t) => r(t, e)));
	}, Te);
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/timing.js
var Nn = () => performance.now(), X = {
	tick: (e) => requestAnimationFrame(e),
	now: () => Nn(),
	tasks: /* @__PURE__ */ new Set()
};
//#endregion
//#region src/public/svelte-lib/src/internal/client/loop.js
function Pn() {
	let e = X.now();
	X.tasks.forEach((t) => {
		t.c(e) || (X.tasks.delete(t), t.f());
	}), X.tasks.size !== 0 && X.tick(Pn);
}
function Fn(e) {
	let t;
	return X.tasks.size === 0 && X.tick(Pn), {
		promise: new Promise((n) => {
			X.tasks.add(t = {
				c: e,
				f: n
			});
		}),
		abort() {
			X.tasks.delete(t);
		}
	};
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/transitions.js
function In(e, t) {
	ct(() => {
		e.dispatchEvent(new CustomEvent(t));
	});
}
function Ln(e) {
	if (e === "float") return "cssFloat";
	if (e === "offset") return "cssOffset";
	if (e.startsWith("--")) return e;
	let t = e.split("-");
	return t.length === 1 ? t[0] : t[0] + t.slice(1).map((e) => e[0].toUpperCase() + e.slice(1)).join("");
}
function Rn(e) {
	let t = {}, n = e.split(";");
	for (let e of n) {
		let [n, r] = e.split(":");
		if (!n || r === void 0) break;
		let i = Ln(n.trim());
		t[i] = r.trim();
	}
	return t;
}
var zn = (e) => e, Bn = null;
function Vn(e) {
	Bn = e;
}
function Hn(e, t, n) {
	var r = (Bn ?? H).nodes, i, a, o, s = null;
	r.a ??= {
		element: e,
		measure() {
			i = this.element.getBoundingClientRect();
		},
		apply() {
			if (o?.abort(), a = this.element.getBoundingClientRect(), i.left !== a.left || i.right !== a.right || i.top !== a.top || i.bottom !== a.bottom) {
				let e = t()(this.element, {
					from: i,
					to: a
				}, n?.());
				o = Wn(this.element, e, void 0, 1, () => {}, () => {
					o?.abort(), o = void 0;
				});
			}
		},
		fix() {
			if (!e.getAnimations().length) {
				var { position: t, width: n, height: r } = getComputedStyle(e);
				if (t !== "absolute" && t !== "fixed") {
					var a = e.style;
					s = {
						position: a.position,
						width: a.width,
						height: a.height,
						transform: a.transform
					}, a.position = "absolute", a.width = n, a.height = r;
					var o = e.getBoundingClientRect();
					if (i.left !== o.left || i.top !== o.top) {
						var c = `translate(${i.left - o.left}px, ${i.top - o.top}px)`;
						a.transform = a.transform ? `${a.transform} ${c}` : c;
					}
				}
			}
		},
		unfix() {
			if (s) {
				var t = e.style;
				t.position = s.position, t.width = s.width, t.height = s.height, t.transform = s.transform;
			}
		}
	}, r.a.element = e;
}
function Un(e, t, n, r) {
	var i = !!(e & 1), a = !!(e & 2), o = i && a, s = !!(e & 4), c = o ? "both" : i ? "in" : "out", l, u = t.inert, d = t.style.overflow, f, p;
	function m() {
		return ct(() => l ??= n()(t, r?.() ?? {}, { direction: c }));
	}
	var h = {
		is_global: s,
		in() {
			if (t.inert = u, !i) {
				p?.abort(), p?.reset?.();
				return;
			}
			a || f?.abort(), f = Wn(t, m(), p, 1, () => {
				In(t, "introstart");
			}, () => {
				In(t, "introend"), f?.abort(), f = l = void 0, t.style.overflow = d;
			});
		},
		out(e) {
			if (!a) {
				e?.(), l = void 0;
				return;
			}
			t.inert = !0, p = Wn(t, m(), f, 0, () => {
				In(t, "outrostart");
			}, () => {
				In(t, "outroend"), e?.();
			});
		},
		stop: () => {
			f?.abort(), p?.abort();
		}
	}, g = H;
	if ((g.nodes.t ??= []).push(h), i && Lt) {
		var _ = s;
		if (!_) {
			for (var v = g.parent; v && v.f & 65536;) for (; (v = v.parent) && !(v.f & 16););
			_ = !v || !!(v.f & 32768);
		}
		_ && k(() => {
			L(() => h.in());
		});
	}
}
function Wn(e, t, n, r, i, a) {
	var o = r === 1, s = !1;
	if (nt(t)) {
		var l;
		return f(() => {
			s || (l = Wn(e, t({ direction: o ? "in" : "out" }), n, r, i, a));
		}), {
			abort: () => {
				s = !0, l?.abort();
			},
			deactivate: () => l.deactivate(),
			reset: () => l.reset(),
			t: () => l.t()
		};
	}
	if (n?.deactivate(), !t?.duration && !t?.delay) return i(), a(), {
		abort: c,
		deactivate: c,
		reset: c,
		t: () => r
	};
	let { delay: u = 0, css: d, tick: p, easing: m = zn } = t;
	var h, g = () => 1 - r;
	return f(() => {
		if (!s) {
			var c = [];
			if (o && n === void 0 && (p && p(0, 1), d)) {
				var l = Rn(d(0, 1));
				c.push(l, l);
			}
			h = e.animate(c, {
				duration: u,
				fill: "forwards"
			}), h.onfinish = () => {
				h.cancel(), i();
				var o = n?.t() ?? 1 - r;
				n?.abort();
				var s = r - o, c = t.duration * Math.abs(s), l = [];
				if (c > 0) {
					var u = !1;
					if (d) for (var f = Math.ceil(c / (1e3 / 60)), _ = 0; _ <= f; _ += 1) {
						var v = o + s * m(_ / f), y = Rn(d(v, 1 - v));
						l.push(y), u ||= y.overflow === "hidden";
					}
					u && (e.style.overflow = "hidden"), g = () => {
						var e = h.currentTime;
						return o + s * m(e / c);
					}, p && Fn(() => {
						if (h.playState !== "running") return !1;
						var e = g();
						return p(e, 1 - e), !0;
					});
				}
				h = e.animate(l, {
					duration: c,
					fill: "forwards"
				}), h.onfinish = () => {
					g = () => r, p?.(r, 1 - r), a();
				};
			};
		}
	}), {
		abort: () => {
			s = !0, h && (h.cancel(), h.effect = null, h.onfinish = c);
		},
		deactivate: () => {
			a = c;
		},
		reset: () => {
			r === 0 && p?.(1, 0);
		},
		t: () => g()
	};
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/blocks/svelte-element.js
function Gn(e, n, r, i, a, o) {
	let s = t;
	t && S();
	var c = null;
	t && O.nodeType === 1 && (c = O, S());
	var l = t ? O : e, u = H, f = new J(l, !1);
	z(() => {
		let e = n() || null;
		var o = a ? a() : r || e === "svg" ? lt : void 0;
		if (e === null) {
			f.ensure(null, null), q(!0);
			return;
		}
		return f.ensure(e, (n) => {
			if (e) {
				if (c = t ? c : A(e, o), K(c, c), i) {
					var r = null;
					t && Tt(e) && c.append(r = document.createComment(""));
					var a = t ? /* @__PURE__ */ _(c) : c.appendChild(y());
					t && (a === null ? d(!1) : j(a)), Vn(u), i(c, a), r?.remove(), Vn(null);
				}
				H.nodes.end = c, n.before(c);
			}
			t && j(n);
		}), q(!0), () => {
			e && q(!1);
		};
	}, Te), E(() => {
		q(!0);
	}), s && (d(!0), j(l));
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/blocks/svelte-head.js
function Kn(e, n) {
	let r = null, i = t;
	var a;
	if (t) {
		r = O;
		for (var o = /* @__PURE__ */ _(document.head); o !== null && (o.nodeType !== 8 || o.data !== e);) o = /* @__PURE__ */ pe(o);
		if (o === null) d(!1);
		else {
			var s = /* @__PURE__ */ pe(o);
			o.remove(), j(s);
		}
	}
	t || (a = document.head.appendChild(y()));
	try {
		z(() => {
			var e = M(() => n(a));
			e.f |= Ue, t || (e.nodes === null ? e.nodes = {
				start: a,
				end: a,
				a: null,
				t: null
			} : e.nodes.end = a);
		});
	} finally {
		i && (d(!0), j(r));
	}
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/css.js
function qn(e, t) {
	k(() => {
		e = H?.parent?.nodes?.start ?? e;
		var n = e.getRootNode(), r = n.host ? n : n.head ?? n.ownerDocument.head;
		if (!r.querySelector("#" + t.hash)) {
			let e = A("style");
			e.id = t.hash, e.textContent = t.code, r.appendChild(e);
		}
	});
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/actions.js
function Jn(e, t, n) {
	k(() => {
		var r = L(() => t(e, n?.()) || {});
		if (n && r?.update) {
			var i = !1, a = {};
			B(() => {
				var e = n();
				Me(e), i && g(a, e) && (a = e, r.update(e));
			}), i = !0;
		}
		if (r?.destroy) return () => r.destroy();
	});
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/attachments.js
function Yn(e, t) {
	var n = void 0, r;
	a(() => {
		n !== (n = t()) && (r &&= (F(r), null), n && (r = M(() => {
			k(() => n(e));
		})));
	});
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/class.js
function Xn(e, n, r, i, a, o) {
	var s = e[v];
	if (t || s !== r || s === void 0) {
		var c = Vt(r, i, o);
		(!t || c !== e.getAttribute("class")) && (c == null ? e.removeAttribute("class") : n ? e.className = c : e.setAttribute("class", c)), e[v] = r;
	} else if (o && a !== o) for (var l in o) {
		var u = !!o[l];
		(a == null || u !== !!a[l]) && e.classList.toggle(l, u);
	}
	return o;
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/style.js
function Zn(e, t = {}, n, r) {
	for (var i in n) {
		var a = n[i];
		t[i] !== a && (n[i] == null ? e.style.removeProperty(i) : e.style.setProperty(i, a, r));
	}
}
function Qn(e, n, r, i) {
	var a = e[De];
	if (t || a !== n) {
		var o = zt(n, i);
		(!t || o !== e.getAttribute("style")) && (o == null ? e.removeAttribute("style") : e.style.cssText = o), e[De] = n;
	} else i && (Array.isArray(i) ? (Zn(e, r?.[0], i[0]), Zn(e, r?.[1], i[1], "important")) : Zn(e, r, i));
	return i;
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/bindings/select.js
function $n(e, t) {
	t ? e.hasAttribute("selected") || e.setAttribute("selected", "") : e.removeAttribute("selected");
}
function er(e, t) {
	var n = !("__defaultValue" in e);
	(n || e.__defaultValue !== t) && (e.__defaultValue = t, tr(e, !n || "__value" in e));
}
function tr(e, t) {
	var n = e.__defaultValue, r = e.multiple, a = r ? n ?? [] : null;
	if (!r || i(a)) {
		var o = e.selectedIndex, s = t && r ? new Set(e.selectedOptions) : null;
		for (var c of e.options) {
			var l = Z(c);
			$n(c, r ? a.includes(l) : _e(l, n));
		}
		if (t) {
			if (s !== null) for (c of e.options) {
				var u = s.has(c);
				c.selected !== u && (c.selected = u);
			}
			else e.selectedIndex !== o && (e.selectedIndex = o);
		}
	}
}
function nr(e, t, n = !1) {
	if (e.multiple) {
		if (t == null) return;
		if (!i(t)) return ht();
		for (var r of e.options) r.selected = t.includes(Z(r));
		return;
	}
	for (r of e.options) {
		var a = Z(r);
		if (_e(a, t)) {
			r.selected = !0;
			return;
		}
	}
	(!n || t !== void 0) && (e.selectedIndex = -1);
}
function rr(e) {
	var t = new MutationObserver((t) => {
		t.every(ar) || ("__defaultValue" in e && tr(e, !1), "__value" in e && nr(e, e.__value));
	});
	t.observe(e, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: ["value"]
	}), E(() => {
		t.disconnect();
	});
}
function ir(e, t, n = t) {
	var r = /* @__PURE__ */ new WeakSet(), i = !0;
	ie(e, "change", (t) => {
		var i = t ? "[selected]" : ":checked", a;
		if (e.multiple) a = [].map.call(e.querySelectorAll(i), Z);
		else {
			var o = e.querySelector(i) ?? e.querySelector("option:not([disabled])");
			a = o && Z(o);
		}
		n(a), e.__value = a, N !== null && r.add(N);
	}), k(() => {
		var a = t();
		if (e === document.activeElement) {
			var o = wt ? ae : N;
			if (r.has(o)) return;
		}
		if (nr(e, a, i), i && a === void 0) {
			var s = e.querySelector(":checked");
			s !== null && (a = Z(s), n(a));
		}
		e.__value = a, i = !1;
	});
}
function Z(e) {
	return "__value" in e ? e.__value : e.value;
}
function ar(e) {
	if (e.target.closest("selectedcontent") !== null) return !0;
	if (e.type === "childList") {
		var t = [...e.addedNodes, ...e.removedNodes];
		return t.length > 0 && t.every((e) => e.nodeName === "SELECTEDCONTENT");
	}
	return !1;
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/attributes.js
var Q = Symbol("class"), or = Symbol("style"), sr = Symbol("is custom element"), cr = Symbol("is html"), lr = ge ? "link" : "LINK", ur = ge ? "input" : "INPUT", dr = ge ? "option" : "OPTION", fr = ge ? "select" : "SELECT", pr = ge ? "progress" : "PROGRESS";
function mr(e) {
	if (t) {
		var r = !1, i = () => {
			if (!r) {
				if (r = !0, e.hasAttribute("value")) {
					var t = e.value;
					$(e, "value", null), e.value = t;
				}
				if (e.hasAttribute("checked")) {
					var n = e.checked;
					$(e, "checked", null), e.checked = n;
				}
			}
		};
		e[$e] = i, f(i), n();
	}
}
function hr(e, t) {
	var n = Cr(e);
	n.value !== (n.value = t ?? void 0) && (e.value !== t || t === 0 && e.nodeName === pr) && (e.value = t ?? "");
}
function gr(e, t) {
	var n = Cr(e);
	n.checked !== (n.checked = t ?? void 0) && (e.checked = t);
}
function _r(e, t) {
	let n = e.checked;
	e.defaultChecked = t, e.checked = n;
}
function vr(e, t) {
	let n = e.value;
	e.defaultValue = t, e.value = n;
}
function $(e, n, r, i) {
	var a = Cr(e);
	t && (a[n] = e.getAttribute(n), n === "src" || n === "srcset" || n === "href" && e.nodeName === lr) || a[n] !== (a[n] = r) && (n === "loading" && (e[Ze] = r), r == null ? e.removeAttribute(n) : typeof r != "string" && Tr(e).has(n) ? e[n] = r : e.setAttribute(n, r));
}
function yr(e, t, n) {
	e.setAttributeNS("http://www.w3.org/1999/xlink", t, n);
}
function br(e, n, r) {
	var i = He, a = H;
	let o = t;
	t && d(!1), Re(null), be(null);
	try {
		n !== "style" && (wr.has(e.getAttribute("is") || e.nodeName) || !customElements || customElements.get(e.getAttribute("is") || e.nodeName.toLowerCase()) ? Tr(e).has(n) : r && typeof r == "object") ? e[n] = r : $(e, n, r == null ? r : String(r));
	} finally {
		Re(i), be(a), o && d(!0);
	}
}
function xr(e, n, r, i, a = !1, o = !1) {
	t && a && e.nodeName === ur && ("defaultValue" in r || "defaultChecked" in r || mr(e));
	var s = Cr(e), c = s[sr], l = !s[cr];
	let u = t && c;
	u && d(!1);
	var f = n || {}, p = e.nodeName === dr, m = e.nodeName === fr;
	for (var h in n) !(h in r) && h[0] + h[1] !== "$$" && (r[h] = null);
	r.class ? r.class = Bt(r.class) : (i || r[Q]) && (r.class = null), r[or] && (r.style ??= null);
	var g = Tr(e);
	if (e.nodeName === ur && "type" in r && ("value" in r || "__value" in r)) {
		var _ = r.type;
		(_ !== f.type || _ === void 0 && e.hasAttribute("type")) && (f.type = _, $(e, "type", _, o));
	}
	for (let t in r) {
		let a = r[t];
		if (p && t === "value" && a == null) {
			e.value = e.__value = "", f[t] = a;
			continue;
		}
		if (t === "class") {
			Xn(e, e.namespaceURI === "http://www.w3.org/1999/xhtml", a, i, n?.[Q], r[Q]), f[t] = a, f[Q] = r[Q];
			continue;
		}
		if (t === "style") {
			Qn(e, a, n?.[or], r[or]), f[t] = a, f[or] = r[or];
			continue;
		}
		var v = f[t];
		if (a !== v || a === void 0 && e.hasAttribute(t)) {
			f[t] = a;
			var y = t[0] + t[1];
			if (y !== "$$") {
				if (y === "on") {
					let n = {}, r = "$$" + t, i = t.slice(2);
					var b = Et(i);
					if (Dt(i) && (i = i.slice(0, -7), n.capture = !0), !b && v) {
						if (a != null) continue;
						e.removeEventListener(i, f[r], n), f[r] = null;
					}
					if (b) At(i, e, a), jt([i]);
					else if (a != null) {
						function a(e) {
							f[t].call(this, e);
						}
						f[r] = Mt(i, e, a, n);
					}
				} else if (t === "style") $(e, t, a);
				else if (t === "autofocus") de(e, !!a);
				else if (!c && (t === "__value" || t === "value" && a != null)) e.value = e.__value = a;
				else if (t === "selected" && p) $n(e, a);
				else {
					var x = t;
					l || (x = Ot(x));
					var S = x === "defaultValue" || x === "defaultChecked";
					if (m && x === "defaultValue") continue;
					if (a == null && !c && !S) {
						if (s[t] = null, x === "value" || x === "checked") {
							let t = e, r = n === void 0;
							if (x === "value") {
								let e = t.defaultValue;
								t.removeAttribute(x), t.defaultValue = e, t.value = t.__value = r ? e : null;
							} else {
								let e = t.defaultChecked;
								t.removeAttribute(x), t.defaultChecked = e, t.checked = r ? e : !1;
							}
						} else e.removeAttribute(t);
					} else S || (c || typeof a != "string") && g.has(x) ? (e[x] = a, x in s && (s[x] = W)) : typeof a != "function" && $(e, x, a, o);
				}
			}
		}
	}
	return u && d(!0), f;
}
function Sr(e, t, n = [], r = [], i = [], o, s = !1, c = !1) {
	te(i, n, r, (n) => {
		var r = void 0, i = {}, l = e.nodeName === fr, u = !1;
		if (a(() => {
			var a = t(...n.map(P)), d = xr(e, r, a, o, s, c);
			if (u && l) {
				var f = e;
				"defaultValue" in a && er(f, a.defaultValue), "value" in a && nr(f, a.value);
			}
			for (let e of Object.getOwnPropertySymbols(i)) a[e] || F(i[e]);
			for (let t of Object.getOwnPropertySymbols(a)) {
				var p = a[t];
				t.description === "@attach" && (!r || p !== r[t]) && (i[t] && F(i[t]), i[t] = M(() => Yn(e, () => p))), d[t] = p;
			}
			r = d;
		}), l) {
			var d = e;
			k(() => {
				var e = r;
				"defaultValue" in e && er(d, e.defaultValue), nr(d, e.value, !0), rr(d);
			});
		}
		u = !0;
	});
}
function Cr(e) {
	return e[Je] ??= {
		[sr]: e.nodeName.includes("-"),
		[cr]: e.namespaceURI === dt
	};
}
var wr = /* @__PURE__ */ new Map();
function Tr(e) {
	var t = e.getAttribute("is") || e.nodeName, n = wr.get(t);
	if (n) return n;
	wr.set(t, n = /* @__PURE__ */ new Set());
	for (var r, i = e, a = Element.prototype; a !== i;) {
		for (var o in r = ye(i), r) r[o].set && o !== "innerHTML" && o !== "textContent" && o !== "innerText" && n.add(o);
		i = at(i);
	}
	return n;
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/customizable-select.js
var Er = null;
function Dr() {
	if (Er === null) {
		var e = A("select");
		e.innerHTML = Pt("<option><span>t</span></option>"), Er = e.firstChild?.firstChild?.nodeType === 1;
	}
	return Er;
}
function Or(e, t) {
	Dr() && Yn(e, () => () => {
		let n = e.closest("select");
		if (!n) return;
		let r = new MutationObserver((n) => {
			var r = !1;
			for (let t of n) {
				if (t.target === e) return;
				r ||= !!t.target.parentElement?.closest("option")?.selected;
			}
			r && (e.replaceWith(e = e.cloneNode(!0)), t(e));
		});
		return r.observe(n, {
			childList: !0,
			characterData: !0,
			subtree: !0
		}), () => {
			r.disconnect();
		};
	});
}
function kr(e, n) {
	var r = t;
	Dr() || (d(!1), e.textContent = "", e.append(le("")));
	try {
		n();
	} finally {
		r && (t ? ue(e) : (d(!0), j(e)));
	}
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/bindings/document.js
function Ar(e) {
	C(document, ["focusin", "focusout"], (t) => {
		t && t.type === "focusout" && t.relatedTarget || e(document.activeElement);
	});
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/bindings/input.js
function jr(e, n, r = n) {
	var i = /* @__PURE__ */ new WeakSet();
	ie(e, "input", async (t) => {
		var a = t ? e.defaultValue : e.value;
		if (a = Ir(e) ? Lr(a) : a, r(a), N !== null && i.add(N), await Se(), a !== (a = n())) {
			var o = e.selectionStart, s = e.selectionEnd, c = e.value.length;
			if (e.value = a ?? "", s !== null) {
				var l = e.value.length;
				o === s && s === c && l > c ? (e.selectionStart = l, e.selectionEnd = l) : (e.selectionStart = o, e.selectionEnd = Math.min(s, l));
			}
		}
	}), (t && e.defaultValue !== e.value || L(n) == null && e.value) && (r(Ir(e) ? Lr(e.value) : e.value), N !== null && i.add(N)), B(() => {
		var t = n();
		if (e === document.activeElement) {
			var r = wt ? ae : N;
			if (i.has(r)) return;
		}
		Ir(e) && t === Lr(e.value) || (e.type !== "date" || t || e.value) && t !== e.value && (e.value = t ?? "");
	});
}
var Mr = /* @__PURE__ */ new Set();
function Nr(e, n, r, i, a = i) {
	var o = r.getAttribute("type") === "checkbox", s = e;
	let c = !1;
	if (n !== null) for (var l of n) s = s[l] ??= [];
	s.push(r), ie(r, "change", () => {
		var e = r.__value;
		o && (e = Fr(s, e, r.checked)), a(e);
	}, () => a(o ? [] : null)), B(() => {
		var e = i();
		if (t && r.defaultChecked !== r.checked) {
			c = !0;
			return;
		}
		o ? (e ||= [], r.checked = e.includes(r.__value)) : r.checked = _e(r.__value, e);
	}), E(() => {
		var e = s.indexOf(r);
		e !== -1 && s.splice(e, 1);
	}), Mr.has(s) || (Mr.add(s), f(() => {
		s.sort((e, t) => e.compareDocumentPosition(t) === 4 ? -1 : 1), Mr.delete(s);
	})), f(() => {
		if (c) {
			var e = o ? Fr(s, e, r.checked) : s.find((e) => e.checked)?.__value;
			a(e);
		}
	});
}
function Pr(e, n, r = n) {
	ie(e, "change", (t) => {
		r(t ? e.defaultChecked : e.checked);
	}), (t && e.defaultChecked !== e.checked || L(n) == null) && r(e.checked), B(() => {
		e.checked = !!n();
	});
}
function Fr(e, t, n) {
	for (var r = /* @__PURE__ */ new Set(), i = 0; i < e.length; i += 1) e[i].checked && r.add(e[i].__value);
	return n || r.delete(t), Array.from(r);
}
function Ir(e) {
	var t = e.type;
	return t === "number" || t === "range";
}
function Lr(e) {
	return e === "" ? null : +e;
}
function Rr(e, n, r = n) {
	ie(e, "change", () => {
		r(e.files);
	}), t && e.files && r(e.files), B(() => {
		e.files = n();
	});
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/bindings/media.js
function zr(e) {
	for (var t = [], n = 0; n < e.length; n += 1) t.push({
		start: e.start(n),
		end: e.end(n)
	});
	return t;
}
function Br(e, t, n = t) {
	var r, i, a = () => {
		cancelAnimationFrame(r), e.paused || (r = requestAnimationFrame(a));
		var t = e.currentTime;
		i !== t && n(i = t);
	};
	r = requestAnimationFrame(a), e.addEventListener("timeupdate", a), B(() => {
		var n = Number(t());
		i !== n && !isNaN(n) && (e.currentTime = i = n);
	}), E(() => {
		cancelAnimationFrame(r), e.removeEventListener("timeupdate", a);
	});
}
function Vr(e, t) {
	var n;
	C(e, [
		"loadedmetadata",
		"progress",
		"timeupdate",
		"seeking"
	], () => {
		var r = e.buffered;
		(!n || n.length !== r.length || n.some((e, t) => r.start(t) !== e.start || r.end(t) !== e.end)) && (n = zr(r), t(n));
	});
}
function Hr(e, t) {
	C(e, ["loadedmetadata"], () => t(zr(e.seekable)));
}
function Ur(e, t) {
	C(e, ["timeupdate"], () => t(zr(e.played)));
}
function Wr(e, t) {
	C(e, ["seeking", "seeked"], () => t(e.seeking));
}
function Gr(e, t) {
	C(e, ["timeupdate", "ended"], () => t(e.ended));
}
function Kr(e, t) {
	C(e, [
		"loadedmetadata",
		"loadeddata",
		"canplay",
		"canplaythrough",
		"playing",
		"waiting",
		"emptied"
	], () => t(e.readyState));
}
function qr(e, t, n = t) {
	k(() => {
		var n = Number(t());
		n !== e.playbackRate && !isNaN(n) && (e.playbackRate = n);
	}), k(() => {
		C(e, ["ratechange"], () => {
			n(e.playbackRate);
		});
	});
}
function Jr(e, t, n = t) {
	var r = t();
	C(e, [
		"play",
		"pause",
		"canplay"
	], () => {
		r !== e.paused && n(r = e.paused);
	}, r == null), k(() => {
		(r = !!t()) !== e.paused && (r ? e.pause() : e.play().catch((e) => {
			throw n(r = !0), e;
		}));
	});
}
function Yr(e, t, n = t) {
	var r = () => {
		n(e.volume);
	};
	t() ?? r(), C(e, ["volumechange"], r, !1), B(() => {
		var n = Number(t());
		n !== e.volume && !isNaN(n) && (e.volume = n);
	});
}
function Xr(e, t, n = t) {
	var r = () => {
		n(e.muted);
	};
	t() ?? r(), C(e, ["volumechange"], r, !1), B(() => {
		var n = !!t();
		e.muted !== n && (e.muted = n);
	});
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/bindings/navigator.js
function Zr(e) {
	C(window, ["online", "offline"], () => {
		e(navigator.onLine);
	});
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/bindings/props.js
function Qr(e, t, n) {
	var r = U(e, t);
	r && r.set && (e[t] = n, E(() => {
		e[t] = null;
	}));
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/bindings/size.js
var $r = class e {
	#e = /* @__PURE__ */ new WeakMap();
	#t;
	#n;
	static entries = /* @__PURE__ */ new WeakMap();
	constructor(e) {
		this.#n = e;
	}
	observe(e, t) {
		var n = this.#e.get(e) || /* @__PURE__ */ new Set();
		return n.add(t), this.#e.set(e, n), this.#r().observe(e, this.#n), () => {
			var n = this.#e.get(e);
			n.delete(t), n.size === 0 && (this.#e.delete(e), this.#t.unobserve(e));
		};
	}
	#r() {
		return this.#t ??= new ResizeObserver((t) => {
			for (var n of t) {
				e.entries.set(n.target, n);
				for (var r of this.#e.get(n.target) || []) r(n);
			}
		});
	}
}, ei = /* @__PURE__ */ new $r({ box: "content-box" }), ti = /* @__PURE__ */ new $r({ box: "border-box" }), ni = /* @__PURE__ */ new $r({ box: "device-pixel-content-box" });
function ri(e, t, n) {
	var r = (t === "contentRect" || t === "contentBoxSize" ? ei : t === "borderBoxSize" ? ti : ni).observe(e, (e) => n(e[t]));
	E(r);
}
function ii(e, t, n) {
	var r = ti.observe(e, () => n(e[t]));
	k(() => (L(() => n(e[t])), r));
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/bindings/this.js
function ai(e, t) {
	return e === t || e?.[I] === t;
}
function oi(e = Qe(), t, n, r) {
	var i = V.r, a = H;
	return k(() => {
		var o, s;
		return B(() => {
			o = s, s = r?.() || [], L(() => {
				ai(n(...s), e) || (t(e, ...s), o && ai(n(...o), e) && t(null, ...o));
			});
		}), () => {
			let r = a;
			for (; r !== i && r.parent !== null && r.parent.f & 33554432;) r = r.parent;
			let o = () => {
				s && ai(n(...s), e) && t(null, ...s);
			}, c = r.teardown;
			r.teardown = () => {
				o(), c?.();
			};
		};
	}), e;
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/bindings/universal.js
function si(e, t, n, r = n) {
	t.addEventListener("input", () => {
		r(t[e]);
	}), B(() => {
		var i = n();
		if (t[e] !== i) {
			if (i == null) {
				var a = t[e];
				r(a);
			} else t[e] = i + "";
		}
	});
}
function ci(e, t, n, r, i) {
	var a = () => {
		r(n[e]);
	};
	n.addEventListener(t, a), i ? B(() => {
		n[e] = i();
	}) : a(), (n === document.body || n === window || n === document) && E(() => {
		n.removeEventListener(t, a);
	});
}
function li(e, t) {
	C(e, ["focus", "blur"], () => {
		t(e === document.activeElement);
	});
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/bindings/window.js
function ui(e, t, n = t) {
	var r = e === "x", i = () => ct(() => {
		a = !0, clearTimeout(o), o = setTimeout(s, 100), n(window[r ? "scrollX" : "scrollY"]);
	});
	addEventListener("scroll", i, { passive: !0 });
	var a = !1, o, s = () => {
		a = !1;
	}, c = !0;
	B(() => {
		var e = t();
		c ? c = !1 : !a && e != null && (a = !0, clearTimeout(o), r ? scrollTo(e, window.scrollY) : scrollTo(window.scrollX, e), o = setTimeout(s, 100));
	}), k(i), E(() => {
		removeEventListener("scroll", i);
	});
}
function di(e, t) {
	C(window, ["resize"], () => ct(() => t(window[e])));
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/legacy/lifecycle.js
function fi(e = !1) {
	let t = V, n = t.l.u;
	if (!n) return;
	let r = () => Me(t.s);
	if (e) {
		let e = 0, n = {}, i = /* @__PURE__ */ rt(() => {
			let r = !1, i = t.s;
			for (let e in i) i[e] !== n[e] && (n[e] = i[e], r = !0);
			return r && e++, e;
		});
		r = () => P(i);
	}
	n.b.length && h(() => {
		pi(t, r), Le(n.b);
	}), l(() => {
		let e = L(() => n.m.map(ee));
		return () => {
			for (let t of e) typeof t == "function" && t();
		};
	}), n.a.length && l(() => {
		pi(t, r), Le(n.a);
	});
}
function pi(e, t) {
	if (e.l.s) for (let t of e.l.s) P(t);
	t();
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/legacy/misc.js
function mi(e) {
	var t = R(0);
	return function() {
		return arguments.length === 1 ? (Ce(t, P(t) + 1), arguments[0]) : (P(t), e());
	};
}
function hi(e, t) {
	var n = e.$$events?.[t.type];
	for (var r of i(n) ? n.slice() : n == null ? [] : [n]) r.call(this, t);
}
function gi(e, t, n) {
	e.$$events ||= {}, e.$$events[t] ||= [], e.$$events[t].push(n);
}
function _i(e) {
	for (var t in e) t in this && (this[t] = e[t]);
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/reactivity/store.js
var vi = !1, yi = Symbol("unmounted");
function bi(e, t, n) {
	let r = n[t] ??= {
		store: null,
		source: /* @__PURE__ */ ze(void 0),
		unsubscribe: c
	};
	if (r.store !== e && !(yi in n)) {
		if (r.unsubscribe(), r.store = e ?? null, e == null) r.source.v = void 0, r.unsubscribe = c;
		else {
			var i = !0;
			r.unsubscribe = Ht(e, (e) => {
				i ? r.source.v = e : Ce(r.source, e);
			}), i = !1;
		}
	}
	return e && yi in n ? Ut(e) : P(r.source);
}
function xi(e, t, n) {
	let r = n[t];
	return r && r.store !== e && (r.unsubscribe(), r.unsubscribe = c), e;
}
function Si(e, t) {
	return Ti(e, t), t;
}
function Ci(e, t) {
	var n = e[t];
	n.store !== null && Si(n.store, n.source.v);
}
function wi() {
	let e = {};
	function t() {
		E(() => {
			for (var t in e) e[t].unsubscribe();
			ke(e, yi, {
				enumerable: !1,
				value: !0
			});
		});
	}
	return [e, t];
}
function Ti(e, t) {
	try {
		e.set(t);
	} finally {}
}
function Ei(e, t, n) {
	return Ti(e, n), t;
}
function Di(e, t, n = 1) {
	return Ti(e, t + n), t;
}
function Oi(e, t, n = 1) {
	let r = t + n;
	return Ti(e, r), r;
}
function ki() {
	vi = !0;
}
function Ai(e) {
	var t = vi;
	try {
		return vi = !1, [e(), vi];
	} finally {
		vi = t;
	}
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/reactivity/props.js
function ji(e, t = 1) {
	let n = e();
	return e(n + t), n;
}
function Mi(e, t = 1) {
	let n = e() + t;
	return e(n), n;
}
var Ni = {
	get(e, t) {
		if (!e.exclude.has(t)) return e.props[t];
	},
	set(e, t) {
		return !1;
	},
	getOwnPropertyDescriptor(e, t) {
		if (!e.exclude.has(t) && t in e.props) return {
			enumerable: !0,
			configurable: !0,
			value: e.props[t]
		};
	},
	has(e, t) {
		return !e.exclude.has(t) && t in e.props;
	},
	ownKeys(e) {
		return Reflect.ownKeys(e.props).filter((t) => !e.exclude.has(t));
	}
};
/*#__NO_SIDE_EFFECTS__*/
function Pi(e, t, n) {
	return new Proxy({
		props: e,
		exclude: t
	}, Ni);
}
var Fi = {
	get(e, t) {
		if (!e.exclude.includes(t)) return P(e.version), t in e.special ? e.special[t]() : e.props[t];
	},
	set(e, t, n) {
		if (!(t in e.special)) {
			var r = H;
			try {
				be(e.parent_effect), e.special[t] = zi({ get [t]() {
					return e.props[t];
				} }, t, 4);
			} finally {
				be(r);
			}
		}
		return e.special[t](n), Ve(e.version), !0;
	},
	getOwnPropertyDescriptor(e, t) {
		if (!e.exclude.includes(t) && t in e.props) return {
			enumerable: !0,
			configurable: !0,
			value: e.props[t]
		};
	},
	deleteProperty(e, t) {
		return e.exclude.includes(t) ? !0 : (e.exclude.push(t), Ve(e.version), !0);
	},
	has(e, t) {
		return !e.exclude.includes(t) && t in e.props;
	},
	ownKeys(e) {
		return Reflect.ownKeys(e.props).filter((t) => !e.exclude.includes(t));
	}
};
function Ii(e, t) {
	return new Proxy({
		props: e,
		exclude: t,
		special: {},
		version: R(0),
		parent_effect: H
	}, Fi);
}
var Li = {
	get(e, t) {
		let n = e.props.length;
		for (; n--;) {
			let r = e.props[n];
			if (nt(r) && (r = r()), typeof r == "object" && r && t in r) return r[t];
		}
	},
	set(e, t, n) {
		let r = e.props.length;
		for (; r--;) {
			let i = e.props[r];
			nt(i) && (i = i());
			let a = U(i, t);
			if (a && a.set) return a.set(n), !0;
		}
		return !1;
	},
	getOwnPropertyDescriptor(e, t) {
		let n = e.props.length;
		for (; n--;) {
			let r = e.props[n];
			if (nt(r) && (r = r()), typeof r == "object" && r && t in r) {
				let e = U(r, t);
				return e && !e.configurable && (e.configurable = !0), e;
			}
		}
	},
	has(e, t) {
		if (t === I || t === Ke) return !1;
		for (let n of e.props) if (nt(n) && (n = n()), n != null && t in n) return !0;
		return !1;
	},
	ownKeys(e) {
		let t = [];
		for (let n of e.props) if (nt(n) && (n = n()), n) {
			for (let e in n) t.includes(e) || t.push(e);
			for (let e of Object.getOwnPropertySymbols(n)) t.includes(e) || t.push(e);
		}
		return t;
	}
};
function Ri(...e) {
	return new Proxy({ props: e }, Li);
}
function zi(e, t, n, r) {
	var i = !Ct || !!(n & 2), a = !!(n & 8), o = !!(n & 16), s = r, c = !0, l = void 0, u = () => o && i ? (l ??= /* @__PURE__ */ rt(r), P(l)) : (c && (c = !1, s = o ? L(r) : r), s);
	let d;
	if (a) {
		var f = I in e || Ke in e;
		d = U(e, t)?.set ?? (f && t in e ? (n) => e[t] = n : void 0);
	}
	var p, m = !1;
	a ? [p, m] = Ai(() => e[t]) : p = e[t], p === void 0 && r !== void 0 && (p = u(), d && (i && oe(t), d(p)));
	var h = i ? () => {
		var n = e[t];
		return n === void 0 ? u() : (c = !0, n);
	} : () => {
		var n = e[t];
		return n !== void 0 && (s = void 0), n === void 0 ? s : n;
	};
	if (i && !(n & 4)) return h;
	if (d) {
		var g = e.$$legacy;
		return (function(e, t) {
			return arguments.length > 0 ? ((!i || !t || g || m) && d(t ? h() : e), e) : h();
		});
	}
	var _ = !1, v = (n & 1 ? rt : ce)(() => (_ = !1, h()));
	a && P(v);
	var y = H;
	return (function(e, t) {
		if (arguments.length > 0) {
			let n = t ? P(v) : i && a ? qe(e) : e;
			return Ce(v, n), _ = !0, s !== void 0 && (s = n), e;
		}
		return We && _ || y.f & 16384 ? v.v : P(v);
	});
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/validate.js
function Bi(e, t, n, r, i, a) {
	Pe(t, () => {
		var t = !1, o = me?.[G];
		B(() => {
			if (!t) {
				var [s, c] = Ai(n);
				if (!c) {
					var l = r(), u = !1, d = B(() => {
						u || s[l];
					});
					if (u = !0, d.deps === null) {
						var f = `${o}:${i}:${a}`;
						xt(e, f), t = !0;
					}
				}
			}
		});
	});
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/custom-element.js
var Vi;
typeof HTMLElement == "function" && (Vi = class extends HTMLElement {
	$$ctor;
	$$s;
	$$c;
	$$cn = !1;
	$$d = {};
	$$r = !1;
	$$p_d = {};
	$$l = {};
	$$l_u = /* @__PURE__ */ new Map();
	$$me;
	$$shadowRoot = null;
	constructor(e, t, n) {
		super(), this.$$ctor = e, this.$$s = t, n && (this.$$shadowRoot = this.attachShadow(n));
	}
	addEventListener(e, t, n) {
		if (this.$$l[e] = this.$$l[e] || [], this.$$l[e].push(t), this.$$c) {
			let n = this.$$c.$on(e, t);
			this.$$l_u.set(t, n);
		}
		super.addEventListener(e, t, n);
	}
	removeEventListener(e, t, n) {
		if (super.removeEventListener(e, t, n), this.$$c) {
			let e = this.$$l_u.get(t);
			e && (e(), this.$$l_u.delete(t));
		}
	}
	async connectedCallback() {
		if (this.$$cn = !0, !this.$$c) {
			if (await Promise.resolve(), !this.$$cn || this.$$c) return;
			function e(e) {
				return (t) => {
					let n = A("slot");
					e !== "default" && (n.name = e), Ft(t, n);
				};
			}
			let t = {}, n = Ui(this);
			for (let r of this.$$s) r in n && (r === "default" && !this.$$d.children ? (this.$$d.children = e(r), t.default = !0) : t[r] = e(r));
			for (let e of this.attributes) {
				let t = this.$$g_p(e.name);
				t in this.$$d || (this.$$d[t] = Hi(t, e.value, this.$$p_d, "toProp"));
			}
			for (let e in this.$$p_d) !(e in this.$$d) && this[e] !== void 0 && (this.$$d[e] = this[e], delete this[e]);
			this.$$c = It({
				component: this.$$ctor,
				target: this.$$shadowRoot || this,
				props: {
					...this.$$d,
					$$slots: t,
					$$host: this
				}
			}), this.$$me = r(() => {
				B(() => {
					this.$$r = !0;
					for (let e of o(this.$$c)) {
						if (!this.$$p_d[e]?.reflect) continue;
						this.$$d[e] = this.$$c[e];
						let t = Hi(e, this.$$d[e], this.$$p_d, "toAttribute");
						t == null ? this.removeAttribute(this.$$p_d[e].attribute || e) : this.setAttribute(this.$$p_d[e].attribute || e, t);
					}
					this.$$r = !1;
				});
			});
			for (let e in this.$$l) for (let t of this.$$l[e]) {
				let n = this.$$c.$on(e, t);
				this.$$l_u.set(t, n);
			}
			this.$$l = {};
		}
	}
	attributeChangedCallback(e, t, n) {
		this.$$r || (e = this.$$g_p(e), this.$$d[e] = Hi(e, n, this.$$p_d, "toProp"), this.$$c?.$set({ [e]: this.$$d[e] }));
	}
	disconnectedCallback() {
		this.$$cn = !1, Promise.resolve().then(() => {
			!this.$$cn && this.$$c && (this.$$c.$destroy(), this.$$me(), this.$$c = void 0);
		});
	}
	$$g_p(e) {
		return o(this.$$p_d).find((t) => this.$$p_d[t].attribute === e || !this.$$p_d[t].attribute && t.toLowerCase() === e) || e;
	}
});
function Hi(e, t, n, r) {
	let i = n[e]?.type;
	if (t = i === "Boolean" && typeof t != "boolean" ? t != null : t, !r || !n[e]) return t;
	if (r === "toAttribute") switch (i) {
		case "Object":
		case "Array": return t == null ? null : JSON.stringify(t);
		case "Boolean": return t ? "" : null;
		case "Number": return t ?? null;
		default: return t;
	}
	else switch (i) {
		case "Object":
		case "Array": return t && JSON.parse(t);
		case "Boolean": return t;
		case "Number": return t == null ? t : +t;
		default: return t;
	}
}
function Ui(e) {
	let t = {};
	return e.childNodes.forEach((e) => {
		t[e.slot || "default"] = !0;
	}), t;
}
function Wi(e, t, n, r, i, a) {
	let s = class extends Vi {
		constructor() {
			super(e, n, i), this.$$p_d = t;
		}
		static get observedAttributes() {
			return o(t).map((e) => (t[e].attribute || e).toLowerCase());
		}
	};
	return o(t).forEach((e) => {
		ke(s.prototype, e, {
			get() {
				return this.$$c && e in this.$$c ? this.$$c[e] : this.$$d[e];
			},
			set(n) {
				n = Hi(e, n, t), this.$$d[e] = n;
				var r = this.$$c;
				r && (U(r, e)?.get ? r[e] = n : r.$set({ [e]: n }));
			}
		});
	}), r.forEach((e) => {
		ke(s.prototype, e, { get() {
			return this.$$c?.[e];
		} });
	}), a && (s = a(s)), e.element = s, s;
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dev/console-log.js
function Gi(e, ...t) {
	return L(() => {
		try {
			let n = !1, r = [];
			for (let e of t) e && typeof e == "object" && I in e ? (r.push(Ee(e, !0)), n = !0) : r.push(e);
			n && (gt(e), console.log("%c[snapshot]", "color: grey", ...r));
		} catch {}
	}), t;
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/hydratable.js
function Ki(e, n) {
	if (wt || Ie("hydratable"), t) {
		let t = window.__svelte?.h;
		if (t?.has(e)) return t.get(e);
		_t(e);
	}
	return n();
}
function qi() {
	return He === null && ve(), (He.ac ??= new AbortController()).signal;
}
function Ji(e) {
	V === null && T("onMount"), Ct && V.l !== null ? ea(V).m.push(e) : l(() => {
		let t = L(e);
		if (typeof t == "function") return t;
	});
}
function Yi(e) {
	V === null && T("onDestroy"), Ji(() => () => L(e));
}
function Xi(e, t, { bubbles: n = !1, cancelable: r = !1 } = {}) {
	return new CustomEvent(e, {
		detail: t,
		bubbles: n,
		cancelable: r
	});
}
function Zi() {
	let e = V;
	return e === null && T("createEventDispatcher"), (t, n, r) => {
		let a = e.s.$$events?.[t];
		if (a) {
			let o = i(a) ? a.slice() : [a], s = Xi(t, n, r);
			for (let t of o) t.call(e.x, s);
			return !s.defaultPrevented;
		}
		return !0;
	};
}
function Qi(e) {
	V === null && T("beforeUpdate"), V.l === null && tt("beforeUpdate"), ea(V).b.push(e);
}
function $i(e) {
	V === null && T("afterUpdate"), V.l === null && tt("afterUpdate"), ea(V).a.push(e);
}
function ea(e) {
	var t = e.l;
	return t.u ??= {
		a: [],
		b: [],
		m: []
	};
}
//#endregion
export { Rr as $, Xt as $t, fi as A, Fn as At, Zr as B, _n as Bt, xi as C, Yn as Ct, hi as D, Gn as Dt, gi as E, Kn as Et, ci as F, An as Ft, Jr as G, cn as Gt, Br as H, hn as Ht, oi as I, On as It, Kr as J, rn as Jt, qr as K, sn as Kt, ii as L, Dn as Lt, di as M, Mn as Mt, si as N, jn as Nt, mi as O, Hn as Ot, li as P, kn as Pt, Pr as Q, Zt as Qt, ri as R, En as Rt, Si as S, Xn as St, Di as T, qn as Tt, Gr as U, pn as Ut, Vr as V, gn as Vt, Xr as W, fn as Wt, Wr as X, tn as Xt, Hr as Y, an as Yt, Yr as Z, en as Zt, Ci as _, rr as _t, Yi as a, Q as at, bi as b, $n as bt, Gi as c, mr as ct, Ii as d, br as dt, qt as en, Nr as et, zi as f, _r as ft, ji as g, ir as gt, Mi as h, yr as ht, qi as i, Or as it, ui as j, X as jt, _i as k, Un as kt, Wi as l, $ as lt, Ri as m, hr as mt, Qi as n, Wt as nn, Ar as nt, Ji as o, or as ot, Pi as p, vr as pt, Ur as q, on as qt, Zi as r, Gt as rn, kr as rt, Ki as s, Sr as st, $i as t, Jt as tn, jr as tt, Bi as u, gr as ut, ki as v, nr as vt, Oi as w, Jn as wt, Ei as x, Qn as xt, wi as y, er as yt, Qr as z, xn as zt };
