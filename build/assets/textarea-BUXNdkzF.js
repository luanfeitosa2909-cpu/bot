import{c as l,j as i,t as b,g as n,h as y}from"./index-Bg84Z9Mq.js";import{r as o}from"./react-vendor-CoRTCUxX.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=l("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=l("Mail",[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]]);var p=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],g=p.reduce((a,r)=>{const e=b(`Primitive.${r}`),s=o.forwardRef((t,u)=>{const{asChild:f,...m}=t,x=f?e:r;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),i.jsx(x,{...m,ref:u})});return s.displayName=`Primitive.${r}`,{...a,[r]:s}},{}),v="Label",d=o.forwardRef((a,r)=>i.jsx(g.label,{...a,ref:r,onMouseDown:e=>{var t;e.target.closest("button, input, select, textarea")||((t=a.onMouseDown)==null||t.call(a,e),!e.defaultPrevented&&e.detail>1&&e.preventDefault())}}));d.displayName=v;var c=d;const w=y("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"),h=o.forwardRef(({className:a,...r},e)=>i.jsx(c,{ref:e,className:n(w(),a),...r}));h.displayName=c.displayName;const N=o.forwardRef(({className:a,...r},e)=>i.jsx("textarea",{className:n("flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",a),ref:e,...r}));N.displayName="Textarea";export{L as C,h as L,M,N as T};
