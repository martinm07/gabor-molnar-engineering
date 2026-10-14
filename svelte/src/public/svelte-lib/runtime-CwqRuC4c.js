import { i as e, l as t, n } from "./constants-BmdHRGzy.js";
import { d as r, o as i, v as a } from "./warnings-DUVtILS5.js";
import { a as o, t as s } from "./flags-COsiZ1kr.js";
//#region src/public/svelte-lib/src/internal/shared/utils.js
var c = Array.isArray, l = Array.prototype.indexOf, u = Array.prototype.includes, d = Array.from, f = Object.keys, p = Object.defineProperty, ee = Object.getOwnPropertyDescriptor, te = Object.getOwnPropertyDescriptors, ne = Object.prototype, re = Array.prototype, m = Object.getPrototypeOf, ie = Object.isExtensible, ae = Object.prototype.hasOwnProperty;
function oe(e) {
	return typeof e == "function";
}
var se = () => {};
function ce(e) {
	return typeof e?.then == "function";
}
function le(e) {
	return e();
}
function ue(e) {
	for (var t = 0; t < e.length; t++) e[t]();
}
function de() {
	var e, t;
	return {
		promise: new Promise((n, r) => {
			e = n, t = r;
		}),
		resolve: e,
		reject: t
	};
}
function fe(e, t, n = !1) {
	return e === void 0 ? n ? t() : t : e;
}
function pe(e, t) {
	if (Array.isArray(e)) return e;
	if (t === void 0 || !(Symbol.iterator in e)) return Array.from(e);
	let n = [];
	for (let r of e) if (n.push(r), n.length === t) break;
	return n;
}
function me(e, t) {
	var n = {};
	for (var r in e) t.includes(r) || (n[r] = e[r]);
	for (var i of Object.getOwnPropertySymbols(e)) Object.propertyIsEnumerable.call(e, i) && !t.includes(i) && (n[i] = e[i]);
	return n;
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/constants.js
var he = 1 << 24, h = 1024, g = 2048, _ = 4096, ge = 8192, _e = 16384, ve = 32768, ye = 1 << 25, be = 65536, xe = 1 << 17, Se = 1 << 18, Ce = 1 << 19, we = 1 << 20, Te = 1 << 25, Ee = 1 << 21, De = 1 << 22, Oe = 1 << 23, v = Symbol("$state"), ke = Symbol("component"), Ae = Symbol("legacy props"), je = Symbol(""), Me = Symbol("proxy path"), Ne = Symbol("attributes"), Pe = Symbol("class"), Fe = Symbol("style"), Ie = Symbol("text"), Le = Symbol("form reset"), Re = Symbol("hmr anchor"), y = new class extends Error {
	name = "StaleReactionError";
	message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}(), ze = !!globalThis.document?.contentType && /* @__PURE__ */ globalThis.document.contentType.includes("xml"), b = !1;
function Be(e) {
	b = e;
}
var x;
function S(t) {
	if (t === null) throw r(), e;
	return x = t;
}
function Ve() {
	return S(/* @__PURE__ */ I(x));
}
function He(t) {
	if (b) {
		if (/* @__PURE__ */ I(x) !== null) throw r(), e;
		x = t;
	}
}
function Ue(e) {
	b && (x = e.content);
}
function We(e = 1) {
	if (b) {
		for (var t = e, n = x; t--;) n = /* @__PURE__ */ I(n);
		x = n;
	}
}
function Ge(e = !0) {
	for (var t = 0, n = x;;) {
		if (n.nodeType === 8) {
			var r = n.data;
			if (r === "]") {
				if (t === 0) return n;
				--t;
			} else (r === "[" || r === "[!" || r[0] === "[" && !isNaN(Number(r.slice(1)))) && (t += 1);
		}
		var i = /* @__PURE__ */ I(n);
		e && n.remove(), n = i;
	}
}
function Ke(t) {
	if (!t || t.nodeType !== 8) throw r(), e;
	return t.data;
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/reactivity/equality.js
function qe(e) {
	return e === this.v;
}
function Je(e, t) {
	return e == e ? e !== t || typeof e == "object" && !!e || typeof e == "function" : t == t;
}
function Ye(e) {
	return !Je(e, this.v);
}
//#endregion
//#region src/public/svelte-lib/src/internal/shared/errors.js
function Xe(e) {
	throw Error("https://svelte.dev/e/experimental_async_required");
}
function Ze() {
	throw Error("https://svelte.dev/e/invalid_default_snippet");
}
function Qe() {
	throw Error("https://svelte.dev/e/invalid_snippet_arguments");
}
function $e(e) {
	throw Error("https://svelte.dev/e/lifecycle_outside_component");
}
function et() {
	throw Error("https://svelte.dev/e/missing_context");
}
function tt() {
	throw Error("https://svelte.dev/e/set_context_after_init");
}
function nt() {
	throw Error("https://svelte.dev/e/snippet_without_render_tag");
}
function rt(e) {
	throw Error("https://svelte.dev/e/store_invalid_shape");
}
function it() {
	throw Error("https://svelte.dev/e/svelte_element_invalid_this_value");
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/errors.js
function at() {
	throw Error("https://svelte.dev/e/async_derived_orphan");
}
function ot() {
	throw Error("https://svelte.dev/e/bind_invalid_checkbox_value");
}
function st(e, t) {
	throw Error("https://svelte.dev/e/component_api_changed");
}
function ct(e, t) {
	throw Error("https://svelte.dev/e/component_api_invalid_new");
}
function lt(e, t, n) {
	throw Error("https://svelte.dev/e/each_key_duplicate");
}
function ut(e, t, n) {
	throw Error("https://svelte.dev/e/each_key_volatile");
}
function dt(e) {
	throw Error("https://svelte.dev/e/effect_in_teardown");
}
function ft() {
	throw Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function pt(e) {
	throw Error("https://svelte.dev/e/effect_orphan");
}
function mt() {
	throw Error("https://svelte.dev/e/effect_pending_outside_reaction");
}
function ht() {
	throw Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function gt() {
	throw Error("https://svelte.dev/e/fork_discarded");
}
function _t() {
	throw Error("https://svelte.dev/e/fork_timing");
}
function vt() {
	throw Error("https://svelte.dev/e/get_abort_signal_outside_reaction");
}
function yt(e) {
	throw Error("https://svelte.dev/e/hydratable_missing_but_required");
}
function bt() {
	throw Error("https://svelte.dev/e/hydration_failed");
}
function xt() {
	throw Error("https://svelte.dev/e/invalid_snippet");
}
function St(e) {
	throw Error("https://svelte.dev/e/lifecycle_legacy_only");
}
function Ct(e) {
	throw Error("https://svelte.dev/e/props_invalid_value");
}
function wt(e) {
	throw Error("https://svelte.dev/e/props_rest_readonly");
}
function Tt(e) {
	throw Error("https://svelte.dev/e/rune_outside_svelte");
}
function Et() {
	throw Error("https://svelte.dev/e/state_descriptors_fixed");
}
function Dt() {
	throw Error("https://svelte.dev/e/state_prototype_fixed");
}
function Ot() {
	throw Error("https://svelte.dev/e/state_unsafe_mutation");
}
function kt() {
	throw Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
function At(e) {
	console.warn("https://svelte.dev/e/dynamic_void_element_content");
}
//#endregion
//#region src/public/svelte-lib/src/internal/shared/clone.js
var jt = [];
function Mt(e, t = !1, n = !1) {
	return Nt(e, /* @__PURE__ */ new Map(), "", jt, null, n);
}
function Nt(e, t, n, r, i = null, a = !1) {
	if (typeof e == "object" && e) {
		var o = t.get(e);
		if (o !== void 0) return o;
		if (e instanceof Map) return new Map(e);
		if (e instanceof Set) return new Set(e);
		if (c(e)) {
			var s = Array(e.length);
			t.set(e, s), i !== null && t.set(i, s);
			for (var l = 0; l < e.length; l += 1) {
				var u = e[l];
				l in e && (s[l] = Nt(u, t, n, r, null, a));
			}
			return s;
		}
		if (m(e) === ne) {
			s = {}, t.set(e, s), i !== null && t.set(i, s);
			for (var d of Object.keys(e)) s[d] = Nt(e[d], t, n, r, null, a);
			return s;
		}
		if (e instanceof Date) return e.getTime(), structuredClone(e);
		if (typeof e.toJSON == "function" && !a) return Nt(e.toJSON(), t, n, r, e);
	}
	if (e instanceof EventTarget) return e;
	try {
		return structuredClone(e);
	} catch {
		return e;
	}
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dev/tracing.js
var C = null;
function Pt(e, n) {
	let r = e.v;
	if (r === t) return;
	let i = Ft(e), a = V, o = e.wv > a.wv || a.wv === 0, s = o ? "color: CornflowerBlue; font-weight: bold" : "color: grey; font-weight: normal";
	if (console.groupCollapsed(e.label ? `%c${i}%c ${e.label}` : `%c${i}%c`, s, o ? "font-weight: normal" : s, typeof r == "object" && r && v in r ? Mt(r, !0) : r), i === "$derived") {
		let t = new Set(e.deps);
		for (let e of t) Pt(e);
	}
	if (e.created && console.log(e.created), o && e.updated) for (let t of e.updated.values()) t.error && console.log(t.error);
	if (n) for (var c of n.traces) console.log(c);
	console.groupEnd();
}
function Ft(e) {
	return e.f & 4194306 ? "$derived" : e.label?.startsWith("$") ? "store" : "$state";
}
function It(e, t) {
	var n = C;
	try {
		C = {
			entries: /* @__PURE__ */ new Map(),
			reaction: V
		};
		var r = performance.now(), i = t(), a = (performance.now() - r).toFixed(2), o = Ji(e);
		if (!Qr()) console.log(`${o} %cran outside of an effect (${a}ms)`, "color: grey");
		else if (C.entries.size === 0) console.log(`${o} %cno reactive dependencies (${a}ms)`, "color: grey");
		else {
			console.group(`${o} %c(${a}ms)`, "color: grey");
			var s = C.entries;
			Ji(() => {
				for (let [e, t] of s) Pt(e, t);
			}), C = null, console.groupEnd();
		}
		return i;
	} finally {
		C = n;
	}
}
function Lt(e, t) {
	return e.label = t, Rt(e.v, t), e;
}
function Rt(e, t) {
	return e?.[Me]?.(t), e;
}
function zt(e) {
	return typeof e == "symbol" ? `Symbol(${e.description})` : typeof e == "function" ? "<function>" : typeof e == "object" && e ? "<object>" : String(e);
}
//#endregion
//#region src/public/svelte-lib/src/internal/shared/dev.js
function Bt(e) {
	let t = /* @__PURE__ */ Error(), n = Vt();
	return n.length === 0 ? null : (n.unshift("\n"), p(t, "stack", { value: n.join("\n") }), p(t, "name", { value: e }), t);
}
function Vt() {
	let e = Error.stackTraceLimit;
	Error.stackTraceLimit = Infinity;
	let t = (/* @__PURE__ */ Error()).stack;
	if (Error.stackTraceLimit = e, !t) return [];
	let n = t.split("\n"), r = [];
	for (let e = 0; e < n.length; e++) {
		let t = n[e], i = t.replaceAll("\\", "/");
		if (t.trim() !== "Error") {
			if (t.includes("validate_each_keys")) return [];
			i.includes("svelte/src/internal") || i.includes("node_modules/.vite") || r.push(t);
		}
	}
	return r;
}
//#endregion
//#region src/public/svelte-lib/src/internal/shared/context.js
function Ht(e, t, n) {
	let r = {};
	return [
		() => (n(r) || et(), e(r)),
		(e) => t(r, e),
		() => n(r)
	];
}
function Ut(e) {
	let t = e.p;
	for (; t !== null && t.c === null;) t = t.p;
	return t?.c ?? null;
}
function Wt(e, t) {
	return e === null && $e(t), e.c ??= new Map(Ut(e) || void 0);
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/context.js
var w = null;
function Gt(e) {
	w = e;
}
var Kt = null;
function qt(e, t, r, i, a, o) {
	let s = Kt;
	Kt = {
		type: t,
		file: r[n],
		line: i,
		column: a,
		parent: s,
		...o
	};
	try {
		return e();
	} finally {
		Kt = s;
	}
}
var Jt = null;
function Yt(e) {
	Jt = e;
}
function Xt() {
	return Ht(Zt, Qt, $t);
}
function Zt(e) {
	return Wt(w, "getContext").get(e);
}
function Qt(e, t) {
	let n = Wt(w, "setContext");
	if (s) {
		var r = W.f;
		!V && r & 32 && !w.i || tt();
	}
	return n.set(e, t), t;
}
function $t(e) {
	return Wt(w, "hasContext").has(e);
}
function en() {
	return Wt(w, "getAllContexts");
}
function tn(e, t = !1, n) {
	w = {
		p: w,
		i: !1,
		c: null,
		e: null,
		s: e,
		x: null,
		r: W,
		l: o && !t ? {
			s: null,
			u: null,
			$: []
		} : null
	};
}
function nn(e) {
	var t = w, n = t.e;
	if (n !== null) {
		t.e = null;
		for (var r of n) ti(r);
	}
	return e !== void 0 && (t.x = e), t.i = !0, w = t.p, rn(e);
}
function rn(e = {}) {
	return p(e, ke, { value: !0 }), e;
}
function an() {
	return !o || w !== null && w.l === null;
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/task.js
var T = [];
function on() {
	var e = T;
	T = [], ue(e);
}
function sn(e) {
	if (T.length === 0 && !Kn) {
		var t = T;
		queueMicrotask(() => {
			t === T && on();
		});
	}
	T.push(e);
}
function cn() {
	for (; T.length > 0;) on();
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/reactivity/status.js
var ln = ~(g | _ | h);
function E(e, t) {
	e.f = e.f & ln | t;
}
function un(e) {
	e.f & 512 || e.deps === null ? E(e, h) : E(e, _);
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/reactivity/utils.js
function dn(e, t, n) {
	e.f & 2048 ? t.add(e) : e.f & 4096 && n.add(e), E(e, h);
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/misc.js
function fn(e, t) {
	if (t) {
		let t = document.body;
		e.autofocus = !0, sn(() => {
			document.activeElement === t && e.focus();
		});
	}
}
function pn(e) {
	b && /* @__PURE__ */ Lr(e) !== null && Hr(e);
}
var mn = !1;
function hn() {
	mn || (mn = !0, document.addEventListener("reset", (e) => {
		Promise.resolve().then(() => {
			if (!e.defaultPrevented) for (let t of e.target.elements) t[Le]?.();
		});
	}, { capture: !0 }));
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/elements/bindings/shared.js
function gn(e, t, n, r = !0) {
	r && n();
	for (var i of t) e.addEventListener(i, n);
	$r(() => {
		for (var r of t) e.removeEventListener(r, n);
	});
}
function _n(e) {
	var t = V, n = W;
	U(null), G(null);
	try {
		return e();
	} finally {
		U(t), G(n);
	}
}
function vn(e, t, n, r = n) {
	e.addEventListener(t, () => _n(n));
	let i = e[Le];
	e[Le] = i ? () => {
		i(), r(!0);
	} : () => r(!0), hn();
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/reactivity/async.js
function yn(e, t, n, r) {
	let i = an() ? Mn : In;
	var a = e.filter((e) => !e.settled), o = t.map(i);
	if (n.length === 0 && a.length === 0) {
		r(o);
		return;
	}
	var s = W, c = xn(), l = a.length === 1 ? a[0].promise : a.length > 1 ? Promise.all(a.map((e) => e.promise)) : null;
	function u(e) {
		if (!(s.f & 16384)) {
			c();
			try {
				r([...o, ...e]);
			} catch (e) {
				L(e, s);
			}
			D();
		}
	}
	var d = kn();
	if (n.length === 0) {
		l.then(() => u([])).finally(d);
		return;
	}
	function f() {
		Promise.all(n.map((e) => /* @__PURE__ */ Pn(e))).then(u).catch((e) => L(e, s)).finally(d);
	}
	l ? l.then(() => {
		c(), f(), D();
	}) : f();
}
function bn(e, t) {
	yn(e, [], [], t);
}
function xn() {
	var e = W, t = V, n = w, r = O;
	return function(i = !0) {
		G(e), U(t), Gt(n), i && !(e.f & 16384) && (r?.activate(), r?.apply());
	};
}
var Sn = !1;
async function Cn(e) {
	var t = xn();
	wn();
	var n = await e;
	return () => (t(), Sn = !0, n);
}
function wn(e) {
	return Sn && D(), e;
}
async function Tn(e) {
	wn();
	var t = An;
	queueMicrotask(() => {
		An === t && jn(null);
	});
	var n = await e;
	return () => (jn(t), queueMicrotask(() => {
		An === t && jn(null);
	}), n);
}
async function* En(e) {
	let t = e[Symbol.asyncIterator]?.() ?? e[Symbol.iterator]?.();
	if (t === void 0) throw TypeError("value is not async iterable");
	let n = !0;
	try {
		for (;;) {
			let { done: e, value: i } = (await Tn(t.next()))();
			if (e) {
				n = !1;
				break;
			}
			var r = An;
			try {
				yield i;
			} catch (e) {
				throw jn(r), t.return !== void 0 && (await Tn(t.return()))(), e;
			}
			jn(r);
		}
	} catch (e) {
		throw n = !1, e;
	} finally {
		if (n && t.return !== void 0) return (await Tn(t.return()))().value;
	}
}
function D(e = !0) {
	Sn = !1, G(null), U(null), Gt(null), e && O?.deactivate();
}
function Dn(e) {
	let t = xn(), n = kn();
	var r = W, i = null;
	let a = (e) => {
		i = { error: e }, Ti(r) || L(e, r);
	};
	var o = Promise.resolve(e[0]()).catch(a), s = {
		promise: o,
		settled: !1
	}, c = [s];
	o.finally(() => {
		s.settled = !0, D();
	});
	for (let n of e.slice(1)) {
		o = o.then(() => {
			t();
			try {
				if (i) throw i.error;
				if (Ti(r)) throw y;
				return n();
			} finally {
				D();
			}
		}).catch(a);
		let e = {
			promise: o,
			settled: !1
		};
		c.push(e), o.finally(() => {
			e.settled = !0, D();
		});
	}
	return o.then(() => Promise.resolve()).finally(n), c;
}
function On(e) {
	return Promise.all(e.map((e) => e.promise));
}
function kn() {
	var e = W, t = e.b, n = O, r = !!t?.is_rendered();
	return t?.update_pending_count(1, n), n.increment(r, e), () => {
		t?.update_pending_count(-1, n), n.decrement(r, e);
	};
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/reactivity/deriveds.js
var An = null;
function jn(e) {
	An = e;
}
/*#__NO_SIDE_EFFECTS__*/
function Mn(e) {
	var n = 2 | g;
	return W !== null && (W.f |= Ce), {
		ctx: w,
		deps: null,
		effects: null,
		equals: qe,
		f: n,
		fn: e,
		reactions: null,
		rv: 0,
		v: t,
		wv: 0,
		parent: W,
		ac: null
	};
}
var Nn = Symbol("obsolete");
/*#__NO_SIDE_EFFECTS__*/
function Pn(e, n, r) {
	let i = W;
	i === null && at();
	var a = void 0, o = hr(t), s = !V, c = /* @__PURE__ */ new Set();
	return li(() => {
		var t = W, n = de();
		a = n.promise;
		try {
			Promise.resolve(e()).then(n.resolve, (e) => {
				e !== y && n.reject(e);
			}).finally(D);
		} catch (e) {
			n.reject(e), D();
		}
		var r = O;
		if (s) {
			if (t.f & 32768) var l = kn();
			if (i.b?.is_rendered()) r.async_deriveds.get(t)?.reject(Nn);
			else for (let e of c.values()) e.reject(Nn);
			c.add(n), r.async_deriveds.set(t, n);
		}
		let u = (e, t = void 0) => {
			l?.(), c.delete(n), t !== Nn && (r.activate(), t ? (o.f |= Oe, yr(o, t)) : (o.f & 8388608 && (o.f ^= Oe), yr(o, e)), r.deactivate());
		};
		n.promise.then(u, (e) => u(null, e || "unknown"));
	}), $r(() => {
		for (let e of c) e.reject(Nn);
	}), new Promise((e) => {
		function t(n) {
			function r() {
				n === a ? e(o) : t(a);
			}
			n.then(r, r);
		}
		t(a);
	});
}
/*#__NO_SIDE_EFFECTS__*/
function Fn(e) {
	let t = /* @__PURE__ */ Mn(e);
	return s || Mi(t), t;
}
/*#__NO_SIDE_EFFECTS__*/
function In(e) {
	let t = /* @__PURE__ */ Mn(e);
	return t.equals = Ye, t;
}
function Ln(e) {
	var t = e.effects;
	if (t !== null) {
		e.effects = null;
		for (var n = 0; n < t.length; n += 1) z(t[n]);
	}
}
function Rn(e) {
	var n, r = W, a = e.parent;
	if (!B && a !== null && e.v !== t && a.f & 24576) return i(), e.v;
	G(a);
	try {
		Ln(e), n = zi(e);
	} finally {
		G(r);
	}
	return n;
}
function zn(e) {
	var t = Rn(e);
	if (!e.equals(t) && (e.wv = Ii(), (!O?.is_fork || e.deps === null) && (O === null ? e.v = t : (O.capture(e, t, !0), Wn?.capture(e, t, !0)), e.deps === null))) {
		E(e, h);
		return;
	}
	B || (k === null ? un(e) : (Qr() || O?.is_fork) && k.set(e, t));
}
function Bn(e) {
	if (e.effects !== null) for (let t of e.effects) (t.teardown || t.ac) && (t.teardown?.(), t.ac !== null && _n(() => {
		t.ac.abort(y), t.ac = null;
	}), t.fn !== null && (t.teardown = se), Hi(t, 0), _i(t));
}
function Vn(e) {
	if (e.effects !== null) for (let t of e.effects) t.teardown && t.fn !== null && Q(t);
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/reactivity/batch.js
var Hn = null, Un = null, O = null, Wn = null, k = null, Gn = null, Kn = !1, qn = !1, Jn = null, Yn = null, Xn = 0, Zn = 1, A = class e {
	id = Zn++;
	#e = !1;
	linked = !0;
	#t = null;
	#n = null;
	async_deriveds = /* @__PURE__ */ new Map();
	current = /* @__PURE__ */ new Map();
	previous = /* @__PURE__ */ new Map();
	#r = /* @__PURE__ */ new Set();
	#i = /* @__PURE__ */ new Set();
	#a = 0;
	#o = /* @__PURE__ */ new Map();
	#s = null;
	#c = [];
	#l = [];
	#u = /* @__PURE__ */ new Set();
	#d = /* @__PURE__ */ new Set();
	#f = /* @__PURE__ */ new Map();
	#p = /* @__PURE__ */ new Set();
	is_fork = !1;
	#m = !1;
	constructor() {
		Un === null ? Hn = Un = this : (Un.#n = this, this.#t = Un), Un = this;
	}
	#h() {
		if (this.is_fork) return !0;
		for (let n of this.#o.keys()) {
			for (var e = n, t = !1; e.parent !== null;) {
				if (this.#f.has(e)) {
					t = !0;
					break;
				}
				e = e.parent;
			}
			if (!t) return !0;
		}
		return !1;
	}
	skip_effect(e) {
		this.#f.has(e) || this.#f.set(e, {
			d: [],
			m: []
		}), this.#p.delete(e);
	}
	unskip_effect(e, t = (e) => this.schedule(e)) {
		var n = this.#f.get(e);
		if (n) {
			this.#f.delete(e);
			for (var r of n.d) E(r, g), t(r);
			for (r of n.m) E(r, _), t(r);
		}
		this.#p.add(e);
	}
	#g() {
		var e = [];
		for (let i of this.#c) if (!(i.f & 16384 || !(i.f & 6144))) {
			for (var t = i, n = !1; t.parent !== null;) {
				t = t.parent;
				var r = t.f;
				if (r & 96) {
					if (!(r & 1024)) {
						n = !0;
						break;
					}
					t.f ^= h;
				}
			}
			n || e.push(t);
		}
		return this.#c = [], e;
	}
	#_() {
		this.#e = !0;
		for (let e of this.#u) this.#d.delete(e), E(e, g), this.schedule(e);
		for (let e of this.#d) E(e, _), this.schedule(e);
		this.apply();
		for (var t = Jn = [], n = [], r = Yn = []; this.#c.length > 0;) {
			Xn++ > 1e3 && (this.#C(), $n());
			for (let e of this.#g()) try {
				this.#v(e, t, n);
			} catch (t) {
				throw ur(e), this.#h() || this.discard(), t;
			}
		}
		if (O = null, r.length > 0) {
			var i = e.ensure();
			for (let e of r) i.schedule(e);
		}
		if (Jn = null, Yn = null, this.#h()) {
			this.#x(n), this.#x(t);
			for (let [e, t] of this.#f) lr(e, t);
			r.length > 0 && O.#_();
			return;
		}
		let a = this.#y();
		if (a) {
			this.#x(n), this.#x(t), a.#b(this);
			return;
		}
		this.#u.clear(), this.#d.clear();
		for (let e of this.#r) e(this);
		this.#r.clear(), Wn = this, er(n), er(t), Wn = null, this.#s?.resolve();
		var o = O;
		if (this.#a === 0 && (this.#c.length === 0 || o !== null) && (this.#C(), s && (this.#S(), O = o)), this.#c.length > 0) {
			if (o !== null) {
				for (let e of this.#c) o.#c.push(e);
				this.#c = [];
			} else o = this;
		}
		o !== null && (M.clear(), o.#_());
	}
	#v(e, t, n) {
		e.f ^= h;
		for (var r = e.first; r !== null;) {
			var i = r.f, a = !!(i & 96);
			if (!(a && i & 1024 || i & 8192 || this.#f.has(r)) && r.fn !== null) {
				a ? r.f ^= h : i & 4 ? t.push(r) : s && i & 16777224 ? n.push(r) : Li(r) && (i & 16 && this.#d.add(r), Q(r));
				var o = r.first;
				if (o !== null) {
					r = o;
					continue;
				}
			}
			for (; r !== null;) {
				var c = r.next;
				if (c !== null) {
					r = c;
					break;
				}
				r = r.parent;
			}
		}
	}
	#y() {
		for (var e = this.#t; e !== null;) {
			if (!e.is_fork) {
				for (let [t, [, n]] of this.current) if (e.current.has(t) && !n) return e;
			}
			e = e.#t;
		}
		return null;
	}
	#b(e) {
		for (let [t, n] of e.current) !this.previous.has(t) && e.previous.has(t) && this.previous.set(t, e.previous.get(t)), this.current.set(t, n);
		for (let [t, n] of e.async_deriveds) {
			let e = this.async_deriveds.get(t);
			e && n.promise.then(e.resolve).catch(e.reject);
		}
		e.async_deriveds.clear(), this.transfer_effects(e.#u, e.#d);
		let t = (e) => {
			var n = e.reactions;
			if (n !== null && !(e.f & 2 && !(e.f & 6144))) for (let e of n) {
				var r = e.f;
				if (r & 2) t(e);
				else {
					var i = e;
					r & 4194320 && !this.async_deriveds.has(i) && (this.#d.delete(i), E(i, g), this.schedule(i));
				}
			}
		};
		for (let e of this.current.keys()) t(e);
		this.oncommit(() => e.discard()), e.#C(), O = this, this.#_();
	}
	#x(e) {
		for (var t = 0; t < e.length; t += 1) dn(e[t], this.#u, this.#d);
	}
	capture(e, n, r = !1) {
		e.v !== t && !this.previous.has(e) && this.previous.set(e, e.v), e.f & 8388608 || (this.current.set(e, [n, r]), k?.set(e, n)), this.is_fork || (e.v = n);
	}
	activate() {
		O = this;
	}
	deactivate() {
		O = null, k = null;
	}
	flush() {
		try {
			qn = !0, O = this, this.#_();
		} finally {
			Xn = 0, Gn = null, Jn = null, Yn = null, qn = !1, O = null, k = null, M.clear();
		}
	}
	discard() {
		for (let e of this.#i) e(this);
		this.#i.clear();
		for (let e of this.async_deriveds.values()) e.reject(Nn);
		this.#C(), this.#s?.resolve();
	}
	register_created_effect(e) {
		this.#l.push(e);
	}
	#S() {
		for (let u = Hn; u !== null; u = u.#n) {
			var e = u.id < this.id, t = [];
			for (let [r, [i, a]] of this.current) {
				if (u.current.has(r)) {
					var n = u.current.get(r)[0];
					if (e && i !== n) u.current.set(r, [i, a]);
					else continue;
				}
				t.push(r);
			}
			if (e) for (let [e, t] of this.async_deriveds) {
				let n = u.async_deriveds.get(e);
				n && t.promise.then(n.resolve).catch(n.reject);
			}
			var r = [...u.current.keys()].filter((e) => !u.current.get(e)[1]);
			if (u.#e && r.length !== 0) {
				var i = r.filter((e) => !this.current.has(e));
				if (i.length === 0) e && u.discard();
				else if (t.length > 0) {
					if (e) for (let e of this.#p) u.unskip_effect(e, (e) => {
						e.f & 4194320 ? u.schedule(e) : u.#x([e]);
					});
					u.activate();
					var a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Map();
					for (var s of t) tr(s, i, a, o);
					o = /* @__PURE__ */ new Map();
					var c = [...u.current].filter(([e, t]) => {
						let n = this.current.get(e);
						return !n || n[0] !== t[0] || n[1] !== t[1];
					}).map(([e]) => e);
					if (c.length > 0) for (let e of this.#l) !(e.f & 155648) && rr(e, c, o) && (e.f & 4194320 ? (E(e, g), u.schedule(e)) : u.#u.add(e));
					if (u.#c.length > 0 && !u.#m) {
						u.apply();
						for (var l of u.#g()) u.#v(l, [], []);
					}
					u.deactivate();
				}
			}
		}
	}
	increment(e, t) {
		if (this.#a += 1, e) {
			let e = this.#o.get(t) ?? 0;
			this.#o.set(t, e + 1);
		}
	}
	decrement(e, t) {
		if (--this.#a, e) {
			let e = this.#o.get(t) ?? 0;
			e === 1 ? this.#o.delete(t) : this.#o.set(t, e - 1);
		}
		this.#m || (this.#m = !0, sn(() => {
			this.#m = !1, this.linked && this.flush();
		}));
	}
	transfer_effects(e, t) {
		for (let t of e) this.#u.add(t);
		for (let e of t) this.#d.add(e);
		e.clear(), t.clear();
	}
	oncommit(e) {
		this.#r.add(e);
	}
	ondiscard(e) {
		this.#i.add(e);
	}
	settled() {
		return (this.#s ??= de()).promise;
	}
	static ensure() {
		if (O === null) {
			let t = O = new e();
			!qn && !Kn && sn(() => {
				t.#e || t.flush();
			});
		}
		return O;
	}
	apply() {
		if (!s || !this.is_fork && this.#t === null && this.#n === null) {
			k = null;
			return;
		}
		k = /* @__PURE__ */ new Map();
		for (let [e, [t]] of this.current) k.set(e, t);
		for (let t = Hn; t !== null; t = t.#n) if (!(t === this || t.is_fork)) {
			var e = !1;
			if (t.id < this.id) {
				for (let [n, [, r]] of t.current) if (!r && this.current.has(n)) {
					e = !0;
					break;
				}
			}
			if (!e) for (let [e, n] of t.previous) k.has(e) || k.set(e, n);
		}
	}
	schedule(e) {
		if (Gn = e, e.b?.is_pending && e.f & 16777228 && !(e.f & 32768)) {
			e.b.defer_effect(e);
			return;
		}
		this.#c.push(e);
	}
	#C() {
		if (this.linked) {
			var e = this.#t, t = this.#n;
			e === null ? Hn = t : e.#n = t, t === null ? Un = e : t.#t = e, this.linked = !1;
		}
	}
};
function Qn(e) {
	var t = Kn;
	Kn = !0;
	try {
		var n;
		for (e && (O !== null && !O.is_fork && O.flush(), n = e());;) {
			if (cn(), O === null) return n;
			O.flush();
		}
	} finally {
		Kn = t;
	}
}
function $n() {
	try {
		ht();
	} catch (e) {
		L(e, Gn);
	}
}
var j = null;
function er(e) {
	var t = e.length;
	if (t !== 0) {
		for (var n = 0; n < t;) {
			var r = e[n++];
			if (!(r.f & 24576) && Li(r) && (j = /* @__PURE__ */ new Set(), Q(r), r.deps === null && r.first === null && r.nodes === null && r.teardown === null && r.ac === null && bi(r), j?.size > 0)) {
				M.clear();
				for (let e of j) {
					if (e.f & 24576) continue;
					let t = [e], n = e.parent;
					for (; n !== null;) j.has(n) && (j.delete(n), t.push(n)), n = n.parent;
					for (let e = t.length - 1; e >= 0; e--) {
						let n = t[e];
						n.f & 24576 || Q(n);
					}
				}
				j.clear();
			}
		}
		j = null;
	}
}
function tr(e, t, n, r) {
	if (!n.has(e) && (n.add(e), e.reactions !== null)) for (let i of e.reactions) {
		let e = i.f;
		e & 2 ? tr(i, t, n, r) : e & 4194320 && !(e & 2048) && rr(i, t, r) && (E(i, g), ir(i));
	}
}
function nr(e, t) {
	if (e.reactions !== null) for (let n of e.reactions) {
		let e = n.f;
		e & 2 ? nr(n, t) : e & 131072 && (E(n, g), t.add(n));
	}
}
function rr(e, t, n) {
	let r = n.get(e);
	if (r !== void 0) return r;
	if (e.deps !== null) for (let r of e.deps) {
		if (u.call(t, r)) return !0;
		if (r.f & 2 && rr(r, t, n)) return n.set(r, !0), !0;
	}
	return n.set(e, !1), !1;
}
function ir(e) {
	O.schedule(e);
}
var ar = [];
function or() {
	Qn(() => {
		let e = ar;
		ar = [];
		for (let t of e) xr(t);
	});
}
var sr = /* @__PURE__ */ new Map();
function cr(e) {
	var t = !0, n = void 0;
	if (V === null) return e();
	let r = V, i = sr.get(r) ?? hr(0);
	return sr.set(r, i), $r(() => {
		r.f & 33554432 && sr.delete(r);
	}), $(i), ri(() => {
		if (t) {
			var r = k;
			try {
				k = null, n = e();
			} finally {
				k = r;
			}
			return;
		}
		ar.length === 0 && sn(or), ar.push(i);
	}), t = !1, n;
}
function lr(e, t) {
	if (!(e.f & 32 && e.f & 1024)) {
		e.f & 2048 ? t.d.push(e) : e.f & 4096 && t.m.push(e), E(e, h);
		for (var n = e.first; n !== null;) lr(n, t), n = n.next;
	}
}
function ur(e) {
	E(e, h);
	for (var t = e.first; t !== null;) ur(t), t = t.next;
}
function dr(e) {
	s || Xe("fork"), O !== null && _t();
	var t = A.ensure();
	t.is_fork = !0, k = /* @__PURE__ */ new Map();
	var n = !1, r = t.settled();
	return Qn(e), {
		commit: async () => {
			if (n) {
				await r;
				return;
			}
			t.linked || gt(), n = !0, t.is_fork = !1;
			for (var [e, [i]] of t.current) e.v = i, e.wv = Ii();
			Qn(() => {
				var e = /* @__PURE__ */ new Set();
				for (var n of t.current.keys()) nr(n, e);
				pr(e), br();
			}), t.flush(), await r;
		},
		discard: () => {
			for (var e of t.current.keys()) e.wv = Ii();
			!n && t.linked && t.discard();
		}
	};
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/reactivity/sources.js
var fr = /* @__PURE__ */ new Set(), M = /* @__PURE__ */ new Map();
function pr(e) {
	fr = e;
}
var mr = !1;
function hr(e, t) {
	return {
		f: 0,
		v: e,
		reactions: null,
		equals: qe,
		rv: 0,
		wv: 0
	};
}
/*#__NO_SIDE_EFFECTS__*/
function N(e, t) {
	let n = hr(e, t);
	return Mi(n), n;
}
/*#__NO_SIDE_EFFECTS__*/
function gr(e, t = !1, n = !0) {
	let r = hr(e);
	return t || (r.equals = Ye), o && n && w !== null && w.l !== null && (w.l.s ??= []).push(r), r;
}
function _r(e, t) {
	return P(e, Ji(() => $(e))), t;
}
function P(e, t, n = !1) {
	return V !== null && (!H || V.f & 131072) && an() && V.f & 4325394 && (K === null || !K.has(e)) && Ot(), yr(e, n ? Tr(t) : t, Yn);
}
var F = null, vr = 0;
function yr(e, t, n = null) {
	if (!e.equals(t)) {
		B ? M.set(e, t) : M.has(e) || M.set(e, e.v);
		var r = A.ensure();
		if (r.capture(e, t), e.f & 2) {
			let t = e;
			e.f & 2048 && Rn(t), k === null && un(t);
		}
		e.wv = Ii(), F = null, vr = 0, wr(e, g, n), F = null, an() && W !== null && W.f & 1024 && !(W.f & 96) && (Y === null ? Ni([e]) : Y.push(e)), !r.is_fork && fr.size > 0 && !mr && br();
	}
	return t;
}
function br() {
	mr = !1;
	for (let e of fr) {
		e.f & 1024 && E(e, _);
		let t;
		try {
			t = Li(e);
		} catch {
			t = !0;
		}
		t && Q(e);
	}
	fr.clear();
}
function xr(e, t = 1) {
	var n = $(e), r = t === 1 ? n++ : n--;
	return P(e, n), r;
}
function Sr(e, t = 1) {
	var n = $(e);
	return P(e, t === 1 ? ++n : --n);
}
function Cr(e) {
	P(e, e.v + 1);
}
function wr(e, t, n) {
	var r = e.reactions;
	if (r !== null) {
		var i = an(), a = r.length;
		if (vr += a, vr > 1e5 && F === null && (F = /* @__PURE__ */ new Set()), F !== null) {
			if (F.has(e)) return;
			F.add(e);
		}
		for (var o = 0; o < a; o++) {
			var s = r[o], c = s.f;
			if (i || s !== W) {
				var l = (c & g) === 0;
				if (l && E(s, t), c & 131072) fr.add(s);
				else if (c & 2) {
					var u = s;
					k?.delete(u), wr(u, _, n);
				} else if (l) {
					var d = s;
					c & 16 && j !== null && j.add(d), n === null ? ir(d) : n.push(d);
				}
			}
		}
	}
}
function Tr(e) {
	if (typeof e != "object" || !e || v in e || ke in e) return e;
	let n = m(e);
	if (n !== ne && n !== re) return e;
	var r = /* @__PURE__ */ new Map(), i = c(e), a = /* @__PURE__ */ N(0), o = null, s = Z, l = (e) => {
		if (Z === s) return e();
		var t = V, n = Z;
		U(null), Fi(s);
		var r = e();
		return U(t), Fi(n), r;
	};
	return i && r.set("length", /* @__PURE__ */ N(e.length, o)), new Proxy(e, {
		defineProperty(e, t, n) {
			(!("value" in n) || n.configurable === !1 || n.enumerable === !1 || n.writable === !1) && Et();
			var i = r.get(t);
			return i === void 0 ? l(() => {
				var e = /* @__PURE__ */ N(n.value, o);
				return r.set(t, e), e;
			}) : P(i, n.value, !0), !0;
		},
		deleteProperty(e, n) {
			var i = r.get(n);
			if (i === void 0) {
				if (n in e) {
					let e = l(() => /* @__PURE__ */ N(t, o));
					r.set(n, e), Cr(a);
				}
			} else P(i, t), Cr(a);
			return !0;
		},
		get(n, i, a) {
			if (i === v) return e;
			var s = r.get(i), c = i in n;
			if (s === void 0 && (!c || ee(n, i)?.writable) && (s = l(() => /* @__PURE__ */ N(Tr(c ? n[i] : t), o)), r.set(i, s)), s !== void 0) {
				var u = $(s);
				return u === t ? void 0 : u;
			}
			return Reflect.get(n, i, a);
		},
		getOwnPropertyDescriptor(e, n) {
			this.has?.(e, n);
			var i = Reflect.getOwnPropertyDescriptor(e, n), a = r.get(n);
			if (a !== void 0) {
				var o = $(a);
				if (o === t) return;
				if (i && "value" in i) i.value = o;
				else return {
					enumerable: !0,
					configurable: !0,
					value: o,
					writable: !0
				};
			}
			return i;
		},
		has(e, n) {
			if (n === v) return !0;
			var i = r.get(n), a = i !== void 0 && i.v !== t || Reflect.has(e, n);
			return (i !== void 0 || W !== null && (!a || ee(e, n)?.writable)) && (i === void 0 && (i = l(() => /* @__PURE__ */ N(a ? Tr(e[n]) : t, o)), r.set(n, i)), $(i) === t) ? !1 : a;
		},
		set(e, n, s, c) {
			var u = r.get(n), d = n in e;
			if (i && n === "length") for (var f = s; f < u.v; f += 1) {
				var p = r.get(f + "");
				p === void 0 ? f in e && (p = l(() => /* @__PURE__ */ N(t, o)), r.set(f + "", p)) : P(p, t);
			}
			if (u === void 0) (!d || ee(e, n)?.writable) && (u = l(() => /* @__PURE__ */ N(void 0, o)), P(u, Tr(s)), r.set(n, u));
			else {
				d = u.v !== t;
				var te = l(() => Tr(s));
				P(u, te);
			}
			var ne = Reflect.getOwnPropertyDescriptor(e, n);
			if (ne?.set && ne.set.call(c, s), !d) {
				if (i && typeof n == "string") {
					var re = r.get("length"), m = Number(n);
					Number.isInteger(m) && m >= re.v && P(re, m + 1);
				}
				Cr(a);
			}
			return !0;
		},
		ownKeys(e) {
			$(a);
			var n = Reflect.ownKeys(e).filter((e) => {
				var n = r.get(e);
				return n === void 0 || n.v !== t;
			});
			for (var [i, o] of r) o.v !== t && !(i in e) && n.push(i);
			return n;
		},
		setPrototypeOf() {
			Dt();
		}
	});
}
function Er(e) {
	try {
		if (typeof e == "object" && e && v in e) return e[v];
	} catch {}
	return e;
}
function Dr(e, t) {
	return Object.is(Er(e), Er(t));
}
function Or(e, t, n = !0) {
	try {
		e === t != (Er(e) === Er(t)) && a(n ? "===" : "!==");
	} catch {}
	return e === t === n;
}
function kr(e, t, n = !0) {
	return e == t != (Er(e) == Er(t)) && a(n ? "==" : "!="), e == t === n;
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/dom/operations.js
var Ar, jr, Mr, Nr, Pr;
function Fr() {
	if (Ar === void 0) {
		Ar = window, jr = document, Mr = /Firefox/.test(navigator.userAgent);
		var e = Element.prototype, t = Node.prototype, n = Text.prototype;
		Nr = ee(t, "firstChild").get, Pr = ee(t, "nextSibling").get, ie(e) && (e[Pe] = void 0, e[Ne] = null, e[Fe] = void 0, e.__e = void 0), ie(n) && (n[Ie] = void 0);
	}
}
function Ir(e = "") {
	return document.createTextNode(e);
}
/*@__NO_SIDE_EFFECTS__*/
function Lr(e) {
	return Nr.call(e);
}
/*@__NO_SIDE_EFFECTS__*/
function I(e) {
	return Pr.call(e);
}
function Rr(e, t) {
	if (!b) return /* @__PURE__ */ Lr(e);
	var n = /* @__PURE__ */ Lr(x);
	if (n === null) n = x.appendChild(Ir());
	else if (t && n.nodeType !== 3) {
		var r = Ir();
		return n?.before(r), S(r), r;
	}
	return t && Jr(n), S(n), n;
}
function zr(e, t = !1) {
	if (!b) {
		var n = /* @__PURE__ */ Lr(e);
		return n instanceof Comment && n.data === "" ? /* @__PURE__ */ I(n) : n;
	}
	if (t) {
		if (x?.nodeType !== 3) {
			var r = Ir();
			return x?.before(r), S(r), r;
		}
		Jr(x);
	}
	return x;
}
function Br(e, t = !1) {
	if (!b) return /* @__PURE__ */ Lr(e);
	var n = Rr(e, t);
	return He(e), n;
}
function Vr(e, t = 1, n = !1) {
	let r = b ? x : e;
	for (var i; t--;) i = r, r = /* @__PURE__ */ I(r);
	if (!b) return r;
	if (n) {
		if (r?.nodeType !== 3) {
			var a = Ir();
			return r === null ? i?.after(a) : r.before(a), S(a), a;
		}
		Jr(r);
	}
	return S(r), r;
}
function Hr(e) {
	e.textContent = "";
}
function Ur() {
	return !s || j !== null ? !1 : (W.f & ve) !== 0;
}
function Wr(e, t, n) {
	return t == null || t === "http://www.w3.org/1999/xhtml" ? n ? document.createElement(e, { is: n }) : document.createElement(e) : n ? document.createElementNS(t, e, { is: n }) : document.createElementNS(t, e);
}
function Gr() {
	return document.createDocumentFragment();
}
function Kr(e = "") {
	return document.createComment(e);
}
function qr(e, t, n = "") {
	if (t.startsWith("xlink:")) {
		e.setAttributeNS("http://www.w3.org/1999/xlink", t, n);
		return;
	}
	return e.setAttribute(t, n);
}
function Jr(e) {
	if (e.nodeValue.length < 65536) return;
	let t = e.nextSibling;
	for (; t !== null && t.nodeType === 3;) t.remove(), e.nodeValue += t.nodeValue, t = e.nextSibling;
}
function Yr(e) {
	var t = W;
	if (t === null) return V.f |= Oe, e;
	if (!(t.f & 32768) && !(t.f & 4)) throw e;
	L(e, t);
}
function L(e, t) {
	if (!(t !== null && t.f & 16384)) {
		for (; t !== null;) {
			if (t.f & 128 && !(t.f & 33570816)) {
				if (!(t.f & 32768)) throw e;
				try {
					t.b.error(e);
					return;
				} catch (t) {
					e = t;
				}
			}
			t = t.parent;
		}
		throw e;
	}
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/reactivity/effects.js
function Xr(e) {
	W === null && (V === null && pt(e), ft()), B && dt(e);
}
function Zr(e, t) {
	var n = t.last;
	n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function R(e, t) {
	var n = W;
	n !== null && n.f & 8192 && (e |= ge);
	var r = {
		ctx: w,
		deps: null,
		nodes: null,
		f: e | g | 512,
		first: null,
		fn: t,
		last: null,
		next: null,
		parent: n,
		b: n && n.b,
		prev: null,
		teardown: null,
		wv: 0,
		ac: null
	};
	O?.register_created_effect(r);
	var i = r;
	if (e & 4) Jn === null ? A.ensure().schedule(r) : Jn.push(r);
	else if (t !== null) {
		try {
			Q(r);
		} catch (e) {
			throw z(r), e;
		}
		i.deps === null && i.teardown === null && i.nodes === null && i.first === i.last && !(i.f & 524288) && (i = i.first, e & 16 && e & 65536 && i !== null && (i.f |= be));
	}
	if (i !== null && (i.parent = n, n !== null && Zr(i, n), V !== null && V.f & 2 && !(e & 64))) {
		var a = V;
		(a.effects ??= []).push(i);
	}
	return r;
}
function Qr() {
	return V !== null && !H;
}
function $r(e) {
	let t = R(8, null);
	return E(t, h), t.teardown = e, t;
}
function ei(e) {
	Xr("$effect");
	var t = W.f;
	if (!V && t & 32 && w !== null && !w.i) {
		var n = w;
		(n.e ??= []).push(e);
	} else return ti(e);
}
function ti(e) {
	return R(4 | we, e);
}
function ni(e) {
	return Xr("$effect.pre"), R(8 | we, e);
}
function ri(e) {
	return R(xe, e);
}
function ii(e) {
	A.ensure();
	let t = R(64 | Ce, e);
	return () => {
		z(t);
	};
}
function ai(e) {
	A.ensure();
	let t = R(64 | Ce, e);
	return (e = {}) => new Promise((n) => {
		e.outro ? xi(t, () => {
			z(t), n(void 0);
		}) : (z(t), n(void 0));
	});
}
function oi(e) {
	return R(4, e);
}
function si(e, t) {
	var n = w, r = {
		effect: null,
		ran: !1,
		deps: e
	};
	n.l.$.push(r), r.effect = ui(() => {
		if (e(), !r.ran) {
			r.ran = !0;
			var n = W;
			try {
				G(n.parent), Ji(t);
			} finally {
				G(n);
			}
		}
	});
}
function ci() {
	var e = w;
	ui(() => {
		for (var t of e.l.$) {
			t.deps();
			var n = t.effect;
			n.f & 1024 && n.deps !== null && E(n, _), Li(n) && Q(n), t.ran = !1;
		}
	});
}
function li(e) {
	return R(De | Ce, e);
}
function ui(e, t = 0) {
	return R(8 | t, e);
}
function di(e, t = [], n = [], r = []) {
	yn(r, t, n, (t) => {
		R(8, () => {
			e(...t.map($));
		});
	});
}
function fi(e, t = [], n = [], r = []) {
	yn(r, t, n, (t) => {
		R(4, () => e(...t.map($)));
	});
}
function pi(e, t = 0) {
	return R(16 | t, e);
}
function mi(e, t = 0) {
	return R(he | t, e);
}
function hi(e) {
	return R(32 | Ce, e);
}
function gi(e) {
	var t = e.teardown;
	if (t !== null) {
		let n = B, r = V;
		ji(!0), U(null);
		try {
			t.call(null);
		} catch (t) {
			L(t, e.parent);
		} finally {
			ji(n), U(r);
		}
	}
}
function _i(e, t = !1) {
	var n = e.first;
	for (e.first = e.last = null; n !== null;) {
		let e = n.ac;
		e !== null && _n(() => {
			e.abort(y);
		});
		var r = n.next;
		n.f & 64 ? n.parent = null : z(n, t), n = r;
	}
}
function vi(e) {
	for (var t = e.first; t !== null;) {
		var n = t.next;
		t.f & 32 || z(t), t = n;
	}
}
function z(e, t = !0) {
	var n = !1;
	(t || e.f & 262144) && e.nodes !== null && e.nodes.end !== null && (yi(e.nodes.start, e.nodes.end), n = !0), e.f |= ye, _i(e, t && !n), Hi(e, 0);
	var r = e.nodes && e.nodes.t;
	if (r !== null) for (let e of r) e.stop();
	gi(e), e.f ^= ye, e.f |= _e;
	var i = e.parent;
	i !== null && i.first !== null && bi(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function yi(e, t) {
	for (; e !== null;) {
		var n = e === t ? null : /* @__PURE__ */ I(e);
		e.remove(), e = n;
	}
}
function bi(e) {
	var t = e.parent, n = e.prev, r = e.next;
	n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function xi(e, t, n = !0) {
	var r = [];
	e.f |= 256, Si(e, r, !0);
	var i = () => {
		n && z(e), t && t();
	}, a = r.length;
	if (a > 0) {
		var o = () => --a || i();
		for (var s of r) s.out(o);
	} else i();
}
function Si(e, t, n) {
	if (!(e.f & 8192)) {
		e.f ^= ge;
		var r = e.nodes && e.nodes.t;
		if (r !== null) for (let e of r) (e.is_global || n) && t.push(e);
		for (var i = e.first; i !== null;) {
			var a = i.next;
			if (!(i.f & 64)) {
				var o = !!(i.f & 65536) || !!(i.f & 32) && !!(e.f & 16);
				Si(i, t, o ? n : !1);
			}
			i = a;
		}
	}
}
function Ci(e) {
	e.f &= -257, wi(e, !0);
}
function wi(e, t) {
	if (!(e.f & 256) && e.f & 8192) {
		e.f ^= ge, e.f & 1024 || (E(e, g), A.ensure().schedule(e));
		for (var n = e.first; n !== null;) {
			var r = n.next, i = !!(n.f & 65536) || !!(n.f & 32);
			wi(n, i ? t : !1), n = r;
		}
		var a = e.nodes && e.nodes.t;
		if (a !== null) for (let e of a) (e.is_global || t) && e.in();
	}
}
function Ti(e = W) {
	return (e.f & _e) !== 0;
}
function Ei(e, t) {
	if (e.nodes) for (var n = e.nodes.start, r = e.nodes.end; n !== null;) {
		var i = n === r ? null : /* @__PURE__ */ I(n);
		t.append(n), n = i;
	}
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/legacy.js
var Di = null;
function Oi(e) {
	var t = Di;
	try {
		if (Di = /* @__PURE__ */ new Set(), Ji(e), t !== null) for (var n of Di) t.add(n);
		return Di;
	} finally {
		Di = t;
	}
}
function ki(e) {
	for (var t of Oi(e)) yr(t, t.v);
}
//#endregion
//#region src/public/svelte-lib/src/internal/client/runtime.js
var Ai = !1, B = !1;
function ji(e) {
	B = e;
}
var V = null, H = !1;
function U(e) {
	V = e;
}
var W = null;
function G(e) {
	W = e;
}
var K = null;
function Mi(e) {
	V !== null && (!s && V.f & 2097152 || V.f & 2) && (K ??= /* @__PURE__ */ new Set()).add(e);
}
var q = null, J = 0, Y = null;
function Ni(e) {
	Y = e;
}
var Pi = 1, X = 0, Z = X;
function Fi(e) {
	Z = e;
}
function Ii() {
	return ++Pi;
}
function Li(e) {
	var t = e.f;
	if (t & 2048) return !0;
	if (t & 4096) {
		for (var n = e.deps, r = n.length, i = 0; i < r; i++) {
			var a = n[i];
			if (Li(a) && zn(a), a.wv > e.wv) return !0;
		}
		t & 512 && k === null && E(e, h);
	}
	return !1;
}
function Ri(e, t, n = !0) {
	var r = e.reactions;
	if (r !== null && (s || K === null || !K.has(e))) for (var i = 0; i < r.length; i++) {
		var a = r[i];
		a.f & 2 ? Ri(a, t, !1) : t === a && (n ? E(a, g) : a.f & 1024 && E(a, _), ir(a));
	}
}
function zi(e) {
	var t = q, n = J, r = Y, i = V, a = K, o = w, s = H, c = Z, l = e.f;
	q = null, J = 0, Y = null, V = l & 96 ? null : e, K = null, Gt(e.ctx), H = !1, Z = ++X, e.ac !== null && (_n(() => {
		e.ac.abort(y);
	}), e.ac = null);
	try {
		e.f |= Ee;
		var u = e.fn, d = u();
		e.f |= ve;
		var f = Bi(e);
		if (an() && Y !== null && !H && f !== null && !(e.f & 6146)) for (var p = 0; p < Y.length; p++) Ri(Y[p], e);
		if (i !== null && i !== e) {
			if (X++, i.deps !== null) for (let e = 0; e < n; e += 1) i.deps[e].rv = X;
			if (t !== null) for (let e of t) e.rv = X;
			Y !== null && (r === null ? r = Y : r.push(...Y));
		}
		return e.f & 8388608 && (e.f ^= Oe), d;
	} catch (t) {
		return Bi(e), Yr(t);
	} finally {
		e.f ^= Ee, q = t, J = n, Y = r, V = i, K = a, Gt(o), H = s, Z = c;
	}
}
function Bi(e) {
	var t = e.deps, n = O?.is_fork;
	if (q !== null) {
		var r;
		if (n || Hi(e, J), t !== null && J > 0) for (t.length = J + q.length, r = 0; r < q.length; r++) t[J + r] = q[r];
		else e.deps = t = q;
		if (Qr() && e.f & 512) for (r = J; r < t.length; r++) (t[r].reactions ??= []).push(e);
	} else !n && t !== null && J < t.length && (Hi(e, J), t.length = J);
	return t;
}
function Vi(e, n) {
	let r = n.reactions;
	if (r !== null) {
		var i = l.call(r, e);
		if (i !== -1) {
			var a = r.length - 1;
			a === 0 ? r = n.reactions = null : (r[i] = r[a], r.pop());
		}
	}
	if (r === null && n.f & 2 && (q === null || !u.call(q, n))) {
		var o = n;
		o.f & 512 && (o.f ^= 512), o.v !== t && un(o), o.ac !== null && _n(() => {
			o.ac.abort(y), o.ac = null, E(o, g);
		}), Bn(o), Hi(o, 0);
	}
}
function Hi(e, t) {
	var n = e.deps;
	if (n !== null) for (var r = t; r < n.length; r++) Vi(e, n[r]);
}
function Q(e) {
	var t = e.f;
	if (!(t & 16384)) {
		E(e, h);
		var n = W, r = Ai;
		W = e, Ai = !(t & 96);
		try {
			t & 16777232 ? vi(e) : _i(e), gi(e);
			var i = zi(e);
			e.teardown = typeof i == "function" ? i : null, e.wv = Pi;
		} finally {
			Ai = r, W = n;
		}
	}
}
async function Ui() {
	if (s) return new Promise((e) => {
		requestAnimationFrame(() => e()), setTimeout(() => e());
	});
	await Promise.resolve(), Qn();
}
function Wi() {
	return A.ensure().settled();
}
function $(e) {
	var t = !!(e.f & 2);
	if (Di?.add(e), V !== null && !H && !(W !== null && W.f & 16384) && (K === null || !K.has(e))) {
		var n = V.deps;
		if (V.f & 2097152) e.rv < X && (e.rv = X, q === null && n !== null && n[J] === e ? J++ : q === null ? q = [e] : q.push(e));
		else {
			V.deps ??= [], u.call(V.deps, e) || V.deps.push(e);
			var r = e.reactions;
			r === null ? e.reactions = [V] : u.call(r, V) || r.push(V);
		}
	}
	if (B && M.has(e)) return M.get(e);
	if (t) {
		var i = e;
		if (B) {
			var a = i.v;
			return (!(i.f & 1024) && i.reactions !== null || Ki(i)) && (a = Rn(i)), M.set(i, a), a;
		}
		var o = !(i.f & 512) && !H && V !== null && (Ai || !!(V.f & 512)), s = (i.f & ve) === 0;
		Li(i) && (o && (i.f |= 512), zn(i)), o && !s && (Vn(i), Gi(i));
	}
	if (k?.has(e)) return k.get(e);
	if (e.f & 8388608) throw e.v;
	return e.v;
}
function Gi(e) {
	if (e.f |= 512, e.deps !== null) for (let t of e.deps) (t.reactions ??= []).push(e), t.f & 2 && !(t.f & 512) && (Vn(t), Gi(t));
}
function Ki(e) {
	if (e.v === t) return !0;
	if (e.deps === null) return !1;
	for (let t of e.deps) if (M.has(t) || t.f & 2 && Ki(t)) return !0;
	return !1;
}
function qi(e) {
	return e && $(e);
}
function Ji(e) {
	var t = H;
	try {
		return H = !0, e();
	} finally {
		H = t;
	}
}
function Yi(e) {
	if (!(typeof e != "object" || !e || e instanceof EventTarget)) {
		if (v in e) Xi(e);
		else if (!Array.isArray(e)) for (let t in e) {
			let n = e[t];
			typeof n == "object" && n && v in n && Xi(n);
		}
	}
}
function Xi(e, t = /* @__PURE__ */ new Set()) {
	if (typeof e == "object" && e && !(e instanceof EventTarget) && !t.has(e)) {
		t.add(e), e instanceof Date && e.getTime();
		for (let n in e) try {
			Xi(e[n], t);
		} catch {}
		let n = m(e);
		if (n !== Object.prototype && n !== Array.prototype && n !== Map.prototype && n !== Set.prototype && n !== Date.prototype) {
			let t = te(n);
			for (let n in t) {
				let r = t[n].get;
				if (r) try {
					r.call(e);
				} catch {}
			}
		}
	}
}
//#endregion
export { Br as $, Ce as $n, $t, yi as A, Ze as An, pe as Ar, Dn as At, Ar as B, b as Bn, hn as Bt, ii as C, xt as Cn, c as Cr, Pn as Ct, mi as D, Tt as Dn, f as Dr, xn as Dt, ci as E, wt as En, se as Er, Fn as Et, ei as F, it as Fn, D as Ft, Gr as G, Be as Gn, sn as Gt, Hr as H, Ke as Hn, pn as Ht, ni as I, Je as In, On as It, Lr as J, Pe as Jn, Xt as Jt, Ir as K, Ge as Kn, qt as Kt, Xr as L, Ve as Ln, gn as Lt, Ci as M, $e as Mn, Cn as Mt, $r as N, nt as Nn, Tn as Nt, Ei as O, kt as On, le as Or, yn as Ot, di as P, rt as Pn, wn as Pt, Jr as Q, Te as Qn, Zt as Qt, L as R, x as Rn, vn as Rt, oi as S, bt as Sn, ae as Sr, Wn as St, si as T, Ct as Tn, ce as Tr, In as Tt, Kr as U, He as Un, dn as Ut, Rr as V, We as Vn, fn as Vt, Wr as W, S as Wn, E as Wt, Fr as X, ye as Xn, Kt as Xt, I as Y, _e as Yn, Jt as Yt, Mr as Z, g as Zn, en as Zt, hi as _, lt as _n, me as _r, O as _t, $ as a, Gt as an, ze as ar, Dr as at, z as b, vt as bn, te as br, dr as bt, G as c, zt as cn, _ as cr, yr as ct, Ui as d, It as dn, v as dr, P as dt, an as en, be as er, qr as et, Ji as f, Mt as fn, Fe as fr, hr as ft, pi as g, ct as gn, p as gr, A as gt, Ti as h, st as hn, de as hr, Sr as ht, Yi as i, Qt as in, ge as ir, Or as it, ui as j, Qe as jn, bn as jt, xi as k, Xe as kn, ue as kr, En as kt, U as l, Lt as ln, ve as lr, gr as lt, ki as m, ot as mn, d as mr, xr as mt, V as n, nn, Se as nr, Vr as nt, B as o, Yt as on, Ae as or, Tr as ot, Z as p, At as pn, Ie as pr, N as pt, zr as q, Ne as qn, w as qt, Xi as r, tn as rn, Re as rr, kr as rt, qi as s, Bt as sn, je as sr, Cr as st, W as t, rn as tn, Le as tr, Ur as tt, Wi as u, Rt as un, y as ur, _r as ut, ai as v, ut as vn, fe as vr, cr as vt, Qr as w, St as wn, oe as wr, Mn as wt, ri as x, yt as xn, m as xr, Kn as xt, fi as y, mt as yn, ee as yr, Qn as yt, jr as z, Ue as zn, _n as zt };
