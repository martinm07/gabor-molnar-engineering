import { Gt as e, a as t, f as n, ft as r, j as i, st as a, w as o } from "./runtime-CwqRuC4c.js";
//#region src/public/svelte-lib/src/reactivity/create-subscriber.js
function s(s) {
	let c = 0, l = r(0), u;
	return () => {
		o() && (t(l), i(() => (c === 0 && (u = n(() => s(() => a(l)))), c += 1, () => {
			e(() => {
				--c, c === 0 && (u?.(), u = void 0, a(l));
			});
		})));
	};
}
//#endregion
export { s as t };
