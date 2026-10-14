import { i as e, n as t, o as n, r, s as i, t as a, u as o } from "./hydration-2bInKSYn.js";
import { Cr as s, Er as c, Sr as l, Tr as u, hr as d, jn as f, ur as p } from "./runtime-CwqRuC4c.js";
import { l as m, n as ee } from "./constants-BmdHRGzy.js";
import { t as te } from "./flags-COsiZ1kr.js";
import { _ as ne, a as re, f as ie, t as ae } from "./utils-CZTeeqkQ.js";
import { i as h, n as oe, r as g, t as se } from "./attributes-B8hyih9T.js";
import { t as _ } from "./escaping-FZnsaNz1.js";
import { t as v } from "./utils-BaJXbWQO.js";
//#region src/public/svelte-lib/src/internal/server/errors.js
function y() {
	let e = /* @__PURE__ */ Error("async_local_storage_unavailable\nThe node API `AsyncLocalStorage` is not available, but is required to use async server rendering.\nhttps://svelte.dev/e/async_local_storage_unavailable");
	throw e.name = "Svelte error", e;
}
function b() {
	let e = /* @__PURE__ */ Error("await_invalid\nEncountered asynchronous work while rendering synchronously.\nhttps://svelte.dev/e/await_invalid");
	throw e.name = "Svelte error", e;
}
function ce(e) {
	let t = /* @__PURE__ */ Error(`dynamic_element_invalid_tag\n\`<svelte:element this="${e}">\` is not a valid element name — the element will not be rendered\nhttps://svelte.dev/e/dynamic_element_invalid_tag`);
	throw t.name = "Svelte error", t;
}
function le() {
	let e = /* @__PURE__ */ Error("html_deprecated\nThe `html` property of server render results has been deprecated. Use `body` instead.\nhttps://svelte.dev/e/html_deprecated");
	throw e.name = "Svelte error", e;
}
function ue() {
	let e = /* @__PURE__ */ Error("invalid_csp\n`csp.nonce` was set while `csp.hash` was `true`. These options cannot be used simultaneously.\nhttps://svelte.dev/e/invalid_csp");
	throw e.name = "Svelte error", e;
}
function de() {
	let e = /* @__PURE__ */ Error("invalid_id_prefix\nThe `idPrefix` option cannot include `--`.\nhttps://svelte.dev/e/invalid_id_prefix");
	throw e.name = "Svelte error", e;
}
function fe() {
	let e = /* @__PURE__ */ Error("server_context_required\nCould not resolve `render` context.\nhttps://svelte.dev/e/server_context_required");
	throw e.name = "Svelte error", e;
}
//#endregion
//#region src/public/svelte-lib/src/internal/server/context.js
var x = null;
function S(e) {
	x = e;
}
function pe(e) {
	x = {
		p: x,
		c: null,
		r: null,
		i: !1
	};
}
function me() {
	x = x.p;
}
async function he(e) {
	var t = x, n = await e;
	return () => (x = t, n);
}
function ge(e, t) {
	console.warn("https://svelte.dev/e/unresolved_hydratable");
}
//#endregion
//#region src/public/svelte-lib/src/internal/server/render-context.js
var C = null, w = null;
function _e() {
	let e = w ?? T?.getStore();
	return e || fe(), e;
}
async function ve(e) {
	if (w = { hydratable: {
		lookup: /* @__PURE__ */ new Map(),
		comparisons: [],
		unresolved_promises: /* @__PURE__ */ new Map()
	} }, be()) {
		let { promise: t, resolve: n } = d(), r = C;
		return C = t, await r, e().finally(n);
	}
	try {
		return T === null && y(), T.run(w, e);
	} finally {
		w = null;
	}
}
var T = null, E = null;
function ye() {
	return E ??= import("./__vite-browser-external-D5MEF8NO.js").then((e) => /* @__PURE__ */ o(e.default, 1)).then((e) => {
		T = new e.AsyncLocalStorage();
	}).then(c, c), E;
}
function be() {
	return !!globalThis.process?.versions?.webcontainer;
}
//#endregion
//#region src/public/svelte-lib/src/internal/server/crypto.js
var D, O, k = (e) => import(
	/* @vite-ignore */
	e
);
async function A(e) {
	return D ??= new TextEncoder(), O ??= globalThis.crypto?.subtle?.digest ? globalThis.crypto : (await k("node:crypto")).webcrypto, j(await O.subtle.digest("SHA-256", D.encode(e)));
}
function j(e) {
	let t = "";
	for (let n = 0; n < e.length; n++) t += String.fromCharCode(e[n]);
	return btoa(t);
}
var M = 2 ** 32 - 1 - 1, N = {
	"<": "\\u003C",
	"\\": "\\\\",
	"\b": "\\b",
	"\f": "\\f",
	"\n": "\\n",
	"\r": "\\r",
	"	": "\\t",
	"\u2028": "\\u2028",
	"\u2029": "\\u2029"
}, P = class extends Error {
	constructor(e, t, n, r) {
		super(e), this.name = "DevalueError", this.path = t.join(""), this.value = n, this.root = r;
	}
};
function F(e) {
	return e === null || typeof e != "object" && typeof e != "function";
}
var xe = /* @__PURE__ */ Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function Se(e) {
	let t = Object.getPrototypeOf(e);
	return t === Object.prototype || t === null || Object.getPrototypeOf(t) === null || Object.getOwnPropertyNames(t).sort().join("\0") === xe;
}
function I(e) {
	return Object.prototype.toString.call(e).slice(8, -1);
}
function L(e) {
	return typeof Buffer < "u" && Buffer.isBuffer(e);
}
function Ce(e) {
	switch (e) {
		case "\"": return "\\\"";
		case "<": return "\\u003C";
		case "\\": return "\\\\";
		case "\n": return "\\n";
		case "\r": return "\\r";
		case "	": return "\\t";
		case "\b": return "\\b";
		case "\f": return "\\f";
		case "\u2028": return "\\u2028";
		case "\u2029": return "\\u2029";
		default: return e < " " ? `\\u${e.charCodeAt(0).toString(16).padStart(4, "0")}` : "";
	}
}
function R(e) {
	let t = "", n = 0, r = e.length;
	for (let i = 0; i < r; i += 1) {
		let r = e[i], a = Ce(r);
		a && (t += e.slice(n, i) + a, n = i + 1);
	}
	return `"${n === 0 ? e : t + e.slice(n)}"`;
}
function we(e) {
	return Object.getOwnPropertySymbols(e).filter((t) => Object.getOwnPropertyDescriptor(e, t).enumerable);
}
var Te = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
function Ee(e) {
	return Te.test(e) ? "." + e : "[" + JSON.stringify(e) + "]";
}
function De(e) {
	return !(!Number.isInteger(e) || e < 0 || e > M);
}
function Oe(e) {
	if (e.length === 0 || e.length > 1 && e.charCodeAt(0) === 48) return !1;
	for (let t = 0; t < e.length; t++) {
		let n = e.charCodeAt(t);
		if (n < 48 || n > 57) return !1;
	}
	return De(+e);
}
function ke(e) {
	for (var t = e.length - 1; t >= 0 && !Oe(e[t]); t--);
	return t + 1;
}
function z(e) {
	let t = Object.keys(e);
	return t.length = ke(t), t;
}
//#endregion
//#region node_modules/devalue/src/uneval.js
var Ae = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$", B = 128, je = /[<\b\f\n\r\t\0\u2028\u2029]/g, Me = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
function V(e, t) {
	let n = /* @__PURE__ */ new Map(), r = [], i = /* @__PURE__ */ new Map(), a;
	function o(e) {
		if (typeof e == "string" && e.length >= B || typeof e == "bigint") {
			a ??= /* @__PURE__ */ new Map();
			let t = a.get(e);
			return t === void 0 && (t = G(e), a.set(e, t)), t;
		}
		return G(e);
	}
	function s(a) {
		if (!F(a)) {
			if (n.has(a)) {
				n.set(a, n.get(a) + 1);
				return;
			}
			if (n.set(a, 1), t) {
				let e = t(a, (e) => V(e, t));
				if (typeof e == "string") {
					i.set(a, e);
					return;
				}
			}
			if (typeof a == "function") throw new P("Cannot stringify a function", r, a, e);
			switch (I(a)) {
				case "BigInt":
				case "String":
					s(a.valueOf());
					return;
				case "Number":
				case "Boolean":
				case "Date":
				case "RegExp":
				case "URL":
				case "URLSearchParams": return;
				case "Array":
					for (let e of z(a)) r.push(`[${e}]`), s(a[e]), r.pop();
					break;
				case "Set":
					Array.from(a).forEach(s);
					break;
				case "Map":
					for (let [e, t] of a) r.push(`.get(${F(e) ? o(e) : "..."})`), s(e), s(t), r.pop();
					break;
				case "Int8Array":
				case "Uint8Array":
				case "Uint8ClampedArray":
				case "Int16Array":
				case "Uint16Array":
				case "Float16Array":
				case "Int32Array":
				case "Uint32Array":
				case "Float32Array":
				case "Float64Array":
				case "BigInt64Array":
				case "BigUint64Array":
				case "DataView":
					L(a) || s(a.buffer);
					return;
				case "ArrayBuffer": return;
				case "Temporal.Duration":
				case "Temporal.Instant":
				case "Temporal.PlainDate":
				case "Temporal.PlainTime":
				case "Temporal.PlainDateTime":
				case "Temporal.PlainMonthDay":
				case "Temporal.PlainYearMonth":
				case "Temporal.ZonedDateTime": return;
				default:
					if (!Se(a)) throw new P("Cannot stringify arbitrary non-POJOs", r, a, e);
					if (we(a).length > 0) throw new P("Cannot stringify POJOs with symbolic keys", r, a, e);
					for (let t of Object.keys(a)) {
						if (t === "__proto__") throw new P("Cannot stringify objects with __proto__ keys", r, a, e);
						r.push(Ee(t)), s(a[t]), r.pop();
					}
			}
		} else if (typeof a == "symbol") throw new P("Cannot stringify a Symbol primitive", r, a, e);
		else (typeof a == "string" && a.length >= B || typeof a == "bigint") && n.set(a, (n.get(a) || 0) + 1);
	}
	s(e);
	let c = /* @__PURE__ */ new Map(), l = [];
	n.forEach((e, t) => {
		e > 1 && l.push([t, e]);
	}), l.sort((e, t) => t[1] - e[1]).forEach(([e, t]) => {
		let n = Ne(c.size);
		if (F(e)) {
			let r = o(e).length;
			if (r * t <= r + (t + 1) * n.length + 25) return;
		}
		c.set(e, n);
	});
	function u(e) {
		if (c.has(e)) return c.get(e);
		if (F(e)) return G(e);
		if (i.has(e)) return i.get(e);
		let t = I(e);
		switch (t) {
			case "Number":
			case "String":
			case "Boolean":
			case "BigInt": return `Object(${u(e.valueOf())})`;
			case "RegExp":
				let { source: n, flags: r } = e;
				return r ? `new RegExp(${R(n)},"${r}")` : `new RegExp(${R(n)})`;
			case "Date": return `new Date(${e.getTime()})`;
			case "URL": return `new URL(${R(e.toString())})`;
			case "URLSearchParams": return `new URLSearchParams(${R(e.toString())})`;
			case "Array": {
				let t = !1, n = "[";
				for (let r = 0; r < e.length; r += 1) if (r > 0 && (n += ","), Object.hasOwn(e, r)) n += u(e[r]);
				else if (!t) {
					let n = z(e), r = n.length, i = String(e.length).length, a = H(e.length);
					if (e.length + 2 > a.length + 18 + r * (i + 2)) return `Object.assign(${a},{${n.map((t) => `${t}:${u(e[t])}`).join(",")}})`;
					t = !0;
				}
				let r = e.length === 0 || Object.hasOwn(e, e.length - 1) ? "" : ",";
				return n + r + "]";
			}
			case "Set":
			case "Map": return `new ${t}([${Array.from(e).map(u).join(",")}])`;
			case "Int8Array":
			case "Uint8Array":
			case "Uint8ClampedArray":
			case "Int16Array":
			case "Uint16Array":
			case "Float16Array":
			case "Int32Array":
			case "Uint32Array":
			case "Float32Array":
			case "Float64Array":
			case "BigInt64Array":
			case "BigUint64Array": {
				L(e) && (e = new Uint8Array(e));
				let n = `new ${t}`;
				if (c.has(e.buffer) ? n += `(${u(e.buffer)})` : n += `([${U(t, e.buffer)}])`, e.byteLength !== e.buffer.byteLength) {
					let t = e.byteOffset / e.BYTES_PER_ELEMENT, r = t + e.length;
					n += `.subarray(${t},${r})`;
				}
				return n;
			}
			case "DataView": {
				let t = "new DataView";
				return c.has(e.buffer) ? t += `(${u(e.buffer)}` : t += `(new Uint8Array([${new Uint8Array(e.buffer)}]).buffer`, e.byteLength !== e.buffer.byteLength && (t += `,${e.byteOffset},${e.byteLength}`), t + ")";
			}
			case "ArrayBuffer": return `new Uint8Array([${new Uint8Array(e).toString()}]).buffer`;
			case "Temporal.Duration":
			case "Temporal.Instant":
			case "Temporal.PlainDate":
			case "Temporal.PlainTime":
			case "Temporal.PlainDateTime":
			case "Temporal.PlainMonthDay":
			case "Temporal.PlainYearMonth":
			case "Temporal.ZonedDateTime": return `${t}.from(${R(e.toString())})`;
			default:
				let i = Object.keys(e), a = i.map((t) => `${Fe(t)}:${u(e[t])}`).join(",");
				return Object.getPrototypeOf(e) === null ? i.length > 0 ? `{${a},__proto__:null}` : "{__proto__:null}" : `{${a}}`;
		}
	}
	let d = u(e);
	if (c.size) {
		let e = [], t = [], n = [], r = [];
		c.forEach((a, s) => {
			if (e.push(a), i.has(s)) {
				n.push(i.get(s));
				return;
			}
			if (F(s)) {
				n.push(o(s));
				return;
			}
			let l = I(s);
			switch (l) {
				case "Number":
				case "String":
				case "Boolean":
				case "BigInt": {
					let e = s.valueOf();
					c.has(e) ? (n.push("{}"), r.push(`${a}=Object(${u(e)})`)) : n.push(`Object(${u(e)})`);
					break;
				}
				case "RegExp":
					let { source: e, flags: i } = s, o = i ? `new RegExp(${R(e)},"${i}")` : `new RegExp(${R(e)})`;
					n.push(o);
					break;
				case "Date":
					n.push(`new Date(${s.getTime()})`);
					break;
				case "URL":
					n.push(`new URL(${R(s.toString())})`);
					break;
				case "URLSearchParams":
					n.push(`new URLSearchParams(${R(s.toString())})`);
					break;
				case "Array": {
					let e = z(s);
					n.push(s.length > 32 + 2 * e.length ? H(s.length) : `Array(${s.length})`);
					for (let n of e) t.push(`${a}[${n}]=${u(s[n])}`);
					break;
				}
				case "Set": {
					n.push("new Set");
					let e = Array.from(s).map((e) => `.add(${u(e)})`);
					e.length > 0 && t.push(a + e.join(""));
					break;
				}
				case "Map": {
					n.push("new Map");
					let e = Array.from(s).map(([e, t]) => `.set(${u(e)}, ${u(t)})`);
					e.length > 0 && t.push(a + e.join(""));
					break;
				}
				case "Int8Array":
				case "Uint8Array":
				case "Uint8ClampedArray":
				case "Int16Array":
				case "Uint16Array":
				case "Float16Array":
				case "Int32Array":
				case "Uint32Array":
				case "Float32Array":
				case "Float64Array":
				case "BigInt64Array":
				case "BigUint64Array": {
					L(s) && (s = new Uint8Array(s));
					let e = `new ${l}`;
					if (c.has(s.buffer) ? e += `(${u(s.buffer)})` : e += `([${U(l, s.buffer)}])`, s.byteLength !== s.buffer.byteLength) {
						let t = s.byteOffset / s.BYTES_PER_ELEMENT, n = t + s.length;
						e += `.subarray(${t},${n})`;
					}
					n.push("{}"), r.push(`${a}=${e}`);
					break;
				}
				case "DataView": {
					let e = "new DataView";
					c.has(s.buffer) ? e += `(${u(s.buffer)}` : e += `(new Uint8Array([${new Uint8Array(s.buffer)}]).buffer`, s.byteLength !== s.buffer.byteLength && (e += `,${s.byteOffset},${s.byteLength}`), e += ")", n.push("{}"), r.push(`${a}=${e}`);
					break;
				}
				case "ArrayBuffer":
					n.push(`new Uint8Array([${new Uint8Array(s)}]).buffer`);
					break;
				case "Temporal.Duration":
				case "Temporal.Instant":
				case "Temporal.PlainDate":
				case "Temporal.PlainTime":
				case "Temporal.PlainDateTime":
				case "Temporal.PlainMonthDay":
				case "Temporal.PlainYearMonth":
				case "Temporal.ZonedDateTime":
					n.push(`${l}.from(${R(s.toString())})`);
					break;
				default: n.push(Object.getPrototypeOf(s) === null ? "Object.create(null)" : "{}"), Object.keys(s).forEach((e) => {
					t.push(`${a}${Ie(e)}=${u(s[e])}`);
				});
			}
		}), t.push(`return ${d}`);
		let a = [...r, ...t].join(";");
		return e.length > 65534 ? `(function(){var[${e.join(",")}]=arguments[0];${a}}([${n.join(",")}]))` : `(function(${e.join(",")}){${a}}(${n.join(",")}))`;
	}
	return d;
}
function H(e) {
	return `(function(a){a[${M}]=0;delete a[${M}];a.length=${e};return a}([]))`;
}
function U(e, t) {
	let n = new globalThis[e](t);
	return e === "BigInt64Array" || e === "BigUint64Array" ? Array.from(n, (e) => `${e}n`).join(",") : n instanceof Float32Array || n instanceof Float64Array || typeof Float16Array < "u" && n instanceof Float16Array ? Array.from(n, (e) => Object.is(e, -0) ? "-0" : `${e}`).join(",") : n.toString();
}
function Ne(e) {
	let t = "";
	do
		t = Ae[e % 54] + t, e = ~~(e / 54) - 1;
	while (e >= 0);
	return Me.test(t) ? `${t}0` : t;
}
function Pe(e) {
	return N[e] || e;
}
function W(e) {
	return e.replace(je, Pe);
}
function Fe(e) {
	return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(e) ? e : W(JSON.stringify(e));
}
function Ie(e) {
	return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(e) ? `.${e}` : `[${W(JSON.stringify(e))}]`;
}
function G(e) {
	let t = typeof e;
	if (t === "string") return R(e);
	if (e === void 0) return "void 0";
	if (e === 0 && 1 / e < 0) return "-0";
	let n = String(e);
	return t === "number" ? n.replace(/^(-)?0\./, "$1.") : t === "bigint" ? e + "n" : n;
}
//#endregion
//#region src/public/svelte-lib/src/internal/server/renderer.js
var Le = class {
	#e;
	#t;
	#n;
	#r = { script: "" };
	#i;
	constructor(e, t) {
		this.#e = e, this.#t = t;
	}
	#a() {
		return this.#n ??= this.#e();
	}
	get html() {
		return this.#a().body;
	}
	get head() {
		return this.#a().head;
	}
	get body() {
		return this.#a().body;
	}
	get hashes() {
		return this.#r;
	}
	then(e, t) {
		if (!te) {
			let t = this.#a(), n = e({
				head: t.head,
				body: t.body,
				html: t.body,
				hashes: { script: [] }
			});
			return Promise.resolve(n);
		}
		return this.#i ??= this.#t().then((e) => (Object.defineProperty(e, "html", { get: () => {
			le();
		} }), e)), this.#i.then((t) => e(t), t);
	}
}, K = class e {
	#e = [];
	#t = void 0;
	#n = !1;
	#r = null;
	type;
	#i;
	promise = void 0;
	global;
	local;
	constructor(e, t) {
		this.#i = t, this.global = e, this.local = t ? { ...t.local } : {
			select_value: void 0,
			multiple: !1
		}, this.type = t ? t.type : "body";
	}
	head(t) {
		let n = new e(this.global, this);
		n.type = "head", this.#e.push(n), n.child(t);
	}
	async_block(e, n) {
		this.#e.push(t), this.async(e, n), this.#e.push(a);
	}
	async(e, t) {
		let n = t;
		if (e.length > 0) {
			let r = x;
			n = (n) => Promise.all(e).then(() => {
				let e = x;
				try {
					return S(r), t(n);
				} finally {
					S(e);
				}
			});
		}
		this.child(n);
	}
	run(e) {
		let t = x, n = Promise.resolve(e[0]()), r = [n];
		t !== null && e.length > 1 && (t.i = !0);
		for (let i of e.slice(1)) n = n.then(() => {
			let e = x;
			S(t);
			try {
				return i();
			} finally {
				S(e);
			}
		}), r.push(n);
		return n.catch(c), this.promise = this.global.track(n), r;
	}
	child_block(e) {
		this.#e.push(t), this.child(e), this.#e.push(a);
	}
	child(t) {
		let n = new e(this.global, this);
		this.#e.push(n);
		let r = x;
		S({
			...x,
			p: r,
			c: null,
			r: n,
			i: x?.i ?? !1
		});
		let i = t(n);
		return S(r), i instanceof Promise && (i.catch(c), i.finally(() => S(null)).catch(c), n.global.mode === "sync" && b(), n.promise = n.global.track(i)), n;
	}
	boundary(t, n) {
		let r = new e(this.global, this);
		this.#e.push(r);
		let i = x;
		t.failed && (r.#r = {
			failed: t.failed,
			transformError: this.global.transformError,
			context: i
		}), S({
			...x,
			p: i,
			c: null,
			r,
			i: x?.i ?? !1
		});
		try {
			let e = n(r);
			S(i), e instanceof Promise && (r.global.mode === "sync" && b(), e.catch(c), r.promise = r.global.track(e));
		} catch (n) {
			S(i);
			let o = t.failed;
			if (!o) throw n;
			let s = this.global.transformError(n);
			r.#e.length = 0, r.#r = null, s instanceof Promise ? (this.global.mode === "sync" && b(), r.promise = r.global.track(s.then((t) => {
				S(i), r.#e.push(e.#a(t)), o(r, t, c), r.#e.push(a);
			})), r.promise.catch(c)) : (r.#e.push(e.#a(s)), o(r, s, c), r.#e.push(a));
		}
	}
	component(e, t) {
		pe(t), this.child((t) => (t.#n = !0, e(t))), me();
	}
	select(e, t, n, r, i, a, o) {
		let { value: s, defaultValue: c, ...l } = e;
		l.multiple === "" && (l.multiple = !0), this.push(`<select${Y(l, n, r, i, a)}>`), this.child((e) => {
			e.local.select_value = s === void 0 ? c : s, e.local.multiple = !!l.multiple, t(e);
		}), this.push(`${o ? "<!>" : ""}</select>`);
	}
	option(t, n, r, i, a, o, c) {
		this.#e.push(`<option${Y(t, r, i, a, o)}`);
		let u = (e, n, { head: r, body: i }) => {
			l.call(t, "value") && (n = t.value);
			var a = this.local.select_value;
			(this.local.multiple && s(a) ? a.includes(n) : n === a) && e.#e.push(" selected=\"\""), e.#e.push(`>${i}${c ? "<!>" : ""}</option>`), r && e.head((e) => e.push(r));
		};
		typeof n == "function" ? this.child((t) => {
			let r = new e(this.global, this);
			if (n(r), this.global.mode === "async") return r.#m().then((e) => {
				u(t, e.body.replaceAll("<!---->", ""), e);
			});
			{
				let e = r.#p();
				u(t, e.body.replaceAll("<!---->", ""), e);
			}
		}) : u(this, n, { body: _(n) });
	}
	title(t) {
		let n = this.get_path(), r = (e) => {
			this.global.set_title(e, n);
		};
		this.child((n) => {
			let i = new e(n.global, n);
			if (t(i), n.global.mode === "async") return i.#m().then((e) => {
				r(e.head);
			});
			{
				let e = i.#p();
				r(e.head);
			}
		});
	}
	push(e) {
		typeof e == "function" ? this.child(async (t) => t.push(await e())) : this.#e.push(e);
	}
	on_destroy(e) {
		(this.#t ??= []).push(e);
	}
	get_path() {
		return this.#i ? [...this.#i.get_path(), this.#i.#e.indexOf(this)] : [];
	}
	copy() {
		let t = new e(this.global, this.#i);
		return t.type = this.type, t.#e = this.#e.map((t) => t instanceof e ? t.copy() : t), t.promise = this.promise, t;
	}
	subsume(t) {
		if (this.global.mode !== t.global.mode) throw Error("invariant: A renderer cannot switch modes. If you're seeing this, there's a compiler bug. File an issue!");
		this.local = t.local, this.#e = t.#e.map((t, n) => {
			let r = this.#e[n];
			return r instanceof e && t instanceof e ? (r.subsume(t), r) : t;
		}), this.promise = t.promise, this.type = t.type;
	}
	get length() {
		return this.#e.length;
	}
	static #a(e) {
		return `<!--[?${JSON.stringify(e).replace(/>/g, "\\u003e").replace(/</g, "\\u003c")}-->`;
	}
	static render(t, n = {}) {
		return new Le(() => e.#d(t, n), () => ye().then(() => ve(() => e.#f(t, n))));
	}
	*#o() {
		for (let e of this.#s()) yield* e.#c();
	}
	*#s() {
		for (let e of this.#e) typeof e != "string" && (yield* e.#s());
		this.#n && (yield this);
	}
	*#c() {
		if (this.#t) for (let e of this.#t) yield e;
		for (let t of this.#e) t instanceof e && !t.#n && (yield* t.#c());
	}
	#l(e) {
		let t, n = !1;
		for (let r of this.#o()) try {
			r();
		} catch (r) {
			!e && !n && (t = r, n = !0);
		}
		if (n) throw t;
	}
	static #u(t, n) {
		return n.idPrefix?.includes("--") && de(), new e(new Re(t, n.idPrefix ? n.idPrefix + "-" : "", n.csp, n.transformError));
	}
	static #d(t, n) {
		var r = x;
		let i = e.#u("sync", n), a, o, s = !1;
		try {
			try {
				e.#g(i, t, n), a = e.#_(i.#p(), i);
			} catch (e) {
				o = e, s = !0;
			}
			if (i.#l(s), s) throw o;
			return a;
		} finally {
			i.global.abort(), S(r);
		}
	}
	static async #f(t, n) {
		let r = x, i = e.#u("async", n), a, o, s = !1;
		try {
			try {
				e.#g(i, t, n);
				let r = await i.#m(), o = await i.#h();
				o !== null && (r.head = o + r.head), a = e.#_(r, i);
			} catch (e) {
				o = e, s = !0, i.global.abort(), await i.global.settle();
			}
			if (i.#l(s), s) throw o;
			return a;
		} finally {
			S(r), i.global.abort();
		}
	}
	#p(t = {
		head: "",
		body: ""
	}) {
		for (let n of this.#e) typeof n == "string" ? t[this.type] += n : n instanceof e && n.#p(t);
		return t;
	}
	async #m(t = {
		head: "",
		body: ""
	}) {
		await this.promise;
		for (let n of this.#e) if (typeof n == "string") t[this.type] += n;
		else if (n instanceof e) {
			if (n.#r) {
				let r = {
					head: "",
					body: ""
				};
				try {
					await n.#m(r), t.head += r.head, t.body += r.body;
				} catch (r) {
					let { context: i, failed: o, transformError: s } = n.#r;
					S(i);
					let l = s(r);
					S(null);
					let u = await l;
					S(i);
					let d = new e(n.global, n);
					d.type = n.type, d.#e.push(e.#a(u)), o(d, u, c), d.#e.push(a), await d.#m(t);
				}
			} else await n.#m(t);
		}
		return t;
	}
	async #h() {
		let e = _e().hydratable;
		for (let [t, n] of e.unresolved_promises) ge(n, e.lookup.get(n)?.stack ?? "<missing stack trace>");
		for (let t of e.comparisons) await t;
		return await this.#v(e);
	}
	static #g(e, n, r) {
		var i = x;
		try {
			S({
				p: null,
				c: r.context ?? null,
				r: e,
				i: !1
			}), e.push(t), n(e, r.props ?? {}), e.push(a);
		} finally {
			S(i);
		}
	}
	static #_(e, t) {
		let n = e.head + t.global.get_title(), r = e.body;
		for (let { hash: e, code: r } of t.global.css) n += `<style id="${e}">${r}</style>`;
		return {
			head: n,
			body: r,
			hashes: { script: t.global.csp.script_hashes }
		};
	}
	async #v(e) {
		if (e.lookup.size === 0) return null;
		let t = [], n = !1;
		for (let [r, i] of e.lookup) {
			if (i.promises) {
				n = !0;
				for (let e of i.promises) await e;
			}
			t.push(`[${V(r)},${i.serialized}]`);
		}
		let r = "const h = (window.__svelte ??= {}).h ??= new Map();";
		n && (r = `const r = (v) => Promise.resolve(v);
				${r}`);
		let i = `
			{
				${r}

				for (const [k, v] of [
					${t.join(",\n					")}
				]) {
					h.set(k, v);
				}
			}
		`, a = "";
		if (this.global.csp.nonce) a = ` nonce="${this.global.csp.nonce}"`;
		else if (this.global.csp.hash) {
			let e = await A(i);
			this.global.csp.script_hashes.push(`sha256-${e}`);
		}
		return `\n\t\t<script${a}>${i}<\/script>`;
	}
}, Re = class {
	csp;
	mode;
	uid;
	css = /* @__PURE__ */ new Set();
	#e = /* @__PURE__ */ new Set();
	#t = null;
	#n = !1;
	transformError;
	#r = {
		path: [],
		value: ""
	};
	constructor(e, t = "", n = { hash: !1 }, r) {
		this.mode = e, this.csp = {
			...n,
			script_hashes: []
		}, this.transformError = r ?? ((e) => {
			throw e;
		});
		let i = 1;
		this.uid = () => `${t}s${i++}`;
	}
	track(e) {
		return this.#e.add(e), e.then(() => this.#e.delete(e), () => this.#e.delete(e)), e;
	}
	async settle() {
		for (; this.#e.size > 0;) await Promise.allSettled([...this.#e]);
	}
	abort() {
		this.#n || (this.#n = !0, this.#t?.abort(p));
	}
	get_abort_signal() {
		let e = this.#t ??= new AbortController();
		return this.#n && e.abort(p), e.signal;
	}
	get_title() {
		return this.#r.value;
	}
	set_title(e, t) {
		let n = this.#r.path, r = 0, i = Math.min(t.length, n.length);
		for (; r < i && t[r] === n[r];) r += 1;
		t[r] !== void 0 && (n[r] === void 0 || t[r] > n[r]) && (this.#r.path = t, this.#r.value = e);
	}
};
//#endregion
//#region src/public/svelte-lib/src/internal/server/blocks/html.js
function ze(e) {
	return "<!---->" + String(e ?? "") + "<!---->";
}
//#endregion
//#region src/public/svelte-lib/src/internal/server/dev.js
var q;
function J(e, t) {
	t = `node_invalid_placement_ssr: ${t}\n\nThis can cause content to shift around as the browser repairs the HTML, and will likely result in a \`hydration_mismatch\` warning.`, !(q ??= /* @__PURE__ */ new Set()).has(t) && (q.add(t), console.error(t), e.head((e) => e.push(`<script>console.error(${JSON.stringify(t).replaceAll("</", "<\\u002f")})<\/script>`)));
}
function Be(e, t, r, a) {
	var o = x, s = o.function[ee], c = o.element, l = {
		tag: t,
		parent: c,
		filename: s,
		line: r,
		column: a
	};
	if (c !== void 0) {
		var u = c.parent, d = [c.tag];
		let o = s ? `${s}:${r}:${a}` : void 0, l = c.filename ? `${c.filename}:${c.line}:${c.column}` : void 0, f = i(t, c.tag, o, l);
		for (f && J(e, f); u != null;) {
			d.push(u.tag);
			let r = u.filename ? `${u.filename}:${u.line}:${u.column}` : void 0, i = n(t, d, o, r);
			i && J(e, i), u = u.parent;
		}
	}
	S({
		...o,
		p: o,
		element: l
	});
}
function Ve() {
	S(x.p);
}
function He(e) {
	(typeof e != "object" || !(e instanceof K)) && f();
}
//#endregion
//#region src/public/svelte-lib/src/internal/server/index.js
var Ue = /[\s'">/=\u{FDD0}-\u{FDEF}\u{FFFE}\u{FFFF}\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}]/u;
function We(t, n, r = c, i = c) {
	t.push("<!---->"), n && (ae.test(n) || ce(n), t.push(`<${n}`), r(), t.push(">"), ne(n) || (i(), ie(n) || t.push(e), t.push(`</${n}>`))), t.push("<!---->");
}
function Ge(e, t = {}) {
	return t.csp?.hash && t.csp.nonce && ue(), K.render(e, t);
}
function Ke(t, n, r) {
	n.head((n) => {
		n.push(`<!--${t}-->`), n.child(r), n.push(e);
	});
}
function qe(e, t, n, r, i = !1) {
	let a = Xe(n);
	t ? e.push(`<svelte-css-wrapper style="display: contents; ${a}">`) : e.push(`<g style="${a}">`), r(), i || e.push("<!---->"), t ? e.push("</svelte-css-wrapper>") : e.push("</g>");
}
function Y(e, t, n, r, i = 0) {
	r && (e.style = h(e.style, r)), e.class &&= oe(e.class), (t || n) && (e.class = g(e.class, t, n));
	let a = "", o, s = !(i & 1), c = !(i & 2), l = !!(i & 4), u = Object.keys(e);
	outer: for (let t = 0; t < u.length; t++) if (o = u[t], typeof e[o] != "function" && (o[0] !== "$" || o[1] !== "$") && !(o === "" || Ue.test(o))) {
		var d = e[o], f = o.toLowerCase();
		if (c && (o = f), !(f.length > 2 && f.startsWith("on"))) {
			if (l && (o === "defaultvalue" || o === "defaultchecked")) {
				if (o = o === "defaultvalue" ? "value" : "checked", o in e) continue;
				for (let e = 0; e < u.length; e++) if (u[e].toLowerCase() === o) continue outer;
			}
			a += se(o, d, s && re(o));
		}
	}
	return a;
}
function Je(e) {
	let t = {}, n;
	for (let r = 0; r < e.length; r++) {
		let i = e[r];
		if (i != null) for (n of Object.keys(i)) {
			let e = Object.getOwnPropertyDescriptor(i, n);
			e ? Object.defineProperty(t, n, e) : t[n] = i[n];
		}
	}
	return t;
}
function Ye(e) {
	return typeof e == "string" ? e : e == null ? "" : e + "";
}
function Xe(e) {
	return Object.keys(e).filter((t) => e[t] != null && e[t] !== "").map((t) => `${t}: ${_(e[t], !0)};`).join(" ");
}
function Ze(e, t, n) {
	var r = g(e, t, n);
	return r ? ` class="${_(r, !0)}"` : "";
}
function Qe(e, t) {
	var n = h(e, t);
	return n ? ` style="${_(n, !0)}"` : "";
}
function X(e, t, n) {
	if (t in e && e[t][0] === n) return e[t][2];
	e[t]?.[1](), e[t] = [
		n,
		null,
		void 0
	];
	let r = v(n, (n) => e[t][2] = n);
	return e[t][1] = r, e[t][2];
}
function Z(e, t) {
	return e.set(t), t;
}
function $e(e, t, n, r) {
	return Z(n, X(e, t, n)), r;
}
function et(e, t, n, r = 1) {
	let i = X(e, t, n);
	return n.set(i + r), i;
}
function tt(e, t, n, r = 1) {
	let i = X(e, t, n) + r;
	return n.set(i), i;
}
function nt(e) {
	for (let t of Object.keys(e)) e[t][1]();
}
function Q(e, t, n, r, i) {
	var a = t.$$slots?.[n];
	a === !0 && (a = t[n === "default" ? "children" : n]), a === void 0 ? i?.() : a(e, r);
}
function rt(e, t) {
	let n = {}, r;
	for (r of Object.keys(e)) t.includes(r) || (n[r] = e[r]);
	return n;
}
function it(e) {
	let { children: t, $$slots: n, ...r } = e;
	return r;
}
function at(e) {
	let t = {};
	e.children && (t.default = !0);
	for (let n of Object.keys(e.$$slots || {})) t[n] = !0;
	return t;
}
function ot(e, t) {
	for (let n of Object.keys(t)) {
		let r = e[n], i = t[n];
		r === void 0 && i !== void 0 && Object.getOwnPropertyDescriptor(e, n)?.set && (e[n] = i);
	}
}
function st(e, n, i, a) {
	u(n) ? (e.push(t), n.then(null, c), i !== null && i()) : a !== null && (e.push(r), a(n));
}
function ct(e) {
	return e ? e.length === void 0 ? Array.from(e) : e : [];
}
function $(e) {
	let t = m;
	return () => (t === m && (t = e()), t);
}
function lt(e) {
	let t = e.global.uid();
	return e.push("<!--$" + t + "-->"), t;
}
function ut(e) {
	let t = x === null ? e : $(e), n;
	return function(e) {
		return arguments.length === 0 ? n ?? t() : (n = e, n);
	};
}
function dt(e, t = 1) {
	let n = e();
	return e(n + (typeof n == "bigint" ? BigInt(t) : t)), n;
}
function ft(e, t = 1) {
	let n = e(), r = n + (typeof n == "bigint" ? BigInt(t) : t);
	return e(r), r;
}
function pt(e) {
	return Promise.resolve(e()).then((e) => () => e);
}
//#endregion
export { Be as A, Ye as C, et as D, ft as E, ze as M, he as N, tt as O, Z as S, dt as T, at as _, st as a, X as b, ut as c, Ke as d, $ as f, it as g, rt as h, Y as i, He as j, Ve as k, We as l, Ge as m, Ze as n, ot as o, lt as p, Qe as r, qe as s, pt as t, ct as u, Q as v, nt as w, $e as x, Je as y };
