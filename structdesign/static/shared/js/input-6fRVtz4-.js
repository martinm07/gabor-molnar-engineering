import{r as f,y as u,q as i}from"./svelte-COkJ5VSo.js";let a=!1;function l(){a||(a=!0,document.addEventListener("reset",e=>{Promise.resolve().then(()=>{var r;if(!e.defaultPrevented)for(const t of e.target.elements)(r=t.__on_r)==null||r.call(t)})},{capture:!0}))}function v(e,r,t,n=t){e.addEventListener(r,t);const _=e.__on_r;_?e.__on_r=()=>{_(),n()}:e.__on_r=n,l()}function c(e,r,t){v(e,"input",()=>{u(()=>t(o(e)?s(e.value):e.value))}),f(()=>{var n=r();e.__value=n,!(o(e)&&n===s(e.value))&&(e.type==="date"&&!n&&!e.value||(e.value=i(n)))})}function o(e){var r=e.type;return r==="number"||r==="range"}function s(e){return e===""?null:+e}export{c as b};