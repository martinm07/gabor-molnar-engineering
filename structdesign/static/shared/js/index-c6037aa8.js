import"/static/shared/js/index-6a60dbfb.js";function y(t){const n=t-1;return n*n*n+1}function $(t){return Math.pow(t-1,3)*(1-t)+1}function h(t){return-.5*(Math.cos(Math.PI*t)-1)}function x(t,{delay:n=0,duration:a=400,easing:c=y,x:u=0,y:e=0,opacity:f=0}={}){const o=getComputedStyle(t),r=+o.opacity,i=o.transform==="none"?"":o.transform,p=r*(1-f);return{delay:n,duration:a,easing:c,css:(s,m)=>`
			transform: ${i} translate(${(1-s)*u}px, ${(1-s)*e}px);
			opacity: ${r-p*m}`}}export{y as c,x as f,$ as q,h as s};
