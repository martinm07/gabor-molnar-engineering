import { Er as e, a as t, dt as n, hr as r, j as i, pt as a } from "./runtime-CwqRuC4c.js";
import { At as o, jt as s } from "./index-client-CHdY4_o-.js";
import { a as c } from "./shared-SkG8kz8H.js";
import { linear as l } from "./easing.js";
import { t as u } from "./index-client-CMjT073n.js";
//#region src/public/svelte-lib/src/motion/utils.js
function d(e) {
	return Object.prototype.toString.call(e) === "[object Date]";
}
//#endregion
//#region src/public/svelte-lib/src/motion/spring.js
function f(e, t, n, r) {
	if (typeof n == "number" || d(n)) {
		let i = r - n, a = (n - t) / (e.dt || 1 / 60), o = (a + (e.opts.stiffness * i - e.opts.damping * a) * e.inv_mass) * e.dt;
		return Math.abs(o) < e.opts.precision && Math.abs(i) < e.opts.precision ? r : (e.settled = !1, d(n) ? new Date(n.getTime() + o) : n + o);
	}
	if (Array.isArray(n)) return n.map((i, a) => f(e, t[a], n[a], r[a]));
	if (typeof n == "object") {
		let i = {};
		for (let a in n) i[a] = f(e, t[a], n[a], r[a]);
		return i;
	}
	throw Error(`Cannot spring ${typeof n} values`);
}
function p(e, t = {}) {
	let n = c(e), { stiffness: r = .15, damping: i = .8, precision: a = .01 } = t, l, u, d, p = e, m = e, h = 1, g = 0, _ = !1;
	function v(t, r = {}) {
		m = t;
		let i = d = {};
		return e == null || r.hard || y.stiffness >= 1 && y.damping >= 1 ? (_ = !0, l = s.now(), p = t, n.set(e = m), Promise.resolve()) : (r.soft && (g = 1 / ((r.soft === !0 ? .5 : +r.soft) * 60), h = 0), u ||= (l = s.now(), _ = !1, o((t) => {
			if (_) return _ = !1, u = null, !1;
			h = Math.min(h + g, 1);
			let r = Math.min(t - l, 1e3 / 30), i = {
				inv_mass: h,
				opts: y,
				settled: !0,
				dt: r * 60 / 1e3
			}, a = f(i, p, e, m);
			return l = t, p = e, n.set(e = a), i.settled && (u = null), !i.settled;
		})), new Promise((e) => {
			u.promise.then(() => {
				i === d && e();
			});
		}));
	}
	let y = {
		set: v,
		update: (t, n) => v(t(m, e), n),
		subscribe: n.subscribe,
		stiffness: r,
		damping: i,
		precision: a
	};
	return y;
}
var m = class c {
	#e = /* @__PURE__ */ a(.15);
	#t = /* @__PURE__ */ a(.8);
	#n = /* @__PURE__ */ a(.01);
	#r;
	#i;
	#a = void 0;
	#o = 0;
	#s = 1;
	#c = 0;
	#l = null;
	#u = null;
	constructor(e, t = {}) {
		this.#r = /* @__PURE__ */ a(e), this.#i = /* @__PURE__ */ a(e), typeof t.stiffness == "number" && (this.#e.v = h(t.stiffness, 0, 1)), typeof t.damping == "number" && (this.#t.v = h(t.damping, 0, 1)), typeof t.precision == "number" && (this.#n.v = t.precision);
	}
	static of(e, t) {
		let n = new c(e(), t);
		return i(() => {
			n.set(e());
		}), n;
	}
	#d(e) {
		if (n(this.#i, e), this.#r.v ??= e, this.#a ??= this.#r.v, !this.#l) {
			this.#o = s.now();
			var t = 1e3 / (this.#c * 60);
			this.#l ??= o((e) => {
				this.#s = Math.min(this.#s + t, 1);
				let r = Math.min(e - this.#o, 1e3 / 30), i = {
					inv_mass: this.#s,
					opts: {
						stiffness: this.#e.v,
						damping: this.#t.v,
						precision: this.#n.v
					},
					settled: !0,
					dt: r * 60 / 1e3
				};
				var a = f(i, this.#a, this.#r.v, this.#i.v);
				return this.#a = this.#r.v, this.#o = e, n(this.#r, a), i.settled && (this.#l = null), !i.settled;
			});
		}
		return this.#l.promise;
	}
	set(t, i) {
		if (this.#u?.reject(/* @__PURE__ */ Error("Aborted")), i?.instant || this.#r.v === void 0) return this.#l?.abort(), this.#l = null, n(this.#r, n(this.#i, t)), this.#a = t, Promise.resolve();
		i?.preserveMomentum && (this.#s = 0, this.#c = i.preserveMomentum);
		var a = this.#u = r();
		return a.promise.catch(e), this.#d(t).then(() => {
			a === this.#u && a.resolve(void 0);
		}), a.promise;
	}
	get current() {
		return t(this.#r);
	}
	get damping() {
		return t(this.#t);
	}
	set damping(e) {
		n(this.#t, h(e, 0, 1));
	}
	get precision() {
		return t(this.#n);
	}
	set precision(e) {
		n(this.#n, e);
	}
	get stiffness() {
		return t(this.#e);
	}
	set stiffness(e) {
		n(this.#e, h(e, 0, 1));
	}
	get target() {
		return t(this.#i);
	}
	set target(e) {
		this.set(e);
	}
};
function h(e, t, n) {
	return Math.max(t, Math.min(n, e));
}
//#endregion
//#region src/public/svelte-lib/src/motion/tweened.js
function g(e, t) {
	if (e === t || e !== e) return () => e;
	let n = typeof e;
	if (n !== typeof t || Array.isArray(e) !== Array.isArray(t)) throw Error("Cannot interpolate values of different type");
	if (Array.isArray(e)) {
		let n = t.map((t, n) => g(e[n], t));
		return (e) => n.map((t) => t(e));
	}
	if (n === "object") {
		if (!e || !t) throw Error("Object cannot be null");
		if (d(e) && d(t)) {
			let n = e.getTime(), r = t.getTime() - n;
			return (e) => new Date(n + e * r);
		}
		let n = Object.keys(t), r = {};
		return n.forEach((n) => {
			r[n] = g(e[n], t[n]);
		}), (e) => {
			let t = {};
			return n.forEach((n) => {
				t[n] = r[n](e);
			}), t;
		};
	}
	if (n === "number") {
		let n = t - e;
		return (t) => e + t * n;
	}
	return () => t;
}
function _(e, t = {}) {
	let n = c(e), r, i = e;
	function a(a, c) {
		if (i = a, e == null) return n.set(e = a), Promise.resolve();
		let u = r, d = !1, { delay: f = 0, duration: p = 400, easing: m = l, interpolate: h = g } = {
			...t,
			...c
		};
		if (p === 0) return u &&= (u.abort(), null), n.set(e = i), Promise.resolve();
		let _ = s.now() + f, v;
		return r = o((t) => {
			if (t < _) return !0;
			d ||= (v = h(e, a), typeof p == "function" && (p = p(e, a)), !0), u &&= (u.abort(), null);
			let r = t - _;
			return r > p ? (n.set(e = a), !1) : (n.set(e = v(m(r / p))), !0);
		}), r.promise;
	}
	return {
		set: a,
		update: (t, n) => a(t(i, e), n),
		subscribe: n.subscribe
	};
}
var v = class e {
	#e;
	#t;
	#n;
	#r = null;
	constructor(e, t = {}) {
		this.#e = /* @__PURE__ */ a(e), this.#t = /* @__PURE__ */ a(e), this.#n = t;
	}
	static of(t, n) {
		let r = new e(t(), n);
		return i(() => {
			r.set(t());
		}), r;
	}
	set(e, t) {
		n(this.#t, e);
		let { delay: r = 0, duration: i = 400, easing: a = l, interpolate: c = g } = {
			...this.#n,
			...t
		};
		if (i === 0) return this.#r?.abort(), n(this.#e, e), Promise.resolve();
		let u = s.now() + r, d, f = !1, p = this.#r;
		return this.#r = o((t) => {
			if (t < u) return !0;
			if (!f) {
				f = !0;
				let t = this.#e.v;
				d = c(t, e), typeof i == "function" && (i = i(t, e)), p?.abort(), p = null;
			}
			let r = t - u;
			return r > i ? (n(this.#e, e), !1) : (n(this.#e, d(a(r / i))), !0);
		}), this.#r.promise;
	}
	get current() {
		return t(this.#e);
	}
	get target() {
		return t(this.#t);
	}
	set target(e) {
		this.set(e);
	}
}, y = /*@__PURE__*/ new u("(prefers-reduced-motion: reduce)");
//#endregion
export { m as Spring, v as Tween, y as prefersReducedMotion, p as spring, _ as tweened };
