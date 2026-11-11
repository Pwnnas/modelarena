

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gridcalc</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;background:#f8f9fa;color:#333}
#app{display:flex;flex-direction:column;height:100vh}
#name-box-row{display:flex;align-items:center;padding:6px 10px;background:#fff;border-bottom:1px solid #e0e0e0;gap:10px}
#name-box{font-size:12px;font-weight:600;color:#555;min-width:48px;text-align:center;padding:5px 10px;background:#f0f0f0;border-radius:4px;border:1px solid #ddd}
#formula-bar{flex:1;border:1px solid #ddd;border-radius:4px;padding:5px 10px;font-size:13px;font-family:inherit;outline:none;transition:border-color .15s,box-shadow .15s;background:#fafafa}
#formula-bar:focus{border-color:#4285f4;box-shadow:0 0 0 2px rgba(66,133,244,.15);background:#fff}
#grid-container{flex:1;overflow:auto;position:relative;background:#fff}
#grid{border-collapse:collapse;table-layout:fixed}
#grid th,#grid td{padding:0;border:1px solid #e8e8e8}
#grid thead th{position:sticky;top:0;z-index:2;background:#f5f5f5;font-weight:600;font-size:11px;color:#666;text-align:center;height:26px;width:80px;min-width:80px;user-select:none;transition:background .1s}
#grid thead th.corner{left:0;z-index:3;width:44px;min-width:44px}
#grid tbody th{position:sticky;left:0;z-index:1;background:#f5f5f5;font-weight:600;font-size:11px;color:#666;text-align:center;width:44px;min-width:44px;user-select:none;transition:background .1s}
#grid td{height:26px;width:80px;min-width:80px;padding:3px 8px;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:default;transition:background .1s}
#grid td.cell-num{text-align:right}
#grid td.cell-text{text-align:left}
#grid td.cell-error{text-align:right;color:#d32f2f;background:#fff5f5;font-weight:500}
#grid td.cell-bool{text-align:right;color:#1565c0;font-weight:500}
#grid td.selected{outline:2px solid #4285f4;outline-offset:-2px;background:#e8f0fe !important;z-index:1;position:relative}
th.col-header.sel-col{background:#d4e4fc;color:#4285f4}
th.row-header.sel-row{background:#d4e4fc;color:#4285f4}
#cell-editor{position:absolute;display:none;border:2px solid #4285f4;outline:none;font-size:13px;font-family:inherit;padding:3px 8px;z-index:10;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.15);border-radius:0}
#status-bar{display:flex;align-items:center;padding:5px 14px;background:#f5f5f5;border-top:1px solid #e0e0e0;font-size:11px;color:#666;gap:20px;min-height:28px}
.stat{display:flex;gap:4px}
.stat-label{font-weight:600;color:#888}
td.ref-hl-0{box-shadow:inset 0 0 0 2px #4285f4 !important}
td.ref-hl-1{box-shadow:inset 0 0 0 2px #34a853 !important}
td.ref-hl-2{box-shadow:inset 0 0 0 2px #f9ab00 !important}
td.ref-hl-3{box-shadow:inset 0 0 0 2px #ea4335 !important}
td.ref-hl-4{box-shadow:inset 0 0 0 2px #9c27b0 !important}
td.ref-hl-5{box-shadow:inset 0 0 0 2px #00bcd4 !important}
</style>
</head>
<body>
<div id="app">
  <div id="name-box-row">
    <span id="name-box">A1</span>
    <input id="formula-bar" type="text" placeholder="Enter a value or formula" autocomplete="off" spellcheck="false">
  </div>
  <div id="grid-container">
    <table id="grid"></table>
    <input id="cell-editor" type="text" autocomplete="off" spellcheck="false">
  </div>
  <div id="status-bar">
    <span class="stat"><span class="stat-label">Sum:</span><span id="stat-sum">0</span></span>
    <span class="stat"><span class="stat-label">Count:</span><span id="stat-count">0</span></span>
    <span class="stat"><span class="stat-label">Avg:</span><span id="stat-avg">0</span></span>
  </div>
</div>
<script>
(function(){
"use strict";

const COLS=26,ROWS=100;
const COLS_STR="ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// State
let cells={};
let computed={};
let dependencies={};
let dependents={};
let selectedCell="A1";
let editingCell=null;
let editingOriginal="";
let clipboard=null;
let clipboardSource=null;

// DOM refs
const gridContainer=document.getElementById("grid-container");
const gridTable=document.getElementById("grid");
const cellEditor=document.getElementById("cell-editor");
const formulaBar=document.getElementById("formula-bar");
const nameBox=document.getElementById("name-box");
const statSum=document.getElementById("stat-sum");
const statCount=document.getElementById("stat-count");
const statAvg=document.getElementById("stat-avg");

// Utility
function colToNum(c){return COLS_STR.indexOf(c.toUpperCase())+1}
function numToCol(n){return COLS_STR[n-1]||""}
function makeAddr(col,row){return col.toUpperCase()+row}
function parseAddr(addr){
  let m=addr.toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if(!m)return null;
  return{col:m[1],row:parseInt(m[2],10)};
}
function isValidAddr(addr){
  let p=parseAddr(addr);
  if(!p)return false;
  if(p.row<1||p.row>ROWS)return false;
  if(p.col.length>1)return false;
  if(colToNum(p.col[0])>COLS)return false;
  return true;
}
function addrInBounds(col,row){return col>=1&&col<=COLS&&row>=1&&row<=ROWS}

function formatNumber(n){
  if(n===0)return"0";
  if(!isFinite(n))return String(n);
  let s=n.toPrecision(10);
  if(s.indexOf("e")!==-1||s.indexOf("E")!==-1){
    let parts=s.split("e");
    let mantissa=parts[0];
    let exp=parseInt(parts[1],10);
    if(exp>0){
      let dotIdx=mantissa.indexOf(".");
      if(dotIdx===-1){s=mantissa+"0".repeat(exp)}
      else{
        let intPart=mantissa.slice(0,dotIdx);
        let fracPart=mantissa.slice(dotIdx+1);
        let shift=Math.min(exp,fracPart.length);
        s=intPart+fracPart.slice(0,shift)+"0".repeat(exp-shift)+fracPart.slice(shift);
      }
    }else{
      let zeros=-exp-1;
      s="0."+"0".repeat(zeros)+mantissa.replace(".","");
    }
  }else{
    if(s.indexOf(".")!==-1){
      s=s.replace(/0+$/,"");
      if(s.endsWith("."))s=s.slice(0,-1);
    }
  }
  return s;
}

function formatValue(v){
  if(v===null||v===undefined)return"";
  if(typeof v==="number")return formatNumber(v);
  if(typeof v==="string")return v;
  if(typeof v==="boolean")return v?"TRUE":"FALSE";
  return String(v);
}

// Formula Engine
class FormulaError extends Error{
  constructor(code){super(code);this.code=code}
}

function tokenize(input){
  let tokens=[];
  let i=0;
  while(i<input.length){
    let ch=input[i];
    if(ch===" "||ch==="\t"||ch==="\n"||ch==="\r"){i++;continue}
    // Number
    if(/[0-9]/.test(ch)||(ch==="."&&i+1<input.length&&/[0-9]/.test(input[i+1]))){
      let m=input.slice(i).match(/^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/);
      if(m){tokens.push({type:"NUM",value:parseFloat(m[0])});i+=m[0].length;continue}
    }
    // String
    if(ch==='"'){
      let end=input.indexOf('"',i+1);
      if(end===-1)throw new FormulaError("#ERROR!");
      tokens.push({type:"STR",value:input.slice(i+1,end)});
      i=end+1;continue;
    }
    // Cell reference or identifier
    if(/[A-Za-z$]/.test(ch)){
      let m=input.slice(i).match(/^(\$?)([A-Za-z]{1,2})(\$?)(\d+)/);
      if(m){
        let col=m[2].toUpperCase();
        let row=parseInt(m[4],10);
        if(col.length>1||colToNum(col[0])>COLS){
          tokens.push({type:"REF",col:m[2].toUpperCase(),row:row,colAbs:m[1]==="$",rowAbs:m[3]==="$",invalid:true});
        }else{
          tokens.push({type:"REF",col:col,row:row,colAbs:m[1]==="$",rowAbs:m[3]==="$",invalid:false});
        }
        i+=m[0].length;continue;
      }
      m=input.slice(i).match(/^[A-Za-z][A-Za-z0-9]*/);
      if(m){tokens.push({type:"IDENT",value:m[0].toUpperCase()});i+=m[0].length;continue}
    }
    // Two-char operators
    let two=input.substr(i,2);
    if(two===">="||two==="<="||two==="<>"){
      tokens.push({type:"OP",value:two});i+=2;continue;
    }
    if("-+*/^&=<>".indexOf(ch)!==-1){
      tokens.push({type:"OP",value:ch});i++;continue;
    }
    if(ch==="("){tokens.push({type:"LP"});i++;continue}
    if(ch===")"){tokens.push({type:"RP"});i++;continue}
    if(ch===","){tokens.push({type:"COMMA"});i++;continue}
    if(ch===":"){tokens.push({type:"COLON"});i++;continue}
    throw new FormulaError("#ERROR!");
  }
  return tokens;
}

function parseFormula(tokens){
  let pos=0;
  function peek(){return tokens[pos]}
  function next(){return tokens[pos++]}
  function expect(type){
    let t=next();
    if(!t||t.type!==type)throw new FormulaError("#ERROR!");
    return t;
  }
  function isOp(v){return peek()&&peek().type==="OP"&&peek().value===v}
  function isOpIn(arr){return peek()&&peek().type==="OP"&&arr.indexOf(peek().value)!==-1}

  function parseComparison(){
    let left=parseConcat();
    while(isOpIn(["=","<>","<",">","<=",">="])){
      let op=next().value;
      let right=parseConcat();
      left={type:"BINOP",op:op,left:left,right:right};
    }
    return left;
  }
  function parseConcat(){
    let left=parseAddSub();
    while(isOp("&")){
      next();
      let right=parseAddSub();
      left={type:"BINOP",op:"&",left:left,right:right};
    }
    return left;
  }
  function parseAddSub(){
    let left=parseMulDiv();
    while(isOpIn(["+","-"])){
      let op=next().value;
      let right=parseMulDiv();
      left={type:"BINOP",op:op,left:left,right:right};
    }
    return left;
  }
  function parseMulDiv(){
    let left=parseUnary();
    while(isOpIn(["*","/"])){
      let op=next().value;
      let right=parseUnary();
      left={type:"BINOP",op:op,left:left,right:right};
    }
    return left;
  }
  function parseUnary(){
    if(isOpIn(["+","-"])){
      let op=next().value;
      let operand=parseUnary();
      return{type:"UNARY",op:op,operand:operand};
    }
    return parsePower();
  }
  function parsePower(){
    let left=parsePrimary();
    if(isOp("^")){
      next();
      let right=parseUnary();
      left={type:"BINOP",op:"^",left:left,right:right};
    }
    return left;
  }
  function parsePrimary(){
    let t=peek();
    if(!t)throw new FormulaError("#ERROR!");
    if(t.type==="NUM"){next();return{type:"NUM",value:t.value}}
    if(t.type==="STR"){next();return{type:"STR",value:t.value}}
    if(t.type==="IDENT"){
      next();
      if(t.value==="TRUE")return{type:"BOOL",value:true};
      if(t.value==="FALSE")return{type:"BOOL",value:false};
      let fnNames=["SUM","AVERAGE","MIN","MAX","COUNT","IF","ABS","ROUND"];
      if(fnNames.indexOf(t.value)===-1)throw new FormulaError("#ERROR!");
      expect("LP");
      let args=[];
      if(!peek()||peek().type!=="RP"){
        args.push(parseComparison());
        while(peek()&&peek().type==="COMMA"){next();args.push(parseComparison())}
      }
      expect("RP");
      return{type:"FUNC",name:t.value,args:args};
    }
    if(t.type==="REF"){
      next();
      if(peek()&&peek().type==="COLON"){
        next();
        let endT=expect("REF");
        return{type:"RANGE",start:t,end:endT};
      }
      return{type:"REF",col:t.col,row:t.row,colAbs:t.colAbs,rowAbs:t.rowAbs,invalid:t.invalid};
    }
    if(t.type==="LP"){
      next();
      let expr=parseComparison();
      expect("RP");
      return expr;
    }
    throw new FormulaError("#ERROR!");
  }

  if(tokens.length===0)throw new FormulaError("#ERROR!");
  let ast=parseComparison();
  if(pos!==tokens.length)throw new FormulaError("#ERROR!");
  return ast;
}

function evaluate(ast){
  switch(ast.type){
    case"NUM":return ast.value;
    case"STR":return ast.value;
    case"BOOL":return ast.value;
    case"REF":{
      if(ast.invalid||!addrInBounds(colToNum(ast.col),ast.row))throw new FormulaError("#REF!");
      let addr=makeAddr(ast.col,ast.row);
      let val=computed[addr];
      if(val===undefined)return 0;
      if(val.type==="error")throw new FormulaError(val.code);
      if(val.type==="empty")return 0;
      return val.value;
    }
    case"RANGE":{
      let s=ast.start,e=ast.end;
      if(s.invalid||e.invalid||!addrInBounds(colToNum(s.col),s.row)||!addrInBounds(colToNum(e.col),e.row))throw new FormulaError("#REF!");
      let sc=colToNum(s.col),sr=s.row,ec=colToNum(e.col),er=e.row;
      let c1=Math.min(sc,ec),c2=Math.max(sc,ec),r1=Math.min(sr,er),r2=Math.max(sr,er);
      let vals=[];
      for(let r=r1;r<=r2;r++){
        for(let c=c1;c<=c2;c++){
          let addr=makeAddr(numToCol(c),r);
          let val=computed[addr];
          if(val===undefined)vals.push(0);
          else if(val.type==="error")throw new FormulaError(val.code);
          else if(val.type==="empty")vals.push(null);
          else vals.push(val.value);
        }
      }
      return{__range:true,values:vals};
    }
    case"UNARY":{
      let v=evaluate(ast.operand);
      if(typeof v==="string"&&!ast.operand.__isString)throw new FormulaError("#VALUE!");
      if(typeof v==="string")throw new FormulaError("#VALUE!");
      if(typeof v==="boolean")v=v?1:0;
      if(ast.op==="-")return-v;
      return v;
    }
    case"BINOP":{
      let l=evaluate(ast.left);
      let r=evaluate(ast.right);
      if(ast.op==="&"){
        return formatValue(l)+formatValue(r);
      }
      if(ast.op==="="||ast.op==="<>"||ast.op==="<"||ast.op===">"||ast.op==="<="||ast.op===">="){
        let res;
        if(ast.op==="=")res=valuesEqual(l,r);
        else if(ast.op==="<>")res=!valuesEqual(l,r);
        else if(ast.op==="<")res=compareVals(l,r)<0;
        else if(ast.op===">")res=compareVals(l,r)>0;
        else if(ast.op==="<=")res=compareVals(l,r)<=0;
        else res=compareVals(l,r)>=0;
        return res;
      }
      // Arithmetic
      if(typeof l==="string"||typeof r==="string")throw new FormulaError("#VALUE!");
      if(typeof l==="boolean")l=l?1:0;
      if(typeof r==="boolean")r=r?1:0;
      switch(ast.op){
        case"+":return l+r;
        case"-":return l-r;
        case"*":return l*r;
        case"/":if(r===0)throw new FormulaError("#DIV/0!");return l/r;
        case"^":return Math.pow(l,r);
      }
    }
    case"FUNC":{
      let name=ast.name;
      let args=ast.args;
      switch(name){
        case"SUM":{
          let sum=0;
          for(let a of args){
            let v=evaluate(a);
            if(v.__range){for(let x of v.values){if(typeof x==="number")sum+=x}}
            else if(typeof v==="number")sum+=v;
          }
          return sum;
        }
        case"AVERAGE":{
          let sum=0,cnt=0;
          for(let a of args){
            let v=evaluate(a);
            if(v.__range){for(let x of v.values){if(typeof x==="number"){sum+=x;cnt++}}}
            else if(typeof v==="number"){sum+=v;cnt++}
          }
          if(cnt===0)throw new FormulaError("#DIV/0!");
          return sum/cnt;
        }
        case"MIN":{
          let min=Infinity;
          for(let a of args){
            let v=evaluate(a);
            if(v.__range){for(let x of v.values){if(typeof x==="number")min=Math.min(min,x)}}
            else if(typeof v==="number")min=Math.min(min,v);
          }
          if(min===Infinity)throw new FormulaError("#DIV/0!");
          return min;
        }
        case"MAX":{
          let max=-Infinity;
          for(let a of args){
            let v=evaluate(a);
            if(v.__range){for(let x of v.values){if(typeof x==="number")max=Math.max(max,x)}}
            else if(typeof v==="number")max=Math.max(max,v);
          }
          if(max===-Infinity)throw new FormulaError("#DIV/0!");
          return max;
        }
        case"COUNT":{
          let cnt=0;
          for(let a of args){
            let v=evaluate(a);
            if(v.__range){for(let x of v.values){if(typeof x==="number")cnt++}}
            else if(typeof v==="number")cnt++;
          }
          return cnt;
        }
        case"IF":{
          if(args.length<2)throw new FormulaError("#ERROR!");
          let cond=evaluate(args[0]);
          if(typeof cond==="boolean")cond=cond;
          else if(typeof cond==="number")cond=cond!==0;
          else if(typeof cond==="string")cond=false;
          if(cond)return evaluate(args[1]);
          if(args.length>=3)return evaluate(args[2]);
          return false;
        }
        case"ABS":{
          if(args.length<1)throw new FormulaError("#ERROR!");
          let v=evaluate(args[0]);
          if(typeof v==="string")throw new FormulaError("#VALUE!");
          if(typeof v==="boolean")v=v?1:0;
          return Math.abs(v);
        }
        case"ROUND":{
          if(args.length<1)throw new FormulaError("#ERROR!");
          let v=evaluate(args[0]);
          if(typeof v==="string")throw new FormulaError("#VALUE!");
          if(typeof v==="boolean")v=v?1:0;
          let digits=args.length>=2?evaluate(args[1]):0;
          if(typeof digits==="boolean")digits=digits?1:0;
          let factor=Math.pow(10,digits);
          return Math.round(v*factor)/factor;
        }
      }
      throw new FormulaError("#ERROR!");
    }
  }
  return 0;
}

function valuesEqual(a,b){
  if(typeof a==="number"&&typeof b==="number")return a===b;
  if(typeof a==="string"&&typeof b==="string")return a===b;
  if(typeof a==="boolean"&&typeof b==="boolean")return a===b;
  if((typeof a==="number"&&typeof b==="boolean")||(typeof a==="boolean"&&typeof b==="number")){
    return(a?1:0)===(b?1:0);
  }
  return false;
}
function compareVals(a,b){
  if(typeof a==="number"&&typeof b==="number")return a-b;
  if(typeof a==="string"&&typeof b==="string")return a<b?-1:a>b?1:0;
  if(typeof a==="boolean"&&typeof b==="boolean")return(a?1:0)-(b?1:0);
  if((typeof a==="number"&&typeof b==="boolean")||(typeof a==="boolean"&&typeof b==="number")){
    return(a?1:0)-(b?1:0);
  }
  return String(a)<String(b)?-1:String(a)>String(b)?1:0;
}

function extractRefs(ast,refs){
  if(!refs)refs=[];
  switch(ast.type){
    case"REF":
      if(!ast.invalid&&addrInBounds(colToNum(ast.col),ast.row)){
        refs.push(makeAddr(ast.col,ast.row));
      }
      break;
    case"RANGE":{
      let s=ast.start,e=ast.end;
      if(!s.invalid&&!e.invalid&&addrInBounds(colToNum(s.col),s.row)&&addrInBounds(colToNum(e.col),e.row)){
        let sc=colToNum(s.col),sr=s.row,ec=colToNum(e.col),er=e.row;
        let c1=Math.min(sc,ec),c2=Math.max(sc,ec),r1=Math.min(sr,er),r2=Math.max(sr,er);
        for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++)refs.push(makeAddr(numToCol(c),r));
      }
      break;
    }
    case"UNARY":extractRefs(ast.operand,refs);break;
    case"BINOP":extractRefs(ast.left,refs);extractRefs(ast.right,refs);break;
    case"FUNC":for(let a of ast.args)extractRefs(a,refs);break;
  }
  return refs;
}

function computeCell(addr){
  let content=cells[addr]||"";
  if(content===""){
    computed[addr]={type:"empty",value:null};
    return;
  }
  if(content[0]==="="){
    let formula=content.slice(1);
    try{
      let tokens=tokenize(formula);
      let ast=parseFormula(tokens);
      let val=evaluate(ast);
      if(val.__range)val=0;
      if(typeof val==="number"){
        if(isNaN(val))throw new FormulaError("#ERROR!");
        computed[addr]={type:"number",value:val};
      }else if(typeof val==="string"){
        computed[addr]={type:"string",value:val};
      }else if(typeof val==="boolean"){
        computed[addr]={type:"boolean",value:val};
      }else{
        computed[addr]={type:"number",value:0};
      }
    }catch(e){
      if(e instanceof FormulaError){
        computed[addr]={type:"error",code:e.code};
      }else{
        computed[addr]={type:"error",code:"#ERROR!"};
      }
    }
  }else if(isNumber(content)){
    computed[addr]={type:"number",value:parseFloat(content)};
  }else if(content.toUpperCase()==="TRUE"){
    computed[addr]={type:"boolean",value:true};
  }else if(content.toUpperCase()==="FALSE"){
    computed[addr]={type:"boolean",value:false};
  }else{
    computed[addr]={type:"string",value:content};
  }
}

function isNumber(s){
  if(s===""||s===null)return false;
  if(s==="TRUE"||s==="FALSE"||s==="true"||s==="false")return false;
  return!isNaN(Number(s))&&isFinite(Number(s));
}

function updateDependencies(addr){
  if(!dependencies[addr])dependencies[addr]=new Set();
  if(!dependents[addr])dependents[addr]=new Set();
  let oldDeps=dependencies[addr];
  for(let d of oldDeps){
    if(dependents[d])dependents[d].delete(addr);
  }
  oldDeps.clear();
  let content=cells[addr]||"";
  if(content[0]==="="){
    let formula=content.slice(1);
    try{
      let tokens=tokenize(formula);
      let ast=parseFormula(tokens);
      let refs=extractRefs(ast);
      for(let r of refs){
        dependencies[addr].add(r);
        if(!dependents[r])dependents[r]=new Set();
        dependents[r].add(addr);
      }
    }catch(e){/* no deps if formula is broken */}
  }
}

function recalculate(changedAddr){
  // Find all affected cells
  let affected=new Set();
  let stack=[changedAddr];
  while(stack.length>0){
    let c=stack.pop();
    if(affected.has(c))continue;
    affected.add(c);
    let deps=dependents[c];
    if(deps){
      for(let d of deps)stack.push(d);
    }
  }
  // Topological sort with cycle detection
  let inDegree=new Map();
  for(let c of affected)inDegree.set(c,0);
  for(let c of affected){
    let deps=dependencies[c];
    if(deps){
      for(let d of deps){
        if(affected.has(d)){
          inDegree.set(c,inDegree.get(c)+1);
        }
      }
    }
  }
  let queue=[];
  for(let c of affected){
    if(inDegree.get(c)===0)queue.push(c);
  }
  let order=[];
  let processed=new Set();
  while(queue.length>0){
    let c=queue.shift();
    order.push(c);
    processed.add(c);
    let deps=dependents[c];
    if(deps){
      for(let d of deps){
        if(affected.has(d)){
          inDegree.set(d,inDegree.get(d)-1);
          if(inDegree.get(d)===0)queue.push(d);
        }
      }
    }
  }
  // Cycle cells
  let cycleCells=new Set();
  for(let c of affected){
    if(!processed.has(c))cycleCells.add(c);
  }
  // Mark cycle cells
  for(let c of cycleCells){
    computed[c]={type:"error",code:"#CYCLE!"};
    updateCellDisplay(c);
  }
  // Recalculate in order
  for(let c of order){
    computeCell(c);
    updateCellDisplay(c);
  }
}

// UI
function buildGrid(){
  let html="<thead><tr><th class='corner'></th>";
  for(let c=0;c<COLS;c++){
    let col=String.fromCharCode(65+c);
    html+="<th class='col-header' data-col='"+col+"'>"+col+"</th>";
  }
  html+="</tr></thead><tbody>";
  for(let r=1;r<=ROWS;r++){
    html+="<tr><th class='row-header' data-row='"+r+"'>"+r+"</th>";
    for(let c=0;c<COLS;c++){
      let col=String.fromCharCode(65+c);
      let addr=col+r;
      html+="<td data-cell='"+addr+"' class='cell'></td>";
    }
    html+="</tr>";
  }
  html+="</tbody>";
  gridTable.innerHTML=html;
}

function getCellEl(addr){
  return gridTable.querySelector("[data-cell='"+addr+"']");
}

function updateCellDisplay(addr){
  let el=getCellEl(addr);
  if(!el)return;
  let val=computed[addr];
  el.className="cell";
  if(val===undefined){
    el.textContent="";
    return;
  }
  if(val.type==="empty"){
    el.textContent="";
  }else if(val.type==="number"){
    el.textContent=formatNumber(val.value);
    el.classList.add("cell-num");
  }else if(val.type==="string"){
    el.textContent=val.value;
    el.classList.add("cell-text");
  }else if(val.type==="boolean"){
    el.textContent=val.value?"TRUE":"FALSE";
    el.classList.add("cell-bool");
  }else if(val.type==="error"){
    el.textContent=val.code;
    el.classList.add("cell-error");
    el.title=val.code;
  }
  if(addr===selectedCell)el.classList.add("selected");
}

function selectCell(addr){
  if(!isValidAddr(addr))return;
  let old=selectedCell;
  if(old===addr)return;
  let oldEl=getCellEl(old);
  if(oldEl)oldEl.classList.remove("selected");
  // Remove old header highlights
  let oldP=parseAddr(old);
  if(oldP){
    let oldColH=gridTable.querySelector("th[data-col='"+oldP.col+"']");
    if(oldColH)oldColH.classList.remove("sel-col");
    let oldRowH=gridTable.querySelector("th[data-row='"+oldP.row+"']");
    if(oldRowH)oldRowH.classList.remove("sel-row");
  }
  selectedCell=addr;
  let el=getCellEl(addr);
  if(el){
    el.classList.add("selected");
    el.scrollIntoView({block:"nearest",inline:"nearest"});
  }
  let p=parseAddr(addr);
  if(p){
    let colH=gridTable.querySelector("th[data-col='"+p.col+"']");
    if(colH)colH.classList.add("sel-col");
    let rowH=gridTable.querySelector("th[data-row='"+p.row+"']");
    if(rowH)rowH.classList.add("sel-row");
  }
  nameBox.textContent=addr;
  let content=cells[addr]||"";
  formulaBar.value=content;
  updateStatusBar();
}

function moveSelection(dc,dr){
  let p=parseAddr(selectedCell);
  let nc=colToNum(p.col)+dc;
  let nr=p.row+dr;
  if(nc<1||nc>COLS||nr<1||nr>ROWS)return;
  selectCell(makeAddr(numToCol(nc),nr));
}

function startEditing(addr,text){
  if(editingCell)commitEdit();
  editingCell=addr;
  editingOriginal=cells[addr]||"";
  let el=getCellEl(addr);
  if(!el)return;
  let rect=el.getBoundingClientRect();
  let containerRect=gridContainer.getBoundingClientRect();
  cellEditor.style.left=(rect.left-containerRect.left+gridContainer.scrollLeft)+"px";
  cellEditor.style.top=(rect.top-containerRect.top+gridContainer.scrollTop)+"px";
  cellEditor.style.width=rect.width+"px";
  cellEditor.style.height=rect.height+"px";
  cellEditor.style.display="block";
  cellEditor.value=text;
  cellEditor.focus();
  cellEditor.setSelectionRange(text.length,text.length);
  highlightRefs(text);
}

function commitEdit(){
  if(!editingCell)return;
  let addr=editingCell;
  let newText=cellEditor.value;
  cellEditor.style.display="none";
  editingCell=null;
  clearRefHighlights();
  setCellContent(addr,newText);
}

function cancelEdit(){
  if(!editingCell)return;
  cellEditor.style.display="none";
  editingCell=null;
  clearRefHighlights();
  updateCellDisplay(selectedCell);
}

function setCellContent(addr,content){
  if(content===(cells[addr]||""))return;
  cells[addr]=content;
  updateDependencies(addr);
  recalculate(addr);
  updateCellDisplay(addr);
  nameBox.textContent=addr;
  formulaBar.value=cells[addr]||"";
  updateStatusBar();
  save();
}

function updateStatusBar(){
  let val=computed[selectedCell];
  if(val&&val.type==="number"){
    statSum.textContent=formatNumber(val.value);
    statCount.textContent="1";
    statAvg.textContent=formatNumber(val.value);
  }else{
    statSum.textContent="0";
    statCount.textContent="0";
    statAvg.textContent="0";
  }
}

function highlightRefs(text){
  clearRefHighlights();
  if(!text||text[0]!=="=")return;
  let formula=text.slice(1);
  try{
    let tokens=tokenize(formula);
    let ast=parseFormula(tokens);
    let refs=extractRefs(ast);
    let colors=["ref-hl-0","ref-hl-1","ref-hl-2","ref-hl-3","ref-hl-4","ref-hl-5"];
    let uniqueRefs=[];
    for(let r of refs){if(uniqueRefs.indexOf(r)===-1)uniqueRefs.push(r)}
    for(let i=0;i<uniqueRefs.length&&i<6;i++){
      let el=getCellEl(uniqueRefs[i]);
      if(el)el.classList.add(colors[i]);
    }
  }catch(e){/* ignore parse errors during editing */}
}

function clearRefHighlights(){
  let els=gridTable.querySelectorAll(".ref-hl-0,.ref-hl-1,.ref-hl-2,.ref-hl-3,.ref-hl-4,.ref-hl-5");
  for(let el of els){
    el.classList.remove("ref-hl-0","ref-hl-1","ref-hl-2","ref-hl-3","ref-hl-4","ref-hl-5");
  }
}

// Copy/Paste
function copyCell(addr){
  clipboard=cells[addr]||"";
  clipboardSource=addr;
}

function pasteCell(addr){
  if(clipboard===null)return;
  let content=clipboard;
  if(clipboardSource&&content[0]==="="){
    let src=parseAddr(clipboardSource);
    let dst=parseAddr(addr);
    let rowOff=dst.row-src.row;
    let colOff=colToNum(dst.col)-colToNum(src.col);
    content=shiftFormula(content,rowOff,colOff);
  }
  setCellContent(addr,content);
}

function shiftFormula(formula,rowOff,colOff){
  return formula.replace(/(\$?)([A-Za-z]{1,2})(\$?)(\d+)/g,function(m,colD,col,rowD,row){
    let colAbs=colD==="$";
    let rowAbs=rowD==="$";
    let c=colToNum(col);
    let r=parseInt(row,10);
    let nc=colAbs?c:c+colOff;
    let nr=rowAbs?r:r+rowOff;
    if(nc<1||nc>COLS||nr<1||nr>ROWS){
      // Out of bounds after shift - keep the reference, evaluator will catch it
      // Actually we need to keep it valid enough for the regex to work
      nc=Math.max(1,Math.min(COLS,nc));
      nr=Math.max(1,Math.min(ROWS,nr));
    }
    return(colAbs?"$":"")+numToCol(nc)+(rowAbs?"$":"")+nr;
  });
}

// Persistence
function save(){
  try{
    localStorage.setItem("gridcalc",JSON.stringify(cells));
  }catch(e){}
}

function load(){
  try{
    let data=localStorage.getItem("gridcalc");
    if(data){
      cells=JSON.parse(data);
    }
  }catch(e){cells={}}
}

// Event handlers
function onCellClick(e){
  let td=e.target.closest("td[data-cell]");
  if(!td)return;
  let addr=td.getAttribute("data-cell");
  if(editingCell){
    commitEdit();
  }
  selectCell(addr);
}

function onCellDblClick(e){
  let td=e.target.closest("td[data-cell]");
  if(!td)return;
  let addr=td.getAttribute("data-cell");
  selectCell(addr);
  let content=cells[addr]||"";
  startEditing(addr,content);
}

function onKeyDown(e){
  // If formula bar is focused, handle separately
  if(document.activeElement===formulaBar){
    if(e.key==="Enter"){
      e.preventDefault();
      let content=formulaBar.value;
      setCellContent(selectedCell,content);
      moveSelection(0,1);
    }
    return;
  }
  // If cell editor is focused, handle editing
  if(document.activeElement===cellEditor){
    if(e.key==="Enter"){
      e.preventDefault();
      let shift=e.shiftKey;
      commitEdit();
      if(shift)moveSelection(0,-1);
      else moveSelection(0,1);
    }else if(e.key==="Tab"){
      e.preventDefault();
      let shift=e.shiftKey;
      commitEdit();
      if(shift)moveSelection(-1,0);
      else moveSelection(1,0);
    }else if(e.key==="Escape"){
      e.preventDefault();
      cancelEdit();
    }
    return;
  }
  // Grid is focused
  switch(e.key){
    case"ArrowUp":e.preventDefault();moveSelection(0,-1);break;
    case"ArrowDown":e.preventDefault();moveSelection(0,1);break;
    case"ArrowLeft":e.preventDefault();moveSelection(-1,0);break;
    case"ArrowRight":e.preventDefault();moveSelection(1,0);break;
    case"Delete":
    case"Backspace":
      e.preventDefault();
      setCellContent(selectedCell,"");
      break;
    case"F2":
      e.preventDefault();
      startEditing(selectedCell,cells[selectedCell]||"");
      break;
    case"Enter":
      e.preventDefault();
      moveSelection(0,1);
      break;
    case"Tab":
      e.preventDefault();
      if(e.shiftKey)moveSelection(-1,0);
      else moveSelection(1,0);
      break;
    default:
      // Printable character starts editing
      if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
        e.preventDefault();
        startEditing(selectedCell,e.key);
      }
      break;
  }
}

function onFormulaBarKeydown(e){
  if(e.key==="Enter"){
    e.preventDefault();
    let content=formulaBar.value;
    setCellContent(selectedCell,content);
    moveSelection(0,1);
  }
}

function onFormulaBarInput(){
  // Live update the selected cell preview (optional - skip for simplicity)
}

function onCopy(e){
  if(e.ctrlKey||e.metaKey){
    e.preventDefault();
    copyCell(selectedCell);
  }
}

function onPaste(e){
  if(e.ctrlKey||e.metaKey){
    e.preventDefault();
    pasteCell(selectedCell);
  }
}

// Init
function init(){
  load();
  buildGrid();
  // Compute all cells
  for(let r=1;r<=ROWS;r++){
    for(let c=0;c<COLS;c++){
      let addr=makeAddr(String.fromCharCode(65+c),r);
      computeCell(addr);
      updateCellDisplay(addr);
    }
  }
  // Build dependency graph
  for(let addr in cells){
    updateDependencies(addr);
  }
  // Select A1
  selectCell("A1");
  // Event listeners
  gridTable.addEventListener("click",onCellClick);
  gridTable.addEventListener("dblclick",onCellDblClick);
  document.addEventListener("keydown",onKeyDown);
  formulaBar.addEventListener("keydown",onFormulaBarKeydown);
  formulaBar.addEventListener("input",onFormulaBarInput);
  document.addEventListener("copy",onCopy);
  document.addEventListener("paste",onPaste);
  // Keep editor positioned when scrolling
  gridContainer.addEventListener("scroll",function(){
    if(editingCell){
      let el=getCellEl(editingCell);
      if(el){
        let rect=el.getBoundingClientRect();
        let containerRect=gridContainer.getBoundingClientRect();
        cellEditor.style.left=(rect.left-containerRect.left+gridContainer.scrollLeft)+"px";
        cellEditor.style.top=(rect.top-containerRect.top+gridContainer.scrollTop)+"px";
      }
    }
  });
  // Update editor position on window resize
  window.addEventListener("resize",function(){
    if(editingCell){
      let el=getCellEl(editingCell);
      if(el){
        let rect=el.getBoundingClientRect();
        let containerRect=gridContainer.getBoundingClientRect();
        cellEditor.style.left=(rect.left-containerRect.left+gridContainer.scrollLeft)+"px";
        cellEditor.style.top=(rect.top-containerRect.top+gridContainer.scrollTop)+"px";
      }
    }
  });
}

init();
})();
</script>
</body>
</html>
```