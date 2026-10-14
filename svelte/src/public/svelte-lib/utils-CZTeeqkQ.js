//#region src/public/svelte-lib/src/utils.js
var e = /\r/g;
function t(t) {
	t = t.replace(e, "");
	let n = 5381, r = t.length;
	for (; r--;) n = (n << 5) - n ^ t.charCodeAt(r);
	return (n >>> 0).toString(36);
}
var n = [
	"area",
	"base",
	"br",
	"col",
	"command",
	"embed",
	"hr",
	"img",
	"input",
	"keygen",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr"
];
function r(e) {
	return n.includes(e) || e.toLowerCase() === "!doctype";
}
var i = /* @__PURE__ */ "arguments.await.break.case.catch.class.const.continue.debugger.default.delete.do.else.enum.eval.export.extends.false.finally.for.function.if.implements.import.in.instanceof.interface.let.new.null.package.private.protected.public.return.static.super.switch.this.throw.true.try.typeof.var.void.while.with.yield".split(".");
function a(e) {
	return i.includes(e);
}
function o(e) {
	return e.endsWith("capture") && e !== "gotpointercapture" && e !== "lostpointercapture";
}
var s = [
	"beforeinput",
	"click",
	"change",
	"dblclick",
	"contextmenu",
	"focusin",
	"focusout",
	"input",
	"keydown",
	"keyup",
	"mousedown",
	"mousemove",
	"mouseout",
	"mouseover",
	"mouseup",
	"pointerdown",
	"pointermove",
	"pointerout",
	"pointerover",
	"pointerup",
	"touchend",
	"touchmove",
	"touchstart"
];
function c(e) {
	return s.includes(e);
}
var l = /* @__PURE__ */ "allowfullscreen.async.autofocus.autoplay.checked.controls.default.disabled.formnovalidate.indeterminate.inert.ismap.loop.multiple.muted.nomodule.novalidate.open.playsinline.readonly.required.reversed.seamless.selected.webkitdirectory.defer.disablepictureinpicture.disableremoteplayback".split(".");
function u(e) {
	return l.includes(e);
}
var d = {
	formnovalidate: "formNoValidate",
	ismap: "isMap",
	nomodule: "noModule",
	playsinline: "playsInline",
	readonly: "readOnly",
	defaultvalue: "defaultValue",
	defaultchecked: "defaultChecked",
	srcobject: "srcObject",
	novalidate: "noValidate",
	allowfullscreen: "allowFullscreen",
	disablepictureinpicture: "disablePictureInPicture",
	disableremoteplayback: "disableRemotePlayback"
};
function f(e) {
	return e = e.toLowerCase(), d[e] ?? e;
}
var p = [
	...l,
	"formNoValidate",
	"isMap",
	"noModule",
	"playsInline",
	"readOnly",
	"value",
	"volume",
	"defaultValue",
	"defaultChecked",
	"srcObject",
	"noValidate",
	"allowFullscreen",
	"disablePictureInPicture",
	"disableRemotePlayback"
];
function m(e) {
	return p.includes(e);
}
var h = [
	"autofocus",
	"muted",
	"defaultValue",
	"defaultChecked"
];
function g(e) {
	return h.includes(e);
}
var _ = ["touchstart", "touchmove"];
function v(e) {
	return _.includes(e);
}
var y = [
	"textContent",
	"innerHTML",
	"innerText"
];
function b(e) {
	return y.includes(e);
}
var x = [
	"body",
	"embed",
	"iframe",
	"img",
	"link",
	"object",
	"script",
	"style",
	"track"
];
function S(e) {
	return x.includes(e);
}
var C = /* @__PURE__ */ "altGlyph.altGlyphDef.altGlyphItem.animate.animateColor.animateMotion.animateTransform.circle.clipPath.color-profile.cursor.defs.desc.discard.ellipse.feBlend.feColorMatrix.feComponentTransfer.feComposite.feConvolveMatrix.feDiffuseLighting.feDisplacementMap.feDistantLight.feDropShadow.feFlood.feFuncA.feFuncB.feFuncG.feFuncR.feGaussianBlur.feImage.feMerge.feMergeNode.feMorphology.feOffset.fePointLight.feSpecularLighting.feSpotLight.feTile.feTurbulence.filter.font.font-face.font-face-format.font-face-name.font-face-src.font-face-uri.foreignObject.g.glyph.glyphRef.hatch.hatchpath.hkern.image.line.linearGradient.marker.mask.mesh.meshgradient.meshpatch.meshrow.metadata.missing-glyph.mpath.path.pattern.polygon.polyline.radialGradient.rect.set.solidcolor.stop.svg.switch.symbol.text.textPath.tref.tspan.unknown.use.view.vkern".split(".");
function w(e) {
	return C.includes(e);
}
var T = /* @__PURE__ */ "annotation.annotation-xml.maction.math.merror.mfrac.mi.mmultiscripts.mn.mo.mover.mpadded.mphantom.mprescripts.mroot.mrow.ms.mspace.msqrt.mstyle.msub.msubsup.msup.mtable.mtd.mtext.mtr.munder.munderover.semantics".split(".");
function E(e) {
	return T.includes(e);
}
var D = [
	"$state",
	"$state.raw",
	"$derived",
	"$derived.by"
], O = [
	...D,
	"$state.eager",
	"$state.snapshot",
	"$props",
	"$props.id",
	"$bindable",
	"$effect",
	"$effect.pre",
	"$effect.tracking",
	"$effect.root",
	"$effect.pending",
	"$inspect",
	"$inspect().with",
	"$inspect.trace",
	"$host"
];
function k(e) {
	return O.includes(e);
}
function A(e) {
	return D.includes(e);
}
var j = [
	"textarea",
	"script",
	"style",
	"title"
];
function M(e) {
	return j.includes(e);
}
var N = /^[a-zA-Z][a-zA-Z0-9]*(-[a-zA-Z0-9.\-_\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}]*)?$/u;
function P(e) {
	return e?.replace(/\//g, "/​");
}
//#endregion
export { r as _, u as a, m as c, v as d, M as f, w as g, A as h, t as i, S as l, k as m, c as n, o, a as p, g as r, b as s, N as t, E as u, f as v, P as y };
