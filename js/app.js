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
const newMap=()=>({id:uid(),name:"",bg:null,ratio:1.6,grid:true,cols:24,items:[]});
let M=newMap(),LIB=[],sel=null;
const board=$("#board"),layer=$("#items"),gridEl=$("#grid");
const cur=()=>M.items.find(i=>i.id===sel);

function place(d,it){d.style.left=it.x+"%";d.style.top=it.y+"%";d.style.width=it.w+"%";d.style.transform="translate(-50%,-50%) rotate("+it.r+"deg)"}
function drawGrid(){gridEl.style.display=M.grid?"block":"none";const px=Math.max(4,board.clientWidth/M.cols);gridEl.style.backgroundSize=px+"px "+px+"px"}
function render(){
  board.style.width="min(100%,"+(78*M.ratio)+"vh)";board.style.aspectRatio=M.ratio;
  board.style.backgroundImage=M.bg?"url("+M.bg+")":"none";$("#empty").hidden=!!M.bg;
  layer.innerHTML="";
  M.items.forEach(it=>{const d=document.createElement("div");d.className="item"+(it.id===sel?" sel":"");d.dataset.id=it.id;const i=new Image();i.src=it.src;i.draggable=false;d.append(i);place(d,it);layer.append(d)});
  $("#gridOn").checked=M.grid;$("#cols").value=M.cols;$("#mname").value=M.name;drawGrid();panel();
}
new ResizeObserver(drawGrid).observe(board);
function panel(){const it=cur();$("#selbox").hidden=!it;if(it){$("#sz").value=it.w;$("#rot").value=it.r}}
function select(id){sel=id;layer.querySelectorAll(".item").forEach(x=>x.classList.toggle("sel",x.dataset.id===id));panel()}
function addItem(src){const it={id:uid(),src,x:50,y:50,w:10,r:0};M.items.push(it);sel=it.id;render()}

/* arrastar, rodar a roda para redimensionar */
let drag=null;
layer.addEventListener("pointerdown",e=>{const d=e.target.closest(".item");if(!d){select(null);return}
  select(d.dataset.id);const it=cur(),r=board.getBoundingClientRect();
  drag={d,it,r,dx:(e.clientX-r.left)/r.width*100-it.x,dy:(e.clientY-r.top)/r.height*100-it.y};d.setPointerCapture(e.pointerId)});
layer.addEventListener("pointermove",e=>{if(!drag)return;const{r,it,d}=drag;
  it.x=clamp((e.clientX-r.left)/r.width*100-drag.dx,0,100);it.y=clamp((e.clientY-r.top)/r.height*100-drag.dy,0,100);place(d,it)});
layer.addEventListener("pointerup",()=>drag=null);
layer.addEventListener("wheel",e=>{const d=e.target.closest(".item");if(!d)return;e.preventDefault();
  const it=M.items.find(i=>i.id===d.dataset.id);it.w=clamp(it.w*(e.deltaY<0?1.08:.92),1,100);place(d,it);panel()},{passive:false});
addEventListener("keydown",e=>{if(location.hash!=="#mesa"||!sel||/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;
  if(e.key==="Delete"||e.key==="Backspace"){M.items=M.items.filter(i=>i.id!==sel);sel=null;render()}});

/* painel do selecionado */
function live(){const it=cur(),d=layer.querySelector('[data-id="'+sel+'"]');if(it&&d)place(d,it)}
$("#sz").oninput=e=>{cur().w=+e.target.value;live()};
$("#rot").oninput=e=>{cur().r=+e.target.value;live()};
$("#bDel").onclick=()=>{M.items=M.items.filter(i=>i.id!==sel);sel=null;render()};
$("#bDup").onclick=()=>{const it=cur();if(!it)return;const c={...it,id:uid(),x:clamp(it.x+3,0,100),y:clamp(it.y+3,0,100)};M.items.push(c);sel=c.id;render()};
$("#bFront").onclick=()=>{const it=cur();M.items=M.items.filter(i=>i!==it).concat(it);render()};
$("#bCrop").onclick=async()=>{const it=cur(),o=await openCrop(it.src,{max:512});if(o){it.src=o;render()}};
$("#gridOn").onchange=e=>{M.grid=e.target.checked;drawGrid()};
$("#cols").oninput=e=>{M.cols=+e.target.value;drawGrid()};

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
  const im=new Image();im.onload=()=>{M.bg=o;M.ratio=clamp(im.width/im.height,.5,3);render()};im.src=o};
$("#bNoMap").onclick=()=>{M.bg=null;render()};
$("#bEl").onclick=()=>$("#fEl").click();
async function toLib(src){const o=await openCrop(src,{max:512,title:"Criar elemento"});if(!o)return;const e={id:uid(),src:o};LIB.push(e);await put("lib",e);renderLib();toast("Elemento adicionado à biblioteca")}
$("#fEl").onchange=async e=>{const f=e.target.files[0];e.target.value="";if(f)toLib(await readF(f))};
$("#rpg").innerHTML=["group","cover","bg","icon"].map(k=>'<button class="thumb" data-k="'+k+'"><img src="'+IMG[k]+'" alt=""></button>').join("");
$("#rpg").onclick=e=>{const b=e.target.closest(".thumb");if(b)toLib(IMG[b.dataset.k])};
function renderLib(){const L=$("#lib");L.innerHTML="";
  if(!LIB.length){L.style.display="block";L.textContent="Nenhum elemento ainda.";return}L.style.display="grid";
  LIB.forEach(e=>{const b=document.createElement("div");b.className="thumb";b.innerHTML='<img alt="">';b.firstChild.src=e.src;
    b.onclick=ev=>{if(ev.target.className==="x")return;addItem(e.src)};
    const x=document.createElement("button");x.className="x";x.textContent="×";x.title="Excluir";x.onclick=async()=>{LIB=LIB.filter(i=>i!==e);await del("lib",e.id);renderLib()};b.append(x);L.append(b)})}

/* salvar mapas */
async function renderMaps(){const list=(await all("maps")).sort((a,b)=>b.updated-a.updated),box=$("#maps");box.innerHTML="";
  list.forEach(m=>{const r=document.createElement("div");r.className="saved";const n=document.createElement("span");n.textContent=m.name;r.append(n);
    const o=document.createElement("button");o.className="btn s";o.textContent="Abrir";o.onclick=()=>{M=structuredClone(m);sel=null;render();toast("Mapa aberto")};
    const d=document.createElement("button");d.className="btn s o";d.textContent="×";d.title="Excluir";d.onclick=async()=>{await del("maps",m.id);renderMaps()};
    const g=document.createElement("span");g.style.cssText="display:flex;gap:4px";g.append(o,d);r.append(g);box.append(r)})}
$("#bSave").onclick=async()=>{M.name=$("#mname").value.trim()||"Mapa sem nome";M.updated=Date.now();
  try{await put("maps",structuredClone(M));await renderMaps();toast("Mapa salvo")}catch(e){toast("Não foi possível salvar")}};
$("#bNew").onclick=()=>{M=newMap();sel=null;render()};

openDB().then(async()=>{LIB=await all("lib");renderLib();renderMaps();route()});
