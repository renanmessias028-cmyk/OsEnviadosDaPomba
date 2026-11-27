const IMG={group:"assets/grupo-herois.jpeg",cover:"assets/capa.jpeg",bg:"assets/fundo-capa.jpeg",icon:"assets/icone.jpeg"};
const $=s=>document.querySelector(s),uid=()=>Math.random().toString(36).slice(2,10),clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
document.querySelectorAll("[data-img]").forEach(e=>e.src=IMG[e.dataset.img]);
$("#hero").style.backgroundImage="url("+IMG.bg+")";
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>document.getElementById(b.dataset.go).scrollIntoView());
let tt;function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("on"),2200)}

/* rotas */
function route(){const m=location.hash==="#mesa";$("#home").hidden=m;$("#mesa").hidden=!m;$("#nMesa").classList.toggle("on",m);$("#nHome").classList.toggle("on",!m);if(m)render();else scrollTo(0,0)}
addEventListener("hashchange",route);

/* armazenamento (IndexedDB) */
let db=null;const mem={maps:[],lib:[]};
function openDB(){return new Promise(r=>{try{const q=indexedDB.open("enviados",1);q.onupgradeneeded=()=>{["maps","lib"].forEach(s=>q.result.createObjectStore(s,{keyPath:"id"}))};q.onsuccess=()=>{db=q.result;r()};q.onerror=()=>r()}catch(e){r()}})}
const st=(s,m)=>db.transaction(s,m).objectStore(s);
const all=s=>new Promise(r=>{if(!db)return r(mem[s]);try{const q=st(s,"readonly").getAll();q.onsuccess=()=>r(q.result);q.onerror=()=>r([])}catch(e){r([])}});
const put=(s,o)=>new Promise(r=>{if(!db){mem[s]=mem[s].filter(x=>x.id!==o.id).concat(o);return r()}try{const q=st(s,"readwrite").put(o);q.onsuccess=q.onerror=()=>r()}catch(e){r()}});
const del=(s,id)=>new Promise(r=>{if(!db){mem[s]=mem[s].filter(x=>x.id!==id);return r()}try{const q=st(s,"readwrite").delete(id);q.onsuccess=q.onerror=()=>r()}catch(e){r()}});

/* estado */
const newMap=()=>({id:uid(),name:"",bg:null,ratio:1.6,grid:true,cols:24,items:[],paints:[{id:uid(),name:"Pintura 1",data:null}],order:[]});
let M=newMap(),LIB=[],sel=null,PRES=false,dirty=false;
const board=$("#board"),layer=$("#items"),gridEl=$("#grid");
const cur=()=>M.items.find(i=>i.id===sel);

function place(d,it){d.style.left=it.x+"%";d.style.top=it.y+"%";d.style.width=it.w+"%";const im=d.firstChild;
  if(it.ar){d.style.height=(it.w*it.ar*(it.sy||1)*M.ratio)+"%";im.style.height="100%"}else{d.style.height="auto";im.style.height="auto"}
  d.style.transform="translate(-50%,-50%) rotate("+it.r+"deg)";d.style.opacity=it.o??1;d.style.display=it.hide?"none":"";
  im.style.transform="skewX("+(it.k||0)+"deg) scale("+(it.fx||1)+","+(it.fy||1)+")"}
function drawGrid(){gridEl.style.display=M.grid?"block":"none";const px=Math.max(4,board.clientWidth/M.cols);gridEl.style.backgroundSize=px+"px "+px+"px"}
const CV={};
const lum=h=>{const n=parseInt(h.slice(1),16);return(.299*(n>>16)+.587*(n>>8&255)+.114*(n&255))/255};
const LK=id=>id==="map"&&M.bg?{id:"map",map:1}:M.paints.find(p=>p.id===id)||M.items.find(i=>i.id===id)||null;
function fixOrder(){const ids=new Set([...M.paints.map(p=>p.id),...M.items.map(i=>i.id)]);if(M.bg)ids.add("map");
  M.order=(M.order||[]).filter((i,k,a)=>ids.has(i)&&a.indexOf(i)===k);ids.forEach(i=>{if(!M.order.includes(i)){if(i==="map")M.order.unshift(i);else M.order.push(i)}})}
function getCV(l){let c=CV[l.id];if(!c){c=CV[l.id]=document.createElement("canvas");c.className="pl";c.width=1600;c.height=Math.round(1600/M.ratio);
  if(l.data){const i=new Image();i.onload=()=>c.getContext("2d").drawImage(i,0,0,c.width,c.height);i.src=l.data}}return c}
function render(){
  fixOrder();
  board.style.width=PRES?"min(100vw,"+(100*M.ratio)+"vh)":"min(100%,"+(78*M.ratio)+"vh)";board.style.aspectRatio=M.ratio;
  $("#empty").hidden=!!M.bg;board.style.backgroundColor=M.bgc||"#000000";$("#bgc").value=M.bgc||"#000000";$("#empty").style.color=lum(M.bgc||"#000000")>.5?"#000":"#fff";layer.innerHTML="";
  M.order.forEach(id=>{
    if(id==="map"){const d=document.createElement("div");d.className="ml";d.style.backgroundImage="url("+M.bg+")";d.style.opacity=M.mo??1;d.style.display=M.mhide?"none":"";layer.append(d);return}
    const p=M.paints.find(x=>x.id===id);
    if(p){const c=getCV(p);c.style.opacity=p.o??1;c.style.display=p.hide?"none":"";layer.append(c);return}
    const it=M.items.find(x=>x.id===id);if(!it)return;
    const d=document.createElement("div");d.className="item"+(it.id===sel?" sel":"");d.dataset.id=it.id;
    const i=new Image();i.draggable=false;i.onload=()=>{if(!it.ar&&i.naturalWidth){it.ar=i.naturalHeight/i.naturalWidth;it.sy=it.sy||1;place(d,it)}};i.src=it.src;
    d.append(i);["hd","he","hs","hr"].forEach(k=>{const e=document.createElement("div");e.className="h "+k;d.append(e)});place(d,it);layer.append(d)});
  $("#gridOn").checked=M.grid;$("#cols").value=M.cols;$("#mname").value=M.name;drawGrid();panel();layersUI();
}
new ResizeObserver(drawGrid).observe(board);
function panel(){const it=cur();$("#selbox").hidden=!it;if(it){$("#sz").value=it.w;$("#sy").value=it.sy||1;$("#rot").value=it.r;$("#sk").value=it.k||0;$("#op").value=it.o??1}}
function select(id){sel=id;layer.querySelectorAll(".item").forEach(x=>x.classList.toggle("sel",x.dataset.id===id));panel();layersUI()}
function addItem(src,name,k){const it={id:uid(),src,name:name||"Item "+(M.items.length+1),x:k==null?50:20+(k%5)*15,y:k==null?50:20+Math.floor(k/5)*15,w:10,r:0};M.items.push(it);sel=it.id;render()}

/* arrastar, rodar a roda para redimensionar */
let drag=null;
layer.addEventListener("pointerdown",e=>{const d=e.target.closest(".item");if(!d){select(null);return}
  select(d.dataset.id);const it=cur(),r=board.getBoundingClientRect(),q=d.getBoundingClientRect(),cx=q.left+q.width/2,cy=q.top+q.height/2,c=e.target.classList;
  const k=c.contains("hd")?"hd":c.contains("he")?"he":c.contains("hs")?"hs":c.contains("hr")?"hr":"mv";
  if(k==="mv"&&it.lock)return;
  drag={k,d,it,r,cx,cy,d0:Math.hypot(e.clientX-cx,e.clientY-cy)||1,w0:it.w,dx:(e.clientX-r.left)/r.width*100-it.x,dy:(e.clientY-r.top)/r.height*100-it.y};d.setPointerCapture(e.pointerId)});
layer.addEventListener("pointermove",e=>{if(!drag)return;const{k,it,d,r,cx,cy}=drag,W=r.width;
  if(k==="mv"){it.x=clamp((e.clientX-r.left)/r.width*100-drag.dx,0,100);it.y=clamp((e.clientY-r.top)/r.height*100-drag.dy,0,100)}
  else if(k==="hr"){it.r=Math.round(Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI+90);if(it.r>180)it.r-=360}
  else if(k==="hd"){it.w=clamp(drag.w0*Math.hypot(e.clientX-cx,e.clientY-cy)/drag.d0,1,100)}
  else{const a=-it.r*Math.PI/180,px=e.clientX-cx,py=e.clientY-cy,lx=px*Math.cos(a)-py*Math.sin(a),ly=px*Math.sin(a)+py*Math.cos(a);
    if(k==="he"){const nw=clamp(2*Math.abs(lx)/W*100,1,100);it.sy=(it.sy||1)*it.w/nw;it.w=nw}
    else if(it.ar)it.sy=clamp(2*Math.abs(ly)/(it.w/100*W*it.ar),.05,10)}
  place(d,it);panel()});
layer.addEventListener("pointerup",()=>drag=null);
layer.addEventListener("wheel",e=>{const d=e.target.closest(".item");if(!d)return;e.preventDefault();
  const it=M.items.find(i=>i.id===d.dataset.id);it.w=clamp(it.w*(e.deltaY<0?1.08:.92),1,100);place(d,it);panel()},{passive:false});
addEventListener("keydown",e=>{if(location.hash!=="#mesa"||!sel||/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;
  if(e.key==="Delete"||e.key==="Backspace"){M.items=M.items.filter(i=>i.id!==sel);sel=null;render()}});

/* painel do selecionado */
function live(){const it=cur(),d=layer.querySelector('[data-id="'+sel+'"]');if(it&&d)place(d,it)}
$("#sz").oninput=e=>{cur().w=+e.target.value;live()};
$("#sy").oninput=e=>{cur().sy=+e.target.value;live()};
$("#bRatio").onclick=()=>{const it=cur();if(it){it.sy=1;live();panel()}};
$("#rot").oninput=e=>{cur().r=+e.target.value;live()};
$("#sk").oninput=e=>{cur().k=+e.target.value;live()};
$("#op").oninput=e=>{cur().o=+e.target.value;live()};
$("#bFH").onclick=()=>{const it=cur();if(it){it.fx=-(it.fx||1);live()}};
$("#bFV").onclick=()=>{const it=cur();if(it){it.fy=-(it.fy||1);live()}};
$("#bToLib").onclick=async()=>{const it=cur();if(!it)return;const e={id:uid(),src:it.src,name:it.name};LIB.push(e);await put("lib",e);renderLib();toast("Salvo na biblioteca")};
$("#bDel").onclick=()=>{M.items=M.items.filter(i=>i.id!==sel);sel=null;render()};
$("#bDup").onclick=()=>{const it=cur();if(!it)return;const c={...it,id:uid(),x:clamp(it.x+3,0,100),y:clamp(it.y+3,0,100)};M.items.push(c);sel=c.id;render()};
$("#bFront").onclick=()=>{const it=cur();if(it){M.order=M.order.filter(i=>i!==it.id).concat(it.id);render()}};
$("#bCrop").onclick=async()=>{const it=cur(),o=await openCrop(it.src,{max:512});if(o){it.src=o;render()}};
$("#gridOn").onchange=e=>{M.grid=e.target.checked;drawGrid()};
$("#cols").oninput=e=>{M.cols=+e.target.value;drawGrid()};
$("#bgc").oninput=e=>{M.bgc=e.target.value;board.style.backgroundColor=M.bgc;$("#empty").style.color=lum(M.bgc)>.5?"#000":"#fff"};
$("#bgReset").onclick=()=>{M.bgc=null;render()};

/* arquivos e recorte */
const readF=f=>new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(f)});
function openCrop(src,o={}){const max=o.max||1024,type=o.type||"image/png",circle=o.circle!==false;
 return new Promise(res=>{const im=new Image();im.onload=()=>{
  const dlg=$("#crop"),cv=$("#cropCv"),ctx=cv.getContext("2d");let sl=null,s0=null,done=false;
  const s=Math.min(1,Math.min(innerWidth*.8,820)/im.width,innerHeight*.55/im.height);
  cv.width=Math.round(im.width*s);cv.height=Math.round(im.height*s);
  $("#cropT").textContent=o.title||"Recortar";$("#circL").hidden=!circle;$("#circ").checked=false;
  const draw=()=>{ctx.drawImage(im,0,0,cv.width,cv.height);if(sl&&sl.w>2&&sl.h>2){ctx.fillStyle="rgba(0,0,0,.6)";ctx.fillRect(0,0,cv.width,cv.height);
    ctx.drawImage(im,sl.x/s,sl.y/s,sl.w/s,sl.h/s,sl.x,sl.y,sl.w,sl.h);ctx.strokeStyle="#fff";ctx.setLineDash([6,4]);ctx.strokeRect(sl.x+.5,sl.y+.5,sl.w,sl.h)}};
  const pos=e=>{const r=cv.getBoundingClientRect();return{x:clamp((e.clientX-r.left)*cv.width/r.width,0,cv.width),y:clamp((e.clientY-r.top)*cv.height/r.height,0,cv.height)}};
  cv.onpointerdown=e=>{s0=pos(e);sl={x:s0.x,y:s0.y,w:0,h:0};cv.setPointerCapture(e.pointerId)};
  cv.onpointermove=e=>{if(!s0)return;const p=pos(e);sl={x:Math.min(s0.x,p.x),y:Math.min(s0.y,p.y),w:Math.abs(p.x-s0.x),h:Math.abs(p.y-s0.y)};draw()};
  cv.onpointerup=()=>s0=null;
  const out=r=>{const k=Math.min(1,max/Math.max(r.w,r.h)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(r.w*k));c.height=Math.max(1,Math.round(r.h*k));
    const x=c.getContext("2d");if(circle&&$("#circ").checked){x.beginPath();x.ellipse(c.width/2,c.height/2,c.width/2,c.height/2,0,0,7);x.clip()}
    x.drawImage(im,r.x,r.y,r.w,r.h,0,0,c.width,c.height);return c.toDataURL(type,.85)};
  const fin=v=>{if(done)return;done=true;if(dlg.open)dlg.close();res(v)};
  $("#cOk").onclick=()=>fin(sl&&sl.w>4&&sl.h>4?out({x:sl.x/s,y:sl.y/s,w:sl.w/s,h:sl.h/s}):out({x:0,y:0,w:im.width,h:im.height}));
  $("#cAll").onclick=()=>fin(out({x:0,y:0,w:im.width,h:im.height}));
  $("#cNo").onclick=()=>fin(null);dlg.oncancel=()=>fin(null);
  draw();dlg.showModal()};im.src=src})}

$("#bMap").onclick=()=>$("#fMap").click();
$("#fMap").onchange=async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;
  const o=await openCrop(await readF(f),{max:2000,type:"image/jpeg",circle:false,title:"Recortar mapa"});if(!o)return;
  const im=new Image();im.onload=()=>{snap();M.bg=o;M.ratio=clamp(im.width/im.height,.5,3);loadPaint();render()};im.src=o};
$("#bNoMap").onclick=()=>{M.bg=null;render()};
$("#bEl").onclick=()=>$("#fEl").click();
async function toLib(src){const o=await openCrop(src,{max:512,title:"Criar elemento"});if(!o)return;const e={id:uid(),src:o};LIB.push(e);await put("lib",e);renderLib();toast("Elemento adicionado à biblioteca")}
const shrink=(src,max)=>new Promise(r=>{const i=new Image();i.onload=()=>{const k=Math.min(1,max/Math.max(i.width,i.height,1)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(i.width*k));c.height=Math.max(1,Math.round(i.height*k));c.getContext("2d").drawImage(i,0,0,c.width,c.height);r(c.toDataURL("image/png"))};i.onerror=()=>r(src);i.src=src});
$("#fEl").onchange=async e=>{const fs=[...e.target.files];e.target.value="";if(!fs.length)return;const pl=$("#placeAll").checked;
  if(fs.length===1&&!pl){toLib(await readF(fs[0]));return}
  let n=0;for(const f of fs){const o=await shrink(await readF(f),512),el={id:uid(),src:o,name:f.name.replace(/\.[^.]+$/,"")};LIB.push(el);await put("lib",el);if(pl)addItem(o,el.name,n++)}
  renderLib();toast(fs.length+(fs.length>1?" elementos adicionados":" elemento adicionado"))};
const SELL=new Set();const selUI=()=>{const b=$("#bSelPlace");b.textContent="Colocar selecionados ("+SELL.size+")";b.hidden=!SELL.size};
$("#bSelAll").onclick=()=>{if(SELL.size===LIB.length)SELL.clear();else LIB.forEach(e=>SELL.add(e.id));renderLib()};
$("#bSelPlace").onclick=()=>{let k=0;LIB.filter(e=>SELL.has(e.id)).forEach(e=>addItem(e.src,e.name,k++));SELL.clear();renderLib()};
$("#rpg").innerHTML=["group","cover","bg","icon"].map(k=>'<button class="thumb" data-k="'+k+'"><img src="'+IMG[k]+'" alt=""></button>').join("");
$("#rpg").onclick=e=>{const b=e.target.closest(".thumb");if(b)toLib(IMG[b.dataset.k])};
function renderLib(){const L=$("#lib");L.innerHTML="";selUI();
  if(!LIB.length){L.style.display="block";L.textContent="Nenhum elemento ainda.";return}L.style.display="grid";
  LIB.forEach(e=>{const b=document.createElement("div");b.className="thumb";b.title=e.name||"Elemento";const im=new Image();im.src=e.src;b.append(im);
    b.classList.toggle("ps",SELL.has(e.id));b.onclick=ev=>{if(ev.target.closest(".x"))return;if(ev.ctrlKey||ev.metaKey||ev.shiftKey||SELL.size){SELL.has(e.id)?SELL.delete(e.id):SELL.add(e.id);renderLib()}else addItem(e.src,e.name)};
    const x=document.createElement("button");x.className="x";x.textContent="🗑";x.title="Excluir elemento";
    x.onclick=async()=>{if(!x.dataset.c){x.dataset.c=1;x.textContent="Excluir?";setTimeout(()=>{delete x.dataset.c;x.textContent="🗑"},2500);return}
      LIB=LIB.filter(i=>i!==e);SELL.delete(e.id);await del("lib",e.id);renderLib();toast("Elemento excluído")};b.append(x);L.append(b)})}

/* objetos prontos: vista de cima, fundo transparente (SVG) */
const G=(b,vb)=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+vb+'" preserveAspectRatio="none"><g fill="#fff" stroke="#000" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">'+b+'</g></svg>';
const PRE=[
["Mesa redonda","0 0 100 100",'<circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="36" stroke-width="2"/>'],
["Mesa","0 0 160 90",'<rect x="4" y="4" width="152" height="82" rx="6"/><rect x="14" y="14" width="132" height="62" rx="3" stroke-width="2"/>'],
["Cadeira","0 0 60 60",'<rect x="6" y="14" width="48" height="40" rx="6"/><rect x="4" y="4" width="52" height="12" rx="4" fill="#000"/>'],
["Banco","0 0 120 40",'<rect x="4" y="4" width="112" height="32" rx="5"/><path d="M30 4v32M90 4v32" stroke-width="2"/>'],
["Barril","0 0 100 100",'<circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="38" stroke-width="2"/><path d="M50 12v76M12 50h76" stroke-width="2"/><circle cx="50" cy="50" r="6" fill="#000"/>'],
["Caixote","0 0 100 100",'<rect x="4" y="4" width="92" height="92" rx="3"/><rect x="16" y="16" width="68" height="68" stroke-width="2"/><path d="M16 16L84 84M84 16L16 84" stroke-width="2"/>'],
["Baú","0 0 110 76",'<rect x="4" y="4" width="102" height="68" rx="10"/><path d="M4 26h102M32 4v68M78 4v68" stroke-width="3"/><rect x="48" y="20" width="14" height="18" rx="2" fill="#000"/>'],
["Cama","0 0 70 110",'<rect x="4" y="4" width="62" height="102" rx="6"/><rect x="12" y="10" width="46" height="22" rx="6" stroke-width="3"/><path d="M4 48h62M14 62h42M14 76h42" stroke-width="2"/>'],
["Porta","0 0 110 110",'<path d="M10 100V12A88 88 0 0 1 98 100" fill="none" stroke-width="2" stroke-dasharray="6 6"/><rect x="4" y="12" width="10" height="88" rx="2" fill="#000"/><rect x="4" y="94" width="102" height="12" rx="2"/>'],
["Tapete","0 0 140 90",'<rect x="4" y="4" width="132" height="82"/><rect x="14" y="14" width="112" height="62" stroke-width="2"/><path d="M70 18L112 45 70 72 28 45z" stroke-width="2"/>'],
["Prateleira","0 0 150 40",'<rect x="4" y="4" width="142" height="32"/><path d="M40 4v32M75 4v32M110 4v32" stroke-width="2"/>'],
["Altar","0 0 120 80",'<rect x="4" y="4" width="112" height="72" rx="4"/><circle cx="60" cy="40" r="18" stroke-width="2"/><path d="M60 24v32M44 40h32" stroke-width="2"/>'],
["Pilar","0 0 80 80",'<rect x="4" y="4" width="72" height="72"/><circle cx="40" cy="40" r="22" stroke-width="2"/><circle cx="40" cy="40" r="8" fill="#000"/>'],
["Escada","0 0 100 120",'<rect x="4" y="4" width="92" height="112"/><path d="M4 22h92M4 40h92M4 58h92M4 76h92M4 94h92" stroke-width="2"/>'],
["Poço","0 0 100 100",'<circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="30" fill="#000"/><path d="M50 4v16M50 80v16M4 50h16M80 50h16" stroke-width="3"/>'],
["Caldeirão","0 0 100 100",'<circle cx="12" cy="50" r="8"/><circle cx="88" cy="50" r="8"/><circle cx="50" cy="50" r="40"/><circle cx="50" cy="50" r="30" fill="#000"/>'],
["Fogueira","0 0 100 100",'<circle cx="88" cy="50" r="8"/><circle cx="77" cy="77" r="8"/><circle cx="50" cy="88" r="8"/><circle cx="23" cy="77" r="8"/><circle cx="12" cy="50" r="8"/><circle cx="23" cy="23" r="8"/><circle cx="50" cy="12" r="8"/><circle cx="77" cy="23" r="8"/><path d="M50 24c8 14 20 20 20 36a20 20 0 0 1-40 0c0-10 6-14 10-20 2 6 4 8 8 4 2-6 2-12 2-20z" fill="#000"/>'],
["Tocha","0 0 80 80",'<circle cx="40" cy="40" r="30"/><circle cx="40" cy="40" r="12" fill="#000"/><path d="M40 4v8M40 68v8M4 40h8M68 40h8M14 14l6 6M60 60l6 6M66 14l-6 6M20 60l-6 6" stroke-width="3"/>'],
["Árvore","0 0 120 120",'<circle cx="60" cy="60" r="54"/><circle cx="40" cy="44" r="20" stroke-width="2"/><circle cx="78" cy="42" r="18" stroke-width="2"/><circle cx="66" cy="80" r="22" stroke-width="2"/><circle cx="60" cy="60" r="6" fill="#000"/>'],
["Arbusto","0 0 90 90",'<circle cx="30" cy="34" r="24"/><circle cx="60" cy="34" r="24"/><circle cx="45" cy="60" r="26"/><circle cx="45" cy="46" r="3" fill="#000"/>'],
["Pedra","0 0 100 90",'<path d="M12 50L26 18 58 8 88 26 94 58 70 82 32 80z"/><path d="M26 18L44 40 58 8M44 40L62 56 94 58M44 40L32 80" stroke-width="2"/>'],
["Armadilha","0 0 90 90",'<rect x="4" y="4" width="82" height="82"/><path d="M20 34l8-14 8 14zM54 34l8-14 8 14zM20 70l8-14 8 14zM54 70l8-14 8 14z" fill="#000"/>'],
["Espada","0 0 40 120",'<path d="M20 4l8 8v62H12V12z"/><rect x="2" y="74" width="36" height="8" rx="3" fill="#000"/><rect x="15" y="82" width="10" height="26" rx="2"/><circle cx="20" cy="112" r="6"/>'],
["Token claro","0 0 100 100",'<circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="34" stroke-width="2"/>'],
["Token escuro","0 0 100 100",'<circle cx="50" cy="50" r="46" fill="#000" stroke="#fff"/><circle cx="50" cy="50" r="34" fill="#000" stroke="#fff" stroke-width="2"/>']
];
const puri=p=>"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(G(p[2],p[1]));
$("#pre").innerHTML=PRE.map((p,i)=>'<button class="thumb" data-i="'+i+'" title="'+p[0]+'"><img alt="'+p[0]+'" src="'+puri(p)+'"></button>').join("");
$("#pre").onclick=e=>{const b=e.target.closest(".thumb");if(b)addItem(puri(PRE[b.dataset.i]),PRE[b.dataset.i][0])};

/* salvar mapas */
const norm=m=>{m.items=(m.items||[]).map(i=>({id:uid(),...i}));
  if(!m.paints){m.paints=[];const mk=(n,d)=>{const p={id:uid(),name:n,data:d||null};m.paints.push(p);return p.id};
    const pen=mk("Lápis",m.pen),fx=mk("Névoa / escuro / luz",m.fx);m.order=[...(m.bg?["map"]:[]),pen,...m.items.map(i=>i.id),fx];delete m.pen;delete m.fx}
  m.order=m.order||[];return m};
function setMap(m){M=norm(m);sel=null;loadPaint();render();renderMaps()}
async function saveCur(force){if(!force&&!(M.bg||M.items.length||M.paints.some(p=>p.data||p.d)||M.name))return;snap();M.name=$("#mname").value.trim()||M.name||"Mapa sem nome";M.updated=Date.now();
  try{await put("maps",structuredClone(M));dirty=false;await renderMaps()}catch(e){toast("Não foi possível salvar")}}
async function renderMaps(){const list=(await all("maps")).sort((a,b)=>a.name.localeCompare(b.name)),box=$("#maps"),s=$("#mapSel");box.innerHTML="";s.innerHTML="";
  if(!list.some(m=>m.id===M.id))s.add(new Option((M.name||"Mapa atual")+" (não salvo)",M.id));
  list.forEach(m=>{s.add(new Option(m.name,m.id));
    const r=document.createElement("div");r.className="saved";const n=document.createElement("span");n.textContent=m.name;r.append(n);
    const d=document.createElement("button");d.className="btn s o";d.textContent="🗑";d.title="Excluir mapa";
    d.onclick=async()=>{if(!d.dataset.c){d.dataset.c=1;d.textContent="Excluir?";setTimeout(()=>{delete d.dataset.c;d.textContent="🗑"},2500);return}await del("maps",m.id);renderMaps()};
    r.append(d);r.onclick=ev=>{if(ev.target!==d)switchTo(m.id)};box.append(r)});s.value=M.id}
async function switchTo(id){if(id===M.id)return;await saveCur();const m=(await all("maps")).find(x=>x.id===id);if(m){setMap(structuredClone(m));toast("Mapa “"+m.name+"” aberto")}}
$("#mapSel").onchange=e=>switchTo(e.target.value);
$("#bSave").onclick=async()=>{await saveCur(true);toast("Mapa salvo")};
$("#bNew").onclick=async()=>{await saveCur();const m=newMap();m.name="Mapa "+((await all("maps")).length+1);setMap(m)};
$("#mname").oninput=e=>{M.name=e.target.value};
setInterval(()=>{if(dirty)saveCur()},4000);
$("#mesa").addEventListener("pointerup",()=>dirty=true,true);$("#mesa").addEventListener("input",()=>dirty=true,true);

/* camadas */
function layersUI(){const L=$("#layers");L.innerHTML="";
  [...M.order].reverse().forEach(id=>{const it=M.items.find(x=>x.id===id),p=M.paints.find(x=>x.id===id),isM=id==="map",o=it||p||{};
    const r=document.createElement("div");r.className="lrow"+(id===sel?" on":"");
    r.innerHTML='<span class="gp" draggable="true" title="Arrastar para reordenar">⠿</span><button title="Mostrar/ocultar"></button><span class="th"></span><input type="text"><button title="Travar"></button>';
    const[g,v,th,n,l]=r.children,hide=isM?M.mhide:o.hide;
    v.textContent=hide?"○":"●";l.textContent=isM?"":o.lock?"🔒":"🔓";
    if(it||isM){const i=new Image();i.src=it?it.src:M.bg;th.append(i)}else{const c=document.createElement("canvas");c.width=c.height=22;if(CV[id])c.getContext("2d").drawImage(CV[id],0,0,22,22);th.append(c)}
    n.value=isM?"Mapa":(o.name||"Camada");n.disabled=isM;n.oninput=()=>o.name=n.value;
    v.onclick=()=>{if(isM)M.mhide=!M.mhide;else o.hide=!o.hide;render()};
    l.onclick=()=>{if(!isM){o.lock=!o.lock;layersUI()}};
    r.onclick=e=>{if(!e.target.closest("button,input,.gp"))select(id)};
    g.ondragstart=e=>{e.dataTransfer.setData("text/plain",id);e.dataTransfer.setDragImage(r,10,10)};
    r.ondragover=e=>{e.preventDefault();r.classList.add("dr")};r.ondragleave=()=>r.classList.remove("dr");
    r.ondrop=e=>{e.preventDefault();const a=e.dataTransfer.getData("text/plain");if(a&&a!==id){M.order=M.order.filter(x=>x!==a);M.order.splice(M.order.indexOf(id)+1,0,a);render()}};
    L.append(r)});
  const s=LK(sel);$("#lop").value=s?(s.map?(M.mo??1):(s.o??1)):1}
function addPaint(){const p={id:uid(),name:"Pintura "+(M.paints.length+1),data:null};M.paints.push(p);fixOrder();const i=M.order.indexOf(sel);
  M.order=M.order.filter(x=>x!==p.id);M.order.splice(i<0?M.order.length:i+1,0,p.id);sel=p.id;ACTP=p.id;render()}
$("#lNew").onclick=addPaint;
$("#lop").oninput=e=>{const v=+e.target.value,l=LK(sel);if(!l)return;if(l.map){M.mo=v;const m=layer.querySelector(".ml");if(m)m.style.opacity=v}else{l.o=v;if(CV[l.id])CV[l.id].style.opacity=v;else live()}};
$("#lDup").onclick=()=>{const l=LK(sel);if(!l||l.map)return;let c;
  if(M.items.includes(l)){c={...l,id:uid(),name:(l.name||"Item")+" cópia",x:clamp(l.x+3,0,100),y:clamp(l.y+3,0,100)};M.items.push(c)}
  else{const cv=CV[l.id];c={...l,id:uid(),name:l.name+" cópia",data:cv?cv.toDataURL():l.data,d:false};L0[c.id]=c.data;M.paints.push(c)}
  fixOrder();M.order=M.order.filter(x=>x!==c.id);M.order.splice(M.order.indexOf(l.id)+1,0,c.id);sel=c.id;render()};
const mvL=d=>{const i=M.order.indexOf(sel),k=i+d;if(i<0||k<0||k>=M.order.length)return;[M.order[i],M.order[k]]=[M.order[k],M.order[i]];render()};
$("#lUp").onclick=()=>mvL(1);$("#lDn").onclick=()=>mvL(-1);
$("#lDel").onclick=()=>{const l=LK(sel);if(!l)return;if(l.map)M.bg=null;else if(M.items.includes(l))M.items=M.items.filter(x=>x!==l);else{M.paints=M.paints.filter(x=>x!==l);delete CV[l.id]}sel=null;render()};

/* pincéis */
let TOOL="mv",BS=50,OP=1,pt=null,hist=[],H=0,ACTP=null,L0={},tgt=null;
function loadPaint(){M.paints.forEach(p=>{delete CV[p.id];L0[p.id]=p.data||null});hist=[];H=0;ACTP=null}
function snap(){M.paints.forEach(p=>{const c=CV[p.id];if(c&&p.d){p.data=c.toDataURL();p.d=false}})}
function tl(){let l=M.paints.find(p=>p.id===sel)||M.paints.find(p=>p.id===ACTP)||M.paints[0];if(!l){addPaint();l=M.paints[M.paints.length-1]}return l}
$("#tools").onclick=e=>{const b=e.target.closest("button");if(!b)return;TOOL=b.dataset.t;[...$("#tools").children].forEach(x=>x.classList.toggle("on",x===b));board.classList.toggle("brush",TOOL!=="mv");
  if(TOOL!=="mv"&&!M.paints.some(p=>p.id===sel)){const l=M.paints.find(p=>p.id===ACTP)||M.paints[0];select(l?l.id:null)}};
const setBS=v=>{BS=Math.max(1,Math.round(+v)||1);$("#bsn").value=BS;$("#bs").value=BS};
$("#bs").oninput=e=>setBS(e.target.value);$("#bsn").oninput=e=>{BS=Math.max(1,+e.target.value||1);$("#bs").value=BS};
$("#bo").oninput=e=>{OP=e.target.value/100;$("#bov").textContent=e.target.value+"%"};
const cpos=e=>{const r=board.getBoundingClientRect();return[(e.clientX-r.left)*tgt.width/r.width,(e.clientY-r.top)*tgt.height/r.height]};
const baseC=document.createElement("canvas"),scC=document.createElement("canvas");
function begin(){[baseC,scC].forEach(c=>{c.width=tgt.width;c.height=tgt.height});baseC.getContext("2d").drawImage(tgt,0,0)}
function stamp(x0,y0,x1,y1){const k=TOOL,x=scC.getContext("2d"),r=BS/2;
  if(k==="pen"||k==="er"){x.strokeStyle=k==="pen"?$("#pc").value:"#000";x.lineWidth=Math.max(1.5,k==="er"?BS/2:BS/8);x.lineCap=x.lineJoin="round";x.beginPath();x.moveTo(x0,y0);x.lineTo(x1,y1);x.stroke()}
  else{const col=k==="fog"?"226,230,240":"0,0,0",a=k==="light"?.5:.35,n=clamp(Math.ceil(Math.hypot(x1-x0,y1-y0)/(r/4)),1,200);
    for(let i=1;i<=n;i++){const px=x0+(x1-x0)*i/n,py=y0+(y1-y0)*i/n,g=x.createRadialGradient(px,py,0,px,py,r);
      g.addColorStop(0,"rgba("+col+","+a+")");g.addColorStop(.5,"rgba("+col+","+a*.6+")");g.addColorStop(1,"rgba("+col+",0)");x.fillStyle=g;x.fillRect(px-r,py-r,r*2,r*2)}}
  const c=tgt.getContext("2d");c.globalCompositeOperation="source-over";c.globalAlpha=1;c.clearRect(0,0,tgt.width,tgt.height);c.drawImage(baseC,0,0);
  c.globalAlpha=OP;c.globalCompositeOperation=k==="light"||k==="er"?"destination-out":"source-over";c.drawImage(scC,0,0);c.globalAlpha=1;c.globalCompositeOperation="source-over"}
let tgtL=null;
board.addEventListener("pointerdown",e=>{if(TOOL==="mv")return;const l=tl();if(l.hide||l.lock){toast("Camada oculta ou travada");return}
  ACTP=l.id;if(sel!==l.id)select(l.id);tgtL=l;tgt=getCV(l);pt=cpos(e);l.d=true;begin();stamp(...pt,...pt);board.setPointerCapture(e.pointerId)});
board.addEventListener("pointermove",e=>{if(!pt)return;const p=cpos(e);stamp(...pt,...p);pt=p});
board.addEventListener("pointerup",()=>{if(pt){pt=null;pushH(tgtL.id);layersUI()}});
function cover(col){const l=tl();if(l.hide||l.lock)return toast("Camada oculta ou travada");const c=getCV(l),x=c.getContext("2d");x.globalCompositeOperation="source-over";x.globalAlpha=1;x.fillStyle=col;x.fillRect(0,0,c.width,c.height);l.d=true;dirty=true;pushH(l.id);layersUI()}
$("#bFog").onclick=()=>cover("rgba(226,230,240,"+.92*OP+")");$("#bDk").onclick=()=>cover("rgba(0,0,0,"+.92*OP+")");
$("#bClr").onclick=()=>{const l=tl();if(l.hide||l.lock)return toast("Camada oculta ou travada");const c=getCV(l);c.getContext("2d").clearRect(0,0,c.width,c.height);l.d=true;dirty=true;pushH(l.id);layersUI()};
/* desfazer / refazer (por camada) */
function pushH(id){hist=hist.slice(0,H);hist.push({id,url:CV[id].toDataURL()});if(hist.length>40){const e=hist.shift();L0[e.id]=e.url}H=hist.length}
function restoreL(id,u){const c=CV[id];if(!c)return;const x=c.getContext("2d");x.globalCompositeOperation="source-over";x.globalAlpha=1;x.clearRect(0,0,c.width,c.height);
  if(u){const i=new Image();i.onload=()=>x.drawImage(i,0,0,c.width,c.height);i.src=u}const l=M.paints.find(p=>p.id===id);if(l)l.d=true;dirty=true}
function undo(){if(H<1)return toast("Nada para desfazer");const e=hist[--H];let u=L0[e.id]??null;for(let i=H-1;i>=0;i--)if(hist[i].id===e.id){u=hist[i].url;break}restoreL(e.id,u);toast("Traço desfeito")}
function redo(){if(H>=hist.length)return toast("Nada para refazer");const e=hist[H++];restoreL(e.id,e.url);toast("Traço refeito")}
$("#bUn").onclick=undo;$("#bRe").onclick=redo;
addEventListener("keydown",e=>{if(location.hash!=="#mesa")return;const a=document.activeElement,t=a&&a.tagName;
  if((t==="TEXTAREA"||t==="SELECT"||(t==="INPUT"&&!/range|checkbox|color/.test(a.type))))return;
  const m=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
  if(m&&k==="z"){e.preventDefault();e.shiftKey?redo():undo()}else if(m&&k==="y"){e.preventDefault();redo()}
  else if(k==="[")setBS(Math.min(BS-1,Math.round(BS*.85)));else if(k==="]")setBS(Math.round(BS*1.18)+1)});
/* modo apresentação */
function pres(on){PRES=on;if(on)sel=null;$("#mesa").classList.toggle("pres",on);$("#bPres").textContent=on?"Sair":"Apresentar";
  try{if(on)document.documentElement.requestFullscreen?.()?.catch(()=>{});else if(document.fullscreenElement)document.exitFullscreen()}catch(e){}render()}
$("#bPres").onclick=()=>pres(!PRES);
document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement&&PRES)pres(false)});
addEventListener("keydown",e=>{if(e.key==="Escape"&&PRES)pres(false)});

openDB().then(async()=>{LIB=await all("lib");renderLib();const ms=await all("maps");if(ms.length){ms.sort((a,b)=>b.updated-a.updated);M=norm(structuredClone(ms[0]))}await renderMaps();loadPaint();route()});
