var c={BASE_URL:"/",MODE:"production",DEV:!1,PROD:!0,SSR:!1};function f(e,s){if(globalThis.jinjaParsed)e instanceof Request&&/^(GET|HEAD|OPTIONS|TRACE)/i.test(e.method)&&e.headers.set("X-CSRFToken",globalThis.csrfToken),s!=null&&s.method&&!/GET|HEAD|OPTIONS|TRACE/i.test(s.method)&&(s.headers={...s.headers??{},"X-CSRFToken":globalThis.csrfToken});else{const n=e instanceof Request?e.url:e;if(!URL.canParse(n)){const t=new URL(n,c.VITE_DEV_FLASK_SERVER);e instanceof Request?e=new Request(t,e):e=t}s??(s={}),s.mode="cors",s.credentials="include"}return fetch(e,s)}function l(e){return function(s){s.preventDefault(),e.call(this,s)}}function d(e,s,n=!0){const t=o=>{o.style.transition=s.map(a=>a+" 0s").join(", ")},r=o=>{n?setTimeout(()=>{o.style.removeProperty("transition")}):o.style.removeProperty("transition")};e.addEventListener("mousedown",()=>{t(e);for(const o of e.querySelectorAll("*"))o instanceof HTMLElement&&t(o)}),e.addEventListener("mouseup",()=>{r(e);for(const o of e.querySelectorAll("*"))o instanceof HTMLElement&&r(o)})}export{f,l as p,d as s};