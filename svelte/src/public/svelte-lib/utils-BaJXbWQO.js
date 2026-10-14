import { Er as e, f as t } from "./runtime-CwqRuC4c.js";
//#region src/public/svelte-lib/src/store/utils.js
function n(n, r, i) {
	if (n == null) return r(void 0), i && i(void 0), e;
	let a = t(() => n.subscribe(r, i));
	return a.unsubscribe ? () => a.unsubscribe() : a;
}
//#endregion
export { n as t };
