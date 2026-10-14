//#region \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), s = (e, n) => {
	let r = {};
	for (var i in e) t(r, i, {
		get: e[i],
		enumerable: !0
	});
	return n || t(r, Symbol.toStringTag, { value: "Module" }), r;
}, c = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, l = (n, r, o) => (o = n == null ? {} : e(i(n)), c(r || !n || !n.__esModule || !a.call(n, "default") ? t(o, "default", {
	value: n,
	enumerable: !0
}) : o, n)), u = {
	li: { direct: ["li"] },
	dt: {
		descendant: ["dt", "dd"],
		reset_by: ["dl"]
	},
	dd: {
		descendant: ["dt", "dd"],
		reset_by: ["dl"]
	},
	p: { descendant: /* @__PURE__ */ "address.article.aside.blockquote.div.dl.fieldset.footer.form.h1.h2.h3.h4.h5.h6.header.hgroup.hr.main.menu.nav.ol.p.pre.section.table.ul".split(".") },
	rt: { descendant: ["rt", "rp"] },
	rp: { descendant: ["rt", "rp"] },
	optgroup: { descendant: ["optgroup"] },
	option: { descendant: ["option", "optgroup"] },
	thead: { direct: ["tbody", "tfoot"] },
	tbody: { direct: ["tbody", "tfoot"] },
	tfoot: { direct: ["tbody"] },
	tr: { direct: ["tr", "tbody"] },
	td: { direct: [
		"td",
		"th",
		"tr"
	] },
	th: { direct: [
		"td",
		"th",
		"tr"
	] }
};
function d(e, t) {
	let n = u[e];
	return !(!n || t && !("direct" in n ? n.direct : n.descendant).includes(t));
}
var f = {
	...u,
	form: { descendant: ["form"] },
	a: { descendant: ["a"] },
	button: { descendant: ["button"] },
	h1: { descendant: [
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6"
	] },
	h2: { descendant: [
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6"
	] },
	h3: { descendant: [
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6"
	] },
	h4: { descendant: [
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6"
	] },
	h5: { descendant: [
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6"
	] },
	h6: { descendant: [
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6"
	] },
	tr: { only: [
		"th",
		"td",
		"style",
		"script",
		"template"
	] },
	tbody: { only: [
		"tr",
		"style",
		"script",
		"template"
	] },
	thead: { only: [
		"tr",
		"style",
		"script",
		"template"
	] },
	tfoot: { only: [
		"tr",
		"style",
		"script",
		"template"
	] },
	colgroup: { only: ["col", "template"] },
	table: { only: [
		"caption",
		"colgroup",
		"tbody",
		"thead",
		"tfoot",
		"style",
		"script",
		"template"
	] },
	head: { only: [
		"base",
		"basefont",
		"bgsound",
		"link",
		"meta",
		"title",
		"noscript",
		"noframes",
		"style",
		"script",
		"template"
	] },
	html: { only: [
		"head",
		"body",
		"frameset"
	] },
	frameset: { only: ["frame"] },
	"#document": { only: ["html"] }
};
function p(e, t, n, r) {
	if (e.includes("-")) return null;
	let i = t[t.length - 1], a = f[i];
	if (!a) return null;
	if ("reset_by" in a && a.reset_by) {
		for (let e = t.length - 2; e >= 0; e--) if (t[e].includes("-") || a.reset_by.includes(t[e])) return null;
	}
	return "descendant" in a && a.descendant.includes(e) ? `${n ? `\`<${e}>\` (${n})` : `\`<${e}>\``} cannot be a descendant of ${r ? `\`<${i}>\` (${r})` : `\`<${i}>\``}` : null;
}
function m(e, t, n, r) {
	if (e.includes("-") || t?.includes("-") || t === "template") return null;
	let i = f[t], a = n ? `\`<${e}>\` (${n})` : `\`<${e}>\``, o = r ? `\`<${t}>\` (${r})` : `\`<${t}>\``;
	if (i) {
		if ("direct" in i && i.direct.includes(e)) return `${a} cannot be a direct child of ${o}`;
		if ("descendant" in i && i.descendant.includes(e)) return `${a} cannot be a child of ${o}`;
		if ("only" in i && i.only) return i.only.includes(e) ? null : `${a} cannot be a child of ${o}. \`<${t}>\` only allows these children: ${i.only.map((e) => `\`<${e}>\``).join(", ")}`;
	}
	switch (e) {
		case "body":
		case "caption":
		case "col":
		case "colgroup":
		case "frameset":
		case "frame":
		case "head":
		case "html": return `${a} cannot be a child of ${o}`;
		case "thead":
		case "tbody":
		case "tfoot": return `${a} must be the child of a \`<table>\`, not a ${o}`;
		case "td":
		case "th": return `${a} must be the child of a \`<tr>\`, not a ${o}`;
		case "tr": return `\`<tr>\` must be the child of a \`<thead>\`, \`<tbody>\`, or \`<tfoot>\`, not a ${o}`;
	}
	return null;
}
//#endregion
//#region src/public/svelte-lib/src/internal/server/hydration.js
var h = "<!--[-->", g = "<!--[!-->", _ = "<!--]-->", v = "<!---->";
//#endregion
export { d as a, o as c, v as i, s as l, h as n, p as o, g as r, m as s, _ as t, l as u };
