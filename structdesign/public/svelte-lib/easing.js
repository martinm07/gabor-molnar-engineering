//#region src/public/svelte-lib/src/easing/index.js
function e(e) {
	return e;
}
function t(e) {
	let t = 2.5949095;
	return (e *= 2) < 1 ? .5 * (e * e * (3.5949095 * e - t)) : .5 * ((e -= 2) * e * (3.5949095 * e + t) + 2);
}
function n(e) {
	return e * e * (2.70158 * e - 1.70158);
}
function r(e) {
	return --e * e * (2.70158 * e + 1.70158) + 1;
}
function i(e) {
	let t = e * e;
	return e < .36363636363636365 ? 7.5625 * t : e < .7272727272727273 ? 9.075 * t - 9.9 * e + 3.4 : e < .9 ? 12.066481994459833 * t - 19.63545706371191 * e + 8.898060941828255 : 10.8 * e * e - 20.52 * e + 10.72;
}
function a(e) {
	return e < .5 ? .5 * (1 - i(1 - e * 2)) : .5 * i(e * 2 - 1) + .5;
}
function o(e) {
	return 1 - i(1 - e);
}
function s(e) {
	return (e *= 2) < 1 ? -.5 * (Math.sqrt(1 - e * e) - 1) : .5 * (Math.sqrt(1 - (e -= 2) * e) + 1);
}
function c(e) {
	return 1 - Math.sqrt(1 - e * e);
}
function l(e) {
	return Math.sqrt(1 - --e * e);
}
function u(e) {
	return e < .5 ? 4 * e * e * e : .5 * (2 * e - 2) ** 3 + 1;
}
function d(e) {
	return e * e * e;
}
function f(e) {
	let t = e - 1;
	return t * t * t + 1;
}
function p(e) {
	return e < .5 ? .5 * Math.sin(13 * Math.PI / 2 * 2 * e) * 2 ** (10 * (2 * e - 1)) : .5 * Math.sin(-13 * Math.PI / 2 * (2 * e - 1 + 1)) * 2 ** (-10 * (2 * e - 1)) + 1;
}
function m(e) {
	return Math.sin(13 * e * Math.PI / 2) * 2 ** (10 * (e - 1));
}
function h(e) {
	return Math.sin(-13 * (e + 1) * Math.PI / 2) * 2 ** (-10 * e) + 1;
}
function g(e) {
	return e === 0 || e === 1 ? e : e < .5 ? .5 * 2 ** (20 * e - 10) : -.5 * 2 ** (10 - e * 20) + 1;
}
function _(e) {
	return e === 0 ? e : 2 ** (10 * (e - 1));
}
function v(e) {
	return e === 1 ? e : 1 - 2 ** (-10 * e);
}
function y(e) {
	return e /= .5, e < 1 ? .5 * e * e : (e--, -.5 * (e * (e - 2) - 1));
}
function b(e) {
	return e * e;
}
function x(e) {
	return -e * (e - 2);
}
function S(e) {
	return e < .5 ? 8 * e ** 4 : -8 * (e - 1) ** 4 + 1;
}
function C(e) {
	return e ** 4;
}
function w(e) {
	return (e - 1) ** 3 * (1 - e) + 1;
}
function T(e) {
	return (e *= 2) < 1 ? .5 * e * e * e * e * e : .5 * ((e -= 2) * e * e * e * e + 2);
}
function E(e) {
	return e * e * e * e * e;
}
function D(e) {
	return --e * e * e * e * e + 1;
}
function O(e) {
	return -.5 * (Math.cos(Math.PI * e) - 1);
}
function k(e) {
	let t = Math.cos(e * Math.PI * .5);
	return Math.abs(t) < 1e-14 ? 1 : 1 - t;
}
function A(e) {
	return Math.sin(e * Math.PI / 2);
}
//#endregion
export { n as backIn, t as backInOut, r as backOut, o as bounceIn, a as bounceInOut, i as bounceOut, c as circIn, s as circInOut, l as circOut, d as cubicIn, u as cubicInOut, f as cubicOut, m as elasticIn, p as elasticInOut, h as elasticOut, _ as expoIn, g as expoInOut, v as expoOut, e as linear, b as quadIn, y as quadInOut, x as quadOut, C as quartIn, S as quartInOut, w as quartOut, E as quintIn, T as quintInOut, D as quintOut, k as sineIn, O as sineInOut, A as sineOut };
