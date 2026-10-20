const x=t=>t;function $(t){const n=t-1;return n*n*n+1}function m(t){const n=typeof t=="string"&&t.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);return n?[parseFloat(n[1]),n[2]||"px"]:[t,"px"]}function C(t,{delay:n=0,duration:s=400,easing:c=x}={}){const r=+getComputedStyle(t).opacity;return{delay:n,duration:s,easing:c,css:a=>`opacity: ${a*r}`}}function S(t,{delay:n=0,duration:s=400,easing:c=$,x:r=0,y:a=0,opacity:e=0}={}){const o=getComputedStyle(t),i=+o.opacity,p=o.transform==="none"?"":o.transform,u=i*(1-e),[y,f]=m(r),[_,d]=m(a);return{delay:n,duration:s,easing:c,css:(l,g)=>`
			transform: ${p} translate(${(1-l)*y}${f}, ${(1-l)*_}${d});
			opacity: ${i-u*g}`}}function b(t,{delay:n=0,duration:s=400,easing:c=$,start:r=0,opacity:a=0}={}){const e=getComputedStyle(t),o=+e.opacity,i=e.transform==="none"?"":e.transform,p=1-r,u=o*(1-a);return{delay:n,duration:s,easing:c,css:(y,f)=>`
			transform: ${i} scale(${1-p*f});
			opacity: ${o-u*f}
		`}}export{S as a,C as f,b as s};
