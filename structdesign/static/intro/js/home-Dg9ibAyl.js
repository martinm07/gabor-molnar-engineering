import{K as x,x as y,G as k,y as A,z as B,v as f,t as s,A as T,F as u,C as t,D as C,H as p,B as v,N as D}from"../../shared/js/svelte-Dn3LxMab.js";import{s as H}from"../../shared/js/attributes-DIkj7TX0.js";import{b as U}from"../../shared/js/input-DQmmrUAU.js";/* empty css                 *//* empty css                 */import{f as j}from"../../shared/js/helper-BdH2pwvn.js";/* empty css                       */const z="/static/intro/img/img1-Dn-Tmj_v.png";function E(r,e){f(e,s(e)+1)}function F(r,e,o){e("add_user",{method:"POST",body:s(o),headers:{"Content-Type":"text/plain"}}).then(a=>console.log(a))}var G=T('<h1 class="svelte-1io1nvf">Home</h1> <button class="svelte-1io1nvf"> </button> <input type="text"> <h1 class="svelte-1io1nvf"> </h1> <button class="svelte-1io1nvf">Add User!</button> <img alt="">',1);function I(r,e){y(e,!0);let o=u(0),a=u("Booyah");var i=G(),_=C(i),n=t(t(_,!0));n.__click=[E,o];var d=v(n),l=t(t(n,!0)),c=t(t(l,!0)),h=v(c),m=t(t(c,!0));m.__click=[F,j,a];var g=t(t(m,!0));H(g,"src",z),k(()=>{p(d,`clicks: ${s(o)??""}`),p(h,s(a))}),U(l,()=>s(a),b=>f(a,b)),A(r,i),B()}x(["click"]);D(I,{target:document.getElementById("app")});