import { Fn as e, Nn as t, Pn as n, Sr as r, pn as i } from "./runtime-CwqRuC4c.js";
import { _ as a } from "./utils-CZTeeqkQ.js";
import { t as o } from "./escaping-FZnsaNz1.js";
//#region src/public/svelte-lib/src/internal/shared/validate.js
function s(e) {
	let t = e();
	t && a(t) && i(t);
}
function c(t) {
	let n = t();
	n && typeof n != "string" && e();
}
function l(e, t) {
	e != null && typeof e.subscribe != "function" && n(t);
}
function u(e) {
	return e.toString = () => (t(), ""), e;
}
//#endregion
//#region node_modules/clsx/dist/clsx.mjs
function d(e) {
	var t, n, r = "";
	if (typeof e == "string" || typeof e == "number") r += e;
	else if (typeof e == "object") {
		if (Array.isArray(e)) {
			var i = e.length;
			for (t = 0; t < i; t++) e[t] && (n = d(e[t])) && (r && (r += " "), r += n);
		} else for (n in e) e[n] && (r && (r += " "), r += n);
	}
	return r;
}
function f() {
	for (var e, t, n = 0, r = "", i = arguments.length; n < i; n++) (e = arguments[n]) && (t = d(e)) && (r && (r += " "), r += t);
	return r;
}
//#endregion
//#region src/public/svelte-lib/src/internal/shared/attributes.js
var p = { translate: /* @__PURE__ */ new Map([[!0, "yes"], [!1, "no"]]) };
function m(e, t, n = !1) {
	if (e === "hidden" && t !== "until-found" && (n = !0), t == null || n && !t && t !== "") return "";
	let i = r.call(p, e) && p[e].get(t) || t;
	return ` ${e}${n ? "=\"\"" : `="${o(i, !0)}"`}`;
}
function h(e) {
	return typeof e == "object" ? f(e) : e ?? "";
}
var g = [..." 	\n\r\f\xA0\v﻿"];
function _(e, t, n) {
	var r = e == null ? "" : "" + e;
	if (t && (r = r ? r + " " + t : t), n) {
		for (var i of Object.keys(n)) if (n[i]) r = r ? r + " " + i : i;
		else if (r.length) for (var a = i.length, o = 0; (o = r.indexOf(i, o)) >= 0;) {
			var s = o + a;
			(o === 0 || g.includes(r[o - 1])) && (s === r.length || g.includes(r[s])) ? r = (o === 0 ? "" : r.substring(0, o)) + r.substring(s + 1) : o = s;
		}
	}
	return r === "" ? null : r;
}
function v(e, t = !1) {
	var n = t ? " !important;" : ";", r = "";
	for (var i of Object.keys(e)) {
		var a = e[i];
		a != null && a !== "" && (r += " " + i + ": " + a + n);
	}
	return r;
}
function y(e) {
	return e[0] !== "-" || e[1] !== "-" ? e.toLowerCase() : e;
}
function b(e, t) {
	if (t) {
		var n = "", r, i;
		if (Array.isArray(t) ? (r = t[0], i = t[1]) : r = t, e) {
			e = String(e).replaceAll(/\/\*.*?\*\//g, "").trim();
			var a = !1, o = 0, s = !1, c = [];
			r && c.push(...Object.keys(r).map(y)), i && c.push(...Object.keys(i).map(y));
			var l = 0, u = -1;
			let t = e.length;
			for (var d = 0; d < t; d++) {
				var f = e[d];
				if (s ? f === "/" && e[d - 1] === "*" && (s = !1) : a ? a === f && (a = !1) : f === "/" && e[d + 1] === "*" ? s = !0 : f === "\"" || f === "'" ? a = f : f === "(" ? o++ : f === ")" && o--, !s && a === !1 && o === 0) {
					if (f === ":" && u === -1) u = d;
					else if (f === ";" || d === t - 1) {
						if (u !== -1) {
							var p = y(e.substring(l, u).trim());
							if (!c.includes(p)) {
								f !== ";" && d++;
								var m = e.substring(l, d).trim();
								n += " " + m + ";";
							}
						}
						l = d + 1, u = -1;
					}
				}
			}
		}
		return r && (n += v(r)), i && (n += v(i, !0)), n = n.trim(), n === "" ? null : n;
	}
	return e == null ? null : String(e);
}
//#endregion
export { u as a, s as c, b as i, h as n, c as o, _ as r, l as s, m as t };
