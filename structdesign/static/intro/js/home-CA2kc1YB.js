import{ag as k,a4 as x,ab as y,ad as T,a5 as A,a6 as B,e as f,f as s,a7 as U,s as m,a9 as t,aa as j,ac as p,a8 as v,ah as C}from"../../shared/js/svelte-RF-eauUH.js";import{s as D}from"../../shared/js/attributes-DH8p9ely.js";/* empty css                 *//* empty css                 */import{f as E}from"../../shared/js/helper-kVxyI5r2.js";/* empty css                       */const H="/static/intro/img/img1-Dn-Tmj_v.png";function I(r,a){f(a,s(a)+1)}function O(r,a,o){a("add_user",{method:"POST",body:s(o),headers:{"Content-Type":"text/plain"}}).then(e=>console.log(e))}var P=U('<h1 class="svelte-1io1nvf">Home</h1> <button class="svelte-1io1nvf"> </button> <input type="text"> <h1 class="svelte-1io1nvf"> </h1> <button class="svelte-1io1nvf">Add User!</button> <img alt="">',1);function S(r,a){x(a,!0);let o=m(0),e=m("Booyah");var i=P(),d=j(i),n=t(t(d,!0));n.__click=[I,o];var _=v(n),c=t(t(n,!0)),l=t(t(c,!0)),h=v(l),u=t(t(l,!0));u.__click=[O,E,e];var g=t(t(u,!0));D(g,"src",H),y(()=>{p(_,`clicks: ${s(o)??""}`),p(h,s(e))}),T(c,()=>s(e),b=>f(e,b)),A(r,i),B()}k(["click"]);C(S,{target:document.getElementById("app")});