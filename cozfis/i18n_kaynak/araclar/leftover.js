const fs=require('fs'),acorn=require('acorn'),walk=require('acorn-walk');
const src=fs.readFileSync(process.argv[2],'utf8');const ast=acorn.parse(src,{ecmaVersion:'latest',locations:true});
const qaStart=src.indexOf('const QA = {');
const TR=/[çğıöşüÇĞİÖŞÜ]/;const res=[];
walk.fullAncestor(ast,(n,st,anc)=>{let t=null;if(n.type==='Literal'&&typeof n.value==='string')t=n.value;else if(n.type==='TemplateLiteral')t=n.quasis.map(q=>q.value.cooked).join('${}');else return;
 if(!TR.test(t))return;const inQA=n.start>qaStart||anc.some(a=>a.type==='AssignmentExpression'&&src.slice(a.start,a.start+12)==='QA.v4Tests =');
 const p=anc[anc.length-2];let ctx='';if(p&&p.type==='CallExpression'){const c=p.callee;ctx=c.type==='MemberExpression'?(c.object.name||'')+'.'+(c.property.name||''):c.name;}else if(p&&p.type==='NewExpression')ctx='new '+p.callee.name;else if(p&&p.type==='MemberExpression')ctx='member';else if(p)ctx=p.type;
 res.push({line:n.loc.start.line,qa:inQA,ctx,t:t.slice(0,70)});});
const nonqa=res.filter(r=>!r.qa);console.log('total',res.length,'qa',res.length-nonqa.length,'nonqa',nonqa.length);for(const r of nonqa)console.log(r.line,r.ctx,JSON.stringify(r.t));
