```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Gridcalc</title>
<style>
*{box-sizing:border-box}
html,body{height:100%;margin:0;font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;background:#fff}
#app{display:flex;flex-direction:column;height:100vh}
.toolbar{display:flex;align-items:center;gap:6px;padding:6px 8px;background:#f7f7f7;border-bottom:1px solid #ddd}
#address-display{min-width:56px;text-align:center;font-weight:600;border:1px solid #ccc;background:#fff;padding:2px 6px;border-radius:3px}
#formula-bar{flex:1;padding:4px 6px;border:1px solid #ccc;border-radius:3px}
#grid-container{flex:1;overflow:auto}
#grid{display:grid;background:#fff}
.header{position:sticky;background:#f0f0f0;text-align:center;font-weight:600;border-right:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;padding:2px 4px;font-size:12px;user-select:none}
.corner{position:sticky;top:0;left:0;z-index:4;background:#e8e8e8}
.col-header{position:sticky;top:0;z-index:3}
.row-header{position:sticky;left:0;z-index:3}
.col-header.selected,.row-header.selected{background:#d0e4ff}
.cell{position:relative;border-right:1px solid #eee;border-bottom:1px solid #eee;padding:0;overflow:hidden;white-space:nowrap}
.cell-display{padding:2px 6px;height:100%}
.cell-editor{position:absolute;inset:0;border:none;outline:none;background:transparent;padding:2px 6px;font:inherit}
.cell.numeric .cell-display{text-align:right}
.cell.text .cell-display{text-align:left}
.cell[aria-selected="true"]{background:#cfe8ff;outline:2px solid #4a90e2;z-index:2}
.cell.error{background:#ffebee;color:#b71c1c}
.cell.ref-highlight{outline:2px solid #ff9800}
#status-bar{padding:2px 8px;font-size:12px;color:#666;border-top:1px solid #eee;background:#fafafa}
</style>
</head>
<body>
<div id="app">
<div class="toolbar">
<span id="address-display"></span>
<input id="formula-bar" autocomplete="off">
</div>
<div id="grid-container"><div id="grid"></div></div>
<div id="status-bar"></div>
</div>
<script>
const content={};
const astCache={};
const valueCache={};
const deps={};
const reverseDeps={};
let selectedAddr='A1';
let editingAddr=null;
let clipboard=null;
let saveTimer=null;
const addressDisplay=document.getElementById('address-display');
const formulaBar=document.getElementById('formula-bar');

function colToIndex(s){let i=0;for(const ch of s){i=i*26+(ch.charCodeAt(0)-64)}return i}
function indexToCol(i){let c='';while(i>0){i--;c=String.fromCharCode(65+(i%26))+c;i=Math.floor(i/26)}return c}
function colFromAddr(a){const m=a.match(/^([A-Z]+)([0-9]+)$/);return colToIndex(m[1])}
function rowFromAddr(a){const m=a.match(/^([A-Z]+)([0-9]+)$/);return +m[2]}
function normalizeAddress(r){return r.replace(/\$/g,'').toUpperCase()}
function isValidAddr(a){const m=a.match(/^([A-Z]+)([0-9]+)$/);if(!m)return false;const c=colToIndex(m[1]);const r=+m[2];return c>=1&&c<=26&&r>=1&&r<=100}
function isError(v){return v&&typeof v==='object'&&'error' in v}
function formatNumber(n){if(!isFinite(n))return'';let s=n.toPrecision(10);s=s.replace(/\.0+$/,'');s=s.replace(/(\.\d*?)0+$/,'$1');s=s.replace(/\.$/,'');if(s==="-0")s="0";return s}
function formatDisplayValue(v){if(isError(v))return v.error;if(v===null)return'';if(typeof v==='number')return formatNumber(v);if(typeof v==='boolean')return v?'TRUE':'FALSE';return String(v)}

function tokenize(str){const t=[];let i=0;while(i<str.length){const ch=str[i];if(/\s/.test(ch)){i++;continue}if(ch==='"'){let j=i+1;while(j<str.length&&str[j]!='"'){if(str[j]==='\\')j+=2;else j++}t.push({type:'STRING',value:str.slice(i+1,j)});i=j+1;continue}if(/[0-9]/.test(ch)||(ch==='.'&&/[0-9]/.test(str[i+1]))){const m=str.slice(i).match(/^[0-9]*\.?[0-9]+(?:[eE][+-]?[0-9]+)?/);t.push({type:'NUMBER',value:m[0]});i+=m[0].length;continue}const cellM=str.slice(i).match(/^\$?[A-Z]+\$?\d+/i);if(cellM){t.push({type:'CELL',value:cellM[0]});i+=cellM[0].length;continue}if(/[A-Za-z_]/.test(ch)){const m=str.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);t.push({type:'IDENT',value:m[0]});i+=m[0].length;continue}const two=str.substr(i,2);if(['>=','<=','<>'].includes(two)){t.push({type:'OP',value:two});i+=2;continue}if(['=','<','>','^','+','-','*','/','&','(',')',',',':'].includes(ch)){t.push({type:'OP',value:ch});i++;continue}i++}return t}

class Parser{constructor(t){this.tokens=t;this.pos=0}peek(o=0){return this.tokens[this.pos+o]}consume(){return this.tokens[this.pos++]}expect(type,val){const t=this.consume();if(!t||t.type!==type||(val!==undefined&&t.value!==val))throw new Error('unexpected');return t}parseExpression(){return this.parseComparison()}parseComparison(){let left=this.parseConcat();while(this.peek()&&this.peek().type==='OP'&&['=','<>','<','>','<=','>='].includes(this.peek().value)){const op=this.consume().value;const right=this.parseConcat();left={type:'Binary',op,left,right}}return left}parseConcat(){let left=this.parseAddSub();while(this.peek()&&this.peek().type==='OP'&&this.peek().value==='&'){this.consume();const right=this.parseAddSub();left={type:'Binary',op:'&',left,right}}return left}parseAddSub(){let left=this.parseMulDiv();while(this.peek()&&this.peek().type==='OP'&&['+','-'].includes(this.peek().value)){const op=this.consume().value;const right=this.parseMulDiv();left={type:'Binary',op,left,right}}return left}parseMulDiv(){let left=this.parseUnary();while(this.peek()&&this.peek().type==='OP'&&['*','/'].includes(this.peek().value)){const op=this.consume().value;const right=this.parseUnary();left={type:'Binary',op,left,right}}return left}parseUnary(){if(this.peek()&&this.peek().type==='OP'&&['+','-'].includes(this.peek().value)){const op=this.consume().value;const expr=this.parseUnary();return {type:'Unary',op,expr}}return this.parsePower()}parsePower(){let left=this.parsePrimary();if(this.peek()&&this.peek().type==='OP'&&this.peek().value==='^'){this.consume();const right=this.parsePower();left={type:'Binary',op:'^',left,right}}return left}parsePrimary(){const t=this.peek();if(!t)throw new Error('eof');if(t.type==='NUMBER'){this.consume();return {type:'Number',value:parseFloat(t.value)}}if(t.type==='STRING'){this.consume();return {type:'String',value:t.value}}if(t.type==='IDENT'){const name=t.value;this.consume();if(this.peek()&&this.peek().type==='OP'&&this.peek().value==='('){this.consume();const args=[];if(!(this.peek()&&this.peek().type==='OP'&&this.peek().value===')')){while(true){args.push(this.parseArg());if(this.peek()&&this.peek().type==='OP'&&this.peek().value===','){this.consume()}else break}}this.expect('OP',')');return {type:'FuncCall',name,args}}const up=name.toUpperCase();if(up==='TRUE')return {type:'Bool',value:true};if(up==='FALSE')return {type:'Bool',value:false};throw new Error('bad id')}if(t.type==='CELL'){this.consume();return {type:'CellRef',raw:t.value,address:normalizeAddress(t.value)}}if(t.type==='OP'&&t.value==='('){this.consume();const e=this.parseExpression();this.expect('OP',')');return e}throw new Error('bad token')}parseArg(){if(this.peek()?.type==='CELL'&&this.peek(1)?.type==='OP'&&this.peek(1).value===':'&&this.peek(2)?.type==='CELL'){const s=this.consume();this.consume();const e=this.consume();return {type:'Range',startAddr:normalizeAddress(s.value),endAddr:normalizeAddress(e.value)}}return this.parseExpression()}
}

function collectRangeDeps(sa,ea,set){const sc=colFromAddr(sa),sr=rowFromAddr(sa),ec=colFromAddr(ea),er=rowFromAddr(ea);const c1=Math.min(sc,ec),c2=Math.max(sc,ec),r1=Math.min(sr,er),r2=Math.max(sr,er);for(let c=c1;c<=c2;c++)for(let r=r1;r<=r2;r++)set.add(indexToCol(c)+r)}
function collectDeps(node,set){switch(node.type){case 'CellRef':set.add(node.address);break;case 'Range':collectRangeDeps(node.startAddr,node.endAddr,set);break;case 'Unary':collectDeps(node.expr,set);break;case 'Binary':collectDeps(node.left,set);collectDeps(node.right,set);break;case 'FuncCall':node.args.forEach(a=>collectDeps(a,set));break}}

function evalNode(node,stack){switch(node.type){case 'Number':return node.value;case 'String':return node.value;case 'Bool':return node.value;case 'CellRef':{const a=node.address;if(!isValidAddr(a))return {error:'#REF!'};return evaluateCell(a,stack)}case 'Range':{const vals=[];const s=node.startAddr,e=node.endAddr;const sc=colFromAddr(s),sr=rowFromAddr(s),ec=colFromAddr(e),er=rowFromAddr(e);const c1=Math.min(sc,ec),c2=Math.max(sc,ec),r1=Math.min(sr,er),r2=Math.max(sr,er);for(let c=c1;c<=c2;c++)for(let r=r1;r<=r2;r++){const a=indexToCol(c)+r;vals.push(evaluateCell(a,stack))}return vals}case 'Unary':{const v=evalNode(node.expr,stack);if(isError(v))return v;if(typeof v!=='number')return {error:'#VALUE!'};return node.op==='-'?-v:+v}case 'Binary':{const L=evalNode(node.left,stack);if(isError(L))return L;const R=evalNode(node.right,stack);if(isError(R))return R;let l=L,r=R;const op=node.op;if(['+','-','*','/','^'].includes(op)){if(l===null)l=0;if(r===null)r=0;if(typeof l!=='number'||typeof r!=='number')return {error:'#VALUE!'};if(op==='+')return l+r;if(op==='-')return l-r;if(op==='*')return l*r;if(op==='/'){if(r===0)return {error:'#DIV/0!'};return l/r}if(op==='^')return Math.pow(l,r)}if(op==='&'){return formatDisplayValue(L)+formatDisplayValue(R)}if(['=','<>','<','>','<=','>='].includes(op)){const cmp=(a,b)=>{const na=Number(a),nb=Number(b);if(!isNaN(na)&&!isNaN(nb))return na-nb;const sa=String(a),sb=String(b);return sa<sb?-1:sa>sb?1:0};const c=cmp(l,r);switch(op){case '=':return c===0;case '<>':return c!==0;case '<':return c<0;case '>':return c>0;case '<=':return c<=0;case '>=':return c>=0}}return {error:'#ERROR!'}}case 'FuncCall':{const name=node.name.toUpperCase();const argVals=node.args.map(a=>evalNode(a,stack));return evaluateFunction(name,argVals)}default:return {error:'#ERROR!'}}}

function evaluateFunction(name,args){const nums=[];const flat=v=>{if(isError(v))return {err:v};if(Array.isArray(v)){for(const e of v){const r=flat(e);if(r.err)return r;if(typeof e==='number'&&!isNaN(e))nums.push(e)}return {}}else{if(typeof v==='number'&&!isNaN(v))nums.push(v)}return {}};for(const a of args){const r=flat(a);if(r.err)return r.err}if(name==='SUM')return nums.reduce((a,b)=>a+b,0);if(name==='AVERAGE')return nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:0;if(name==='MIN')return nums.length?Math.min(...nums):0;if(name==='MAX')return nums.length?Math.max(...nums):0;if(name==='COUNT')return nums.length;if(name==='IF'){if(args.length<3)return {error:'#ERROR!'};const c=args[0];if(isError(c))return c;const truth=typeof c==='boolean'?c:typeof c==='number'?c!==0:!!c;return truth?args[1]:args[2]}if(name==='ABS'){const v=args[0];if(isError(v))return v;if(typeof v!=='number')return {error:'#VALUE!'};return Math.abs(v)}if(name==='ROUND'){const x=args[0],d=args[1];if(isError(x)||isError(d))return {error:'#ERROR!'};if(typeof x!=='number'||typeof d!=='number')return {error:'#VALUE!'};const f=Math.pow(10,d);return Math.round(x*f)/f}return {error:'#ERROR!'}}

function evaluateCell(addr,stack){if(valueCache.hasOwnProperty(addr))return valueCache[addr];if(stack.includes(addr)){const e={error:'#CYCLE!'};valueCache[addr]=e;return e}stack.push(addr);let res;try{const raw=content[addr]||'';if(raw===''){res=null}else if(raw.startsWith('=')){let ast=astCache[addr];if(!ast){try{const tokens=tokenize(raw.slice(1));const p=new Parser(tokens);ast=p.parseExpression();astCache[addr]=ast}catch(e){res={error:'#ERROR!'};valueCache[addr]=res;stack.pop();return res}}res=evalNode(ast,stack)}else{if(/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(raw))res=Number(raw);else if(raw.toUpperCase()==='TRUE')res=true;else if(raw.toUpperCase()==='FALSE')res=false;else res=raw}}catch(e){res={error:'#ERROR!'}}stack.pop();valueCache[addr]=res;return res}

function updateDeps(addr){const old=new Set(deps[addr]||[]);const neu=new Set();const raw=content[addr]||'';if(raw.startsWith('=')){const ast=astCache[addr];if(ast)collectDeps(ast,neu)}deps[addr]=neu;for(const d of old){if(reverseDeps[d]){reverseDeps[d].delete(addr);if(reverseDeps[d].size===0)delete reverseDeps[d]}}for(const d of neu){if(!reverseDeps[d])reverseDeps[d]=new Set();reverseDeps[d].add(addr)}}
function getAffected(start){const s=new Set();const st=[start];while(st.length){const c=st.pop();if(s.has(c))continue;s.add(c);const rev=reverseDeps[c];if(rev)for(const d of rev)st.push(d)}return s}
function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>localStorage.setItem('gridcalc_content',JSON.stringify(content)),300)}

function updateCellDisplay(addr){const cell=document.querySelector(`[data-cell="${addr}"]`);if(!cell)return;const disp=cell.querySelector('.cell-display');const v=evaluateCell(addr,[]);if(isError(v)){disp.textContent=v.error;cell.classList.add('error');cell.classList.remove('numeric','text')}else{const txt=formatDisplayValue(v);disp.textContent=txt;cell.classList.remove('error');if(typeof v==='number'||typeof v==='boolean'){cell.classList.add('numeric');cell.classList.remove('text')}else{cell.classList.add('text');cell.classList.remove('numeric')}}}
function setCellContent(addr,raw){raw=raw.trim();content[addr]=raw;delete astCache[addr];delete valueCache[addr];updateDeps(addr);const aff=getAffected(addr);aff.forEach(a=>delete valueCache[a]);aff.forEach(a=>updateCellDisplay(a));scheduleSave();if(selectedAddr===addr)formulaBar.value=raw}
function selectCell(addr){if(!isValidAddr(addr))return;const prev=document.querySelector(`[data-cell="${selectedAddr}"]`);if(prev)prev.removeAttribute('aria-selected');document.querySelectorAll('.col-header.selected,.row-header.selected').forEach(e=>e.classList.remove('selected'));const c=colFromAddr(addr),r=rowFromAddr(addr);const ch=document.querySelector(`.col-header[data-col="${c}"]`);if(ch)ch.classList.add('selected');const rh=document.querySelector(`.row-header[data-row="${r}"]`);if(rh)rh.classList.add('selected');const cell=document.querySelector(`[data-cell="${addr}"]`);if(cell)cell.setAttribute('aria-selected','true');selectedAddr=addr;addressDisplay.textContent=addr;formulaBar.value=content[addr]||'';cell&&cell.scrollIntoView({block:'nearest',inline:'nearest'})}
function highlightRefs(addr){document.querySelectorAll('.cell.ref-highlight').forEach(e=>e.classList.remove('ref-highlight'));const raw=content[addr]||'';if(!raw.startsWith('='))return;const refs=[...raw.matchAll(/(\$?[A-Z]+\$?\d+)/gi)].map(m=>normalizeAddress(m[1]));refs.forEach(r=>{if(isValidAddr(r)){const el=document.querySelector(`[data-cell="${r}"]`);if(el)el.classList.add('ref-highlight')}})}
function startEditing(addr,init=null){if(editingAddr)commitEditing();editingAddr=addr;const cell=document.querySelector(`[data-cell="${addr}"]`);const disp=cell.querySelector('.cell-display');const inp=cell.querySelector('.cell-editor');disp.style.display='none';inp.style.display='block';inp.value=init!==null?init:(content[addr]||'');inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length);highlightRefs(addr);formulaBar.value=content[addr]||''}
function commitEditing(move=null){if(!editingAddr)return;const cell=document.querySelector(`[data-cell="${editingAddr}"]`);const inp=cell.querySelector('.cell-editor');const disp=cell.querySelector('.cell-display');const raw=inp.value;setCellContent(editingAddr,raw);disp.style.display='block';inp.style.display='none';const a=editingAddr;editingAddr=null;document.querySelectorAll('.cell.ref-highlight').forEach(e=>e.classList.remove('ref-highlight'));if(move){const c=colFromAddr(a),r=rowFromAddr(a);let na;if(move==='down')na=indexToCol(c)+(r+1);if(move==='up')na=indexToCol(c)+(r-1);if(move==='right')na=indexToCol(c+1)+r;if(move==='left')na=indexToCol(c-1)+r;if(isValidAddr(na))selectCell(na);else selectCell(a)}else selectCell(a)}
function cancelEditing(){if(!editingAddr)return;const cell=document.querySelector(`[data-cell="${editingAddr}"]`);cell.querySelector('.cell-display').style.display='block';cell.querySelector('.cell-editor').style.display='none';editingAddr=null;document.querySelectorAll('.cell.ref-highlight').forEach(e=>e.classList.remove('ref-highlight'))}
function transformFormula(raw,src,tgt){if(!raw.startsWith('='))return raw;const f=raw.slice(1);const sc=colFromAddr(src),sr=rowFromAddr(src),tc=colFromAddr(tgt),tr=rowFromAddr(tgt);const dc=tc-sc,dr=tr-sr;const out=f.replace(/(\$?[A-Z]+\$?\d+)/gi,m=>{const mm=m.match(/(\$?)([A-Z]+)(\$?)(\d+)/i);if(!mm)return m;const colAbs=mm[1]==='$';const colLetters=mm[2].toUpperCase();const rowAbs=mm[3]==='$';let ci=colToIndex(colLetters);let ri=+mm[4];if(!colAbs)ci+=dc;if(!rowAbs)ri+=dr;return (colAbs?'$':'')+indexToCol(ci)+(rowAbs?'$':'')+ri});return '='+out}

function generateGrid(){const g=document.getElementById('grid');g.innerHTML='';g.style.gridTemplateColumns='50px repeat(26,120px)';g.style.gridTemplateRows='24px repeat(100,24px)';const corner=document.createElement('div');corner.className='header corner';g.appendChild(corner);for(let c=1;c<=26;c++){const h=document.createElement('div');h.className='header col-header';h.dataset.col=c;h.textContent=indexToCol(c);g.appendChild(h)}for(let r=1;r<=100;r++){const rh=document.createElement('div');rh.className='header row-header';rh.dataset.row=r;rh.textContent=r;g.appendChild(rh);for(let c=1;c<=26;c++){const addr=indexToCol(c)+r;const cell=document.createElement('div');cell.className='cell';cell.dataset.cell=addr;cell.setAttribute('role','gridcell');const disp=document.createElement('div');disp.className='cell-display';const inp=document.createElement('input');inp.className='cell-editor';inp.style.display='none';cell.appendChild(disp);cell.appendChild(inp);cell.addEventListener('click',()=>{if(editingAddr&&editingAddr!==addr)commitEditing();selectCell(addr)});cell.addEventListener('dblclick',()=>startEditing(addr));inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commitEditing(e.shiftKey?'up':'down')}else if(e.key==='Tab'){e.preventDefault();commitEditing(e.shiftKey?'left':'right')}else if(e.key==='Escape'){e.preventDefault();cancelEditing()}});g.appendChild(cell)}}}

function init(){const saved=localStorage.getItem('gridcalc_content');if(saved)Object.assign(content,JSON.parse(saved));generateGrid();for(let r=1;r<=100;r++)for(let c=1;c<=26;c++){const a=indexToCol(c)+r;const raw=content[a]||'';if(raw.startsWith('=')){try{const t=tokenize(raw.slice(1));const p=new Parser(t);astCache[a]=p.parseExpression()}catch(e){}}updateDeps(a)}selectCell('A1');for(let r=1;r<=100;r++)for(let c=1;c<=26;c++)updateCellDisplay(indexToCol(c)+r)}

document.addEventListener('keydown',e=>{if(editingAddr!==null)return;if(e.target===formulaBar)return;const k=e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k)){e.preventDefault();let c=colFromAddr(selectedAddr),r=rowFromAddr(selectedAddr);if(k==='ArrowUp')r--;if(k==='ArrowDown')r++;if(k==='ArrowLeft')c--;if(k==='ArrowRight')c++;if(c>=1&&c<=26&&r>=1&&r<=100)selectCell(indexToCol(c)+r);return}if(k==='F2'){e.preventDefault();startEditing(selectedAddr);return}if(k==='Delete'||k==='Backspace'){e.preventDefault();setCellContent(selectedAddr,'');return}if((e.ctrlKey||e.metaKey)&&k.toLowerCase()==='c'){e.preventDefault();clipboard={raw:content[selectedAddr]||'',sourceAddr:selectedAddr};return}if((e.ctrlKey||e.metaKey)&&k.toLowerCase()==='v'){e.preventDefault();if(clipboard){let raw=clipboard.raw;if(raw.startsWith('='))raw=transformFormula(raw,clipboard.sourceAddr,selectedAddr);setCellContent(selectedAddr,raw)}return}if(k.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();startEditing(selectedAddr,k)}});
formulaBar.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();setCellContent(selectedAddr,formulaBar.value)}});
init();
</script>
</body>
</html>
```
