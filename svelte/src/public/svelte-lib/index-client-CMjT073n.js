import { Et as e, a as t, dt as n, ft as r, l as i, n as a, p as o, pt as s, st as c } from "./runtime-CwqRuC4c.js";
import "./index-client-CHdY4_o-.js";
import { c as l } from "./events-EEnPiKdo.js";
import "./create-subscriber-CwUi43MK.js";
import "./events.js";
import { t as u } from "./reactive-value-BMu75dUw.js";
//#region src/public/svelte-lib/src/reactivity/date.js
var d = !1, f = class r extends Date {
	#e = /* @__PURE__ */ s(super.getTime());
	#t = /* @__PURE__ */ new Map();
	#n = a;
	constructor(...e) {
		super(...e), d || this.#r();
	}
	#r() {
		d = !0;
		var o = r.prototype, s = Date.prototype, c = Object.getOwnPropertyNames(s);
		for (let r of c) (r.startsWith("get") || r.startsWith("to") || r === "valueOf") && (o[r] = function(...n) {
			if (n.length > 0) return t(this.#e), s[r].apply(this, n);
			var o = this.#t.get(r);
			if (o === void 0) {
				let c = a;
				i(this.#n), o = /* @__PURE__ */ e(() => (t(this.#e), s[r].apply(this, n))), this.#t.set(r, o), i(c);
			}
			return t(o);
		}), r.startsWith("set") && (o[r] = function(...e) {
			var t = s[r].apply(this, e);
			return n(this.#e, s.getTime.call(this)), t;
		});
	}
}, p = [
	"forEach",
	"isDisjointFrom",
	"isSubsetOf",
	"isSupersetOf"
], m = [
	"difference",
	"intersection",
	"symmetricDifference",
	"union"
], h = !1, g = class e extends Set {
	#e = /* @__PURE__ */ new Map();
	#t = /* @__PURE__ */ s(0);
	#n = /* @__PURE__ */ s(0);
	#r = o || -1;
	constructor(e) {
		if (super(), e) {
			for (var t of e) super.add(t);
			this.#n.v = super.size;
		}
		h || this.#a();
	}
	#i(e) {
		return o === this.#r ? /* @__PURE__ */ s(e) : r(e);
	}
	#a() {
		h = !0;
		var n = e.prototype, r = Set.prototype;
		for (let e of p) n[e] = function(...n) {
			return t(this.#t), r[e].apply(this, n);
		};
		for (let i of m) n[i] = function(...n) {
			t(this.#t);
			var a = r[i].apply(this, n);
			return new e(a);
		};
	}
	has(e) {
		var n = super.has(e), r = this.#e, i = r.get(e);
		if (i === void 0) {
			if (!n) return t(this.#t), !1;
			i = this.#i(!0), r.set(e, i);
		}
		return t(i), n;
	}
	add(e) {
		return super.has(e) || (super.add(e), n(this.#n, super.size), c(this.#t)), this;
	}
	delete(e) {
		var t = super.delete(e), r = this.#e, i = r.get(e);
		return i !== void 0 && (r.delete(e), n(i, !1)), t && (n(this.#n, super.size), c(this.#t)), t;
	}
	clear() {
		if (super.size !== 0) {
			super.clear();
			var e = this.#e;
			for (var t of e.values()) n(t, !1);
			e.clear(), n(this.#n, 0), c(this.#t);
		}
	}
	keys() {
		return this.values();
	}
	values() {
		return t(this.#t), super.values();
	}
	entries() {
		return t(this.#t), super.entries();
	}
	[Symbol.iterator]() {
		return this.keys();
	}
	get size() {
		return t(this.#n);
	}
}, _ = class extends Map {
	#e = /* @__PURE__ */ new Map();
	#t = /* @__PURE__ */ s(0);
	#n = /* @__PURE__ */ s(0);
	#r = o || -1;
	constructor(e) {
		if (super(), e) {
			for (var [t, n] of e) super.set(t, n);
			this.#n.v = super.size;
		}
	}
	#i(e) {
		return o === this.#r ? /* @__PURE__ */ s(e) : r(e);
	}
	has(e) {
		var n = this.#e, r = n.get(e);
		if (r === void 0) {
			if (super.has(e)) r = this.#i(0), n.set(e, r);
			else return t(this.#t), !1;
		}
		return t(r), !0;
	}
	forEach(e, t) {
		this.#a(), super.forEach(e, t);
	}
	get(e) {
		var n = this.#e, r = n.get(e);
		if (r === void 0) {
			if (super.has(e)) r = this.#i(0), n.set(e, r);
			else {
				t(this.#t);
				return;
			}
		}
		return t(r), super.get(e);
	}
	getOrInsert(e, t) {
		return super.has(e) || this.set(e, t), this.get(e);
	}
	getOrInsertComputed(e, t) {
		return super.has(e) || this.set(e, t(e)), this.get(e);
	}
	set(e, t) {
		var r = this.#e, i = r.get(e), a = super.get(e), o = super.set(e, t), s = this.#t;
		if (i === void 0) i = this.#i(0), r.set(e, i), n(this.#n, super.size), c(s);
		else if (a !== t) {
			c(i);
			var l = s.reactions === null ? null : new Set(s.reactions);
			(l === null || !i.reactions?.every((e) => l.has(e))) && c(s);
		}
		return o;
	}
	delete(e) {
		var t = this.#e, r = t.get(e), i = super.delete(e);
		return r !== void 0 && (t.delete(e), n(r, -1)), i && (n(this.#n, super.size), c(this.#t)), i;
	}
	clear() {
		if (super.size !== 0) {
			super.clear();
			var e = this.#e;
			n(this.#n, 0);
			for (var t of e.values()) n(t, -1);
			c(this.#t), e.clear();
		}
	}
	#a() {
		t(this.#t);
		var e = this.#e;
		if (this.#n.v !== e.size) {
			for (var n of super.keys()) if (!e.has(n)) {
				var r = this.#i(0);
				e.set(n, r);
			}
		}
		for ([, r] of this.#e) t(r);
	}
	keys() {
		return t(this.#t), super.keys();
	}
	values() {
		return this.#a(), super.values();
	}
	entries() {
		return this.#a(), super.entries();
	}
	[Symbol.iterator]() {
		return this.entries();
	}
	get size() {
		return t(this.#n), super.size;
	}
}, v = Symbol("replace"), y = class extends URLSearchParams {
	#e = /* @__PURE__ */ s(0);
	#t = x();
	#n = !1;
	#r() {
		if (!this.#t || this.#n) return;
		this.#n = !0;
		let e = this.toString();
		this.#t.search = e && `?${e}`, this.#n = !1;
	}
	[v](e) {
		if (!this.#n && e.toString() !== super.toString()) {
			this.#n = !0;
			for (let e of [...super.keys()]) super.delete(e);
			for (let [t, n] of e) super.append(t, n);
			c(this.#e), this.#n = !1;
		}
	}
	append(e, t) {
		super.append(e, t), this.#r(), c(this.#e);
	}
	delete(e, t) {
		var n = super.has(e, t);
		super.delete(e, t), n && (this.#r(), c(this.#e));
	}
	get(e) {
		return t(this.#e), super.get(e);
	}
	getAll(e) {
		return t(this.#e), super.getAll(e);
	}
	has(e, n) {
		return t(this.#e), super.has(e, n);
	}
	keys() {
		return t(this.#e), super.keys();
	}
	forEach(e, n) {
		t(this.#e), super.forEach(e, n);
	}
	set(e, t) {
		var n = super.getAll(e);
		super.set(e, t);
		var r = super.getAll(e);
		(n.length !== r.length || n.some((e, t) => e !== r[t])) && (this.#r(), c(this.#e));
	}
	sort() {
		super.sort(), this.#r(), c(this.#e);
	}
	toString() {
		return t(this.#e), super.toString();
	}
	values() {
		return t(this.#e), super.values();
	}
	entries() {
		return t(this.#e), super.entries();
	}
	[Symbol.iterator]() {
		return this.entries();
	}
	get size() {
		return t(this.#e), super.size;
	}
}, b = null;
function x() {
	return b;
}
var S = class extends URL {
	#e = /* @__PURE__ */ s(super.protocol);
	#t = /* @__PURE__ */ s(super.username);
	#n = /* @__PURE__ */ s(super.password);
	#r = /* @__PURE__ */ s(super.hostname);
	#i = /* @__PURE__ */ s(super.port);
	#a = /* @__PURE__ */ s(super.pathname);
	#o = /* @__PURE__ */ s(super.hash);
	#s = /* @__PURE__ */ s(super.search);
	#c;
	constructor(e, t) {
		e = new URL(e, t), super(e), b = this, this.#c = new y(e.searchParams), b = null;
	}
	get hash() {
		return t(this.#o);
	}
	set hash(e) {
		super.hash = e, n(this.#o, super.hash);
	}
	get host() {
		return t(this.#r), t(this.#i), super.host;
	}
	set host(e) {
		super.host = e, n(this.#r, super.hostname), n(this.#i, super.port);
	}
	get hostname() {
		return t(this.#r);
	}
	set hostname(e) {
		super.hostname = e, n(this.#r, super.hostname);
	}
	get href() {
		return t(this.#e), t(this.#t), t(this.#n), t(this.#r), t(this.#i), t(this.#a), t(this.#o), t(this.#s), super.href;
	}
	set href(e) {
		super.href = e, n(this.#e, super.protocol), n(this.#t, super.username), n(this.#n, super.password), n(this.#r, super.hostname), n(this.#i, super.port), n(this.#a, super.pathname), n(this.#o, super.hash), n(this.#s, super.search), this.#c[v](super.searchParams);
	}
	get password() {
		return t(this.#n);
	}
	set password(e) {
		super.password = e, n(this.#n, super.password);
	}
	get pathname() {
		return t(this.#a);
	}
	set pathname(e) {
		super.pathname = e, n(this.#a, super.pathname);
	}
	get port() {
		return t(this.#i);
	}
	set port(e) {
		super.port = e, n(this.#i, super.port);
	}
	get protocol() {
		return t(this.#e);
	}
	set protocol(e) {
		super.protocol = e, n(this.#e, super.protocol), n(this.#i, super.port);
	}
	get search() {
		return t(this.#s);
	}
	set search(e) {
		super.search = e, n(this.#s, super.search), this.#c[v](super.searchParams);
	}
	get username() {
		return t(this.#t);
	}
	set username(e) {
		super.username = e, n(this.#t, super.username);
	}
	get origin() {
		return t(this.#e), t(this.#r), t(this.#i), super.origin;
	}
	get searchParams() {
		return this.#c;
	}
	toString() {
		return this.href;
	}
	toJSON() {
		return this.href;
	}
}, C = /\(.+\)/, w = /* @__PURE__ */ new Set([
	"all",
	"print",
	"screen",
	"and",
	"or",
	"not",
	"only"
]), T = class extends u {
	constructor(e, t) {
		let n = C.test(e) || e.split(/[\s,]+/).some((e) => w.has(e.trim())) ? e : `(${e})`, r = window.matchMedia(n);
		super(() => r.matches, (e) => l(r, "change", e));
	}
};
//#endregion
export { g as a, _ as i, S as n, f as o, y as r, T as t };
