//#region src/public/svelte-lib/src/escaping.js
var e = /[&"<]/g, t = /[&<]/g;
function n(n, r) {
	let i = String(n ?? ""), a = r ? e : t;
	a.lastIndex = 0;
	let o = "", s = 0;
	for (; a.test(i);) {
		let e = a.lastIndex - 1, t = i[e];
		o += i.substring(s, e) + (t === "&" ? "&amp;" : t === "\"" ? "&quot;" : "&lt;"), s = e + 1;
	}
	return o + i.substring(s);
}
//#endregion
export { n as t };
