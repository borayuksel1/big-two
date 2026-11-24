const RK=['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
const RKP=['3s','4s','5s','6s','7s','8s','9s','10s','Jacks','Queens','Kings','Aces','2s'];
const SG=['♣︎','♦︎','♥︎','♠︎'];
const BOTS=['Bora','Tarık','Ekin','Batu','Bozok','Ata','Arda','Anıl','Güven','Mete','Yücel'];
const mult=n=>n>=13?4:n>=10?3:n>=8?2:1;
const pts=n=>n;
const ORG_MS=30000,TURN_MS=20000;
const R=x=>x>>2, Su=x=>x&3;
const asc=(a,b)=>a-b;
const cname=x=>RK[R(x)]+SG[Su(x)];
const cmpK=(a,b)=>{for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]??-1)-(b[i]??-1);if(d)return d}return 0};
function cls(c){
  const n=c.length,s=[...c].sort(asc),r=s.map(R);
  if(n===1)return{n,t:0,k:[s[0]],name:'Single'};
  if(n===2)return r[0]===r[1]?{n,t:0,k:[s[1]],name:'Pair'}:null;
  if(n===3)return r[0]===r[2]?{n,t:0,k:[r[0]],name:'Triple'}:null;
  if(n!==5)return null;
  const fl=s.every(x=>Su(x)===Su(s[0]));
  const st=new Set(r).size===5&&r[4]-r[0]===4&&r[4]<=11;
  const cnt={};r.forEach(x=>cnt[x]=(cnt[x]||0)+1);
  const g=Object.entries(cnt).sort((a,b)=>b[1]-a[1]);
  if(st&&fl)return{n,t:5,k:[s[4]],name:'Straight flush'};
  if(g[0][1]===4)return{n,t:4,k:[+g[0][0]],name:'Four of a kind'};
  if(g[0][1]===3&&g[1][1]===2)return{n,t:3,k:[+g[0][0]],name:'Full house'};
  if(st)return{n,t:1,k:[s[4]],name:'Straight'};
  return null;
}
function beats(a,b){
  if(!a||!b||a.n!==b.n)return false;
  if(a.n===5&&a.t!==b.t)return a.t>b.t;
  return cmpK(a.k,b.k)>0;
}
function desc(k,c){
  const s=[...c].sort(asc);
  switch(k.name){
    case 'Single':return cname(s[0]);
    case 'Pair':return 'Pair of '+RKP[R(s[0])];
    case 'Triple':return 'Three '+RKP[R(s[0])];
    case 'Straight':return 'Straight to '+cname(s[4]);
    case 'Flush':return SG[Su(s[0])]+' flush, '+RK[R(s[4])]+' high';
    case 'Full house':return 'Full house, '+RKP[k.k[0]];
    case 'Four of a kind':return 'Four '+RKP[k.k[0]];
    default:return 'Straight flush to '+cname(s[4]);
  }
}
function combos(h){
  const out=[],g={};
  h.forEach(x=>{(g[R(x)]=g[R(x)]||[]).push(x);out.push([x])});
  Object.values(g).forEach(a=>{
    for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){
      out.push([a[i],a[j]]);
      for(let k=j+1;k<a.length;k++)out.push([a[i],a[j],a[k]]);
    }
  });
  const n=h.length;
  if(n>=5)for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)for(let c=b+1;c<n;c++)for(let d=c+1;d<n;d++)for(let e=d+1;e<n;e++){
    const x=[h[a],h[b],h[c],h[d],h[e]];if(cls(x))out.push(x);
  }
  return out.map(c=>({c,k:cls(c)}));
}
function canBeat(pool,L){
  const by={};pool.forEach(x=>(by[R(x)]=by[R(x)]||[]).push(x));
  const g=Object.entries(by).map(([r,a])=>[+r,a]);
  if(L.n===1)return pool.some(x=>x>L.k[0]);
  if(L.n===2)return g.some(([r,a])=>a.length>=2&&Math.max(...a)>L.k[0]);
  if(L.n===3)return g.some(([r,a])=>a.length>=3&&r>L.k[0]);
  if(pool.length<5)return false;
  const ok=(t,k)=>t>L.t||(t===L.t&&cmpK(k,L.k)>0);
  const has=new Set(pool);
  for(let s=0;s<4;s++)for(let top=4;top<=11;top++){let f=true;for(let r=top-4;r<=top;r++)if(!has.has(r*4+s)){f=false;break}if(f&&ok(5,[top*4+s]))return true}
  if(g.some(([r,a])=>a.length===4&&ok(4,[r])))return true;
  if(g.some(([r,a])=>a.length>=3&&ok(3,[r])&&g.some(([r2,b])=>r2!==r&&b.length>=2)))return true;
  for(let top=4;top<=11;top++){let f=true;for(let r=top-4;r<=top;r++)if(!by[r]){f=false;break}if(f&&ok(1,[Math.max(...by[top])]))return true}
  return false;
}
function rnd(n){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n}catch(e){return Math.floor(Math.random()*n)}}
function clean(s){return String(s||'').replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁤﻿]/g,'').trim().slice(0,16)}
function fresh(){const S={v:0,phase:'lobby',lobby:[],nick:{},bots:true,seats:[],hands:[],turn:0,last:null,passed:[],out:[],loser:-1,low:0,first:false,log:[],scores:{},acks:{},game:0,pc:0};pickBots(S);return S}
const seatOf=(S,id)=>S.seats.findIndex(s=>s.id===id);
function preview(S){
  const a=S.lobby.slice(0,4).map(id=>({id,bot:false}));
  if(S.bots){const nm=S.botNames&&S.botNames.length>=4?S.botNames:BOTS;let i=0;while(a.length<4)a.push({id:'bot:'+nm[i++],bot:true})}
  return a;
}
function logp(S,e){S.tick=(S.tick||0)+1;S.log.push(e);if(S.log.length>40)S.log.splice(0,S.log.length-40)}
function pickBots(S){
  const taken=new Set(S.lobby.map(id=>String(S.nick[id]||'').toLocaleLowerCase('tr')));
  const pool=BOTS.filter(n=>!taken.has(n.toLocaleLowerCase('tr')));
  for(let i=pool.length-1;i>0;i--){const j=rnd(i+1);[pool[i],pool[j]]=[pool[j],pool[i]]}
  S.botNames=pool.slice(0,4);
}
function deal(S){
  pickBots(S);
  const seats=preview(S).map(s=>({...s,auto:false}));
  if(seats.length<2)return 'Need at least two players';
  const d=[...Array(52).keys()];
  for(let i=51;i>0;i--){const j=rnd(i+1);[d[i],d[j]]=[d[j],d[i]]}
  S.seats=seats;
  S.hands=seats.map((_,i)=>d.slice(i*13,i*13+13).sort(asc));
  S.low=Math.min(...S.hands.map(h=>h[0]));
  S.turn=S.hands.findIndex(h=>h[0]===S.low);
  S.first=true;S.last=null;S.passed=seats.map(()=>false);S.out=[];S.loser=-1;
  S.phase='play';S.game++;S.pc++;S.prev=null;S.log=[];
  S.did=rnd(1e9)+1;S.org=true;S.orgUntil=0;S.ready=seats.map(s=>!!s.bot);S.deadline=0;S.tkey='';logp(S,{d:1,s:S.turn});
  return '';
}
function valid(S,seat,c){
  if(S.phase!=='play')return 'The hand is over';
  if(S.org)return 'Arranging hands. Play starts soon';
  if(S.turn!==seat)return 'Not your turn';
  const h=S.hands[seat];
  if(!c.length)return 'Pick some cards first';
  if(new Set(c).size!==c.length||c.some(x=>!h.includes(x)))return 'Those cards are not in your hand';
  const k=cls(c);
  if(!k)return c.length===4?'Four of a kind needs a fifth card':'Not a valid hand';
  if(S.first&&!c.includes(S.low))return 'First play must include the '+cname(S.low);
  if(S.last){
    const L=cls(S.last.c);
    if(k.n!==L.n)return 'Follow with '+(L.n===1?'a single':L.n===2?'a pair':L.n===3?'three of a kind':'a five-card hand');
    if(!beats(k,L))return 'Does not beat '+desc(L,S.last.c);
  }
  return '';
}
function adv(S,from){
  const n=S.seats.length,act=i=>S.hands[i].length>0;
  for(let k=1;k<=n;k++){const i=(from+k)%n;if(act(i)&&!S.passed[i]&&i!==S.last.s){S.turn=i;return}}
  let L=S.last.s;
  if(!act(L)){for(let k=1;k<=n;k++){const i=(L+k)%n;if(act(i)){L=i;break}}}
  S.prev={...S.last};S.last=null;S.passed=S.seats.map(()=>false);S.turn=L;logp(S,{r:1,s:L});
}
function over(S){
  const act=S.hands.map((h,i)=>h.length?i:-1).filter(i=>i>=0);
  if(act.length>1)return false;
  const L=act[0];S.loser=L;S.phase='over';
  S.seats.forEach((s,i)=>{const sc=S.scores[s.id]||(S.scores[s.id]={pen:0,loss:0,games:0});sc.games++;if(i===L){sc.loss++;sc.pen+=pts(S.hands[i].length)}});
  logp(S,{s:L,l:1,n:S.hands[L].length,p:pts(S.hands[L].length)});
  return true;
}
function play(S,seat,c){
  const e=valid(S,seat,c);if(e)return e;
  S.hands[seat]=S.hands[seat].filter(x=>!c.includes(x));
  S.last={s:seat,c:[...c].sort(asc)};S.first=false;S.pc++;
  logp(S,{s:seat,c:S.last.c});
  if(!S.hands[seat].length){S.out.push(seat);logp(S,{s:seat,o:S.out.length})}
  if(!over(S)){
    const pool=[];S.hands.forEach((h,i)=>{if(i!==seat&&h.length&&!S.passed[i])pool.push(...h)});
    if(!canBeat(pool,cls(S.last.c))){S.hands.forEach((h,i)=>{if(i!==seat&&h.length)S.passed[i]=true});S.last.auto=true;logp(S,{s:seat,a:1})}
    adv(S,seat);
  }
  return '';
}
function pass(S,seat){
  if(S.phase!=='play')return 'The hand is over';
  if(S.org)return 'Arranging hands. Play starts soon';
  if(S.turn!==seat)return 'Not your turn';
  if(!S.last)return 'You are leading, so play anything';
  S.passed[seat]=true;logp(S,{s:seat,p:1});adv(S,seat);return '';
}
function timeout(S,seat){
  logp(S,{s:seat,t:1});
  if(S.last)return pass(S,seat);
  return play(S,seat,S.first?[S.low]:[S.hands[seat][0]]);
}
function clock(S,now){
  if(S.phase!=='play')return false;
  let ch=false;
  if(S.org){
    if(!S.orgUntil){S.orgUntil=now+ORG_MS;ch=true}
    if(now<S.orgUntil)return ch;
    S.org=false;ch=true;
  }
  const key=S.game+':'+S.tick;
  if(S.tkey!==key){S.tkey=key;S.deadline=now+TURN_MS;ch=true}
  const seat=S.seats[S.turn];
  if(seat&&!seat.bot&&!seat.auto&&now>=S.deadline){timeout(S,S.turn);S.tkey=S.game+':'+S.tick;S.deadline=now+TURN_MS;ch=true}
  return ch;
}
function canDeal(S,uid){
  if(S.phase==='play'||!S.lobby.includes(uid))return false;
  if(preview(S).length<2)return false;
  if(S.phase==='lobby')return true;
  const L=S.seats[S.loser];
  if(!L||L.bot||L.auto||!S.lobby.includes(L.id))return true;
  return L.id===uid;
}
function apply(S,uid,a){
  if(!a||typeof a.t!=='string')return false;
  const i=seatOf(S,uid);
  switch(a.t){
    case 'sit':{const nm=clean(a.name);if(nm)S.nick[uid]=nm;if(!S.lobby.includes(uid)){if(S.lobby.length>=4)return !!nm;S.lobby.push(uid)}if(i>=0&&S.seats[i].auto)S.seats[i].auto=false;return true}
    case 'nick':{const nm=clean(a.name);if(!nm)return false;S.nick[uid]=nm;return true}
    case 'leave':S.lobby=S.lobby.filter(x=>x!==uid);if(i>=0&&S.phase==='play')S.seats[i].auto='left';return true;
    case 'bots':if(S.phase==='play')return false;S.bots=!!a.on;return true;
    case 'deal':return canDeal(S,uid)&&!deal(S);
    case 'lobby':if(S.phase!=='over'||!S.lobby.includes(uid))return false;S.phase='lobby';return true;
    case 'ready':if(i<0||S.phase!=='play'||!S.org||S.ready[i])return false;S.ready[i]=true;if(S.seats.every((s,k)=>S.ready[k]||s.bot||s.auto))S.org=false;return true;
    case 'back':if(i<0||!S.seats[i].auto)return false;S.seats[i].auto=false;return true;
    case 'reset':S.scores={};return true;
    case 'play':case 'pass':{
      if(i<0)return false;const was=S.seats[i].auto;S.seats[i].auto=false;
      const e=a.t==='play'?play(S,i,(Array.isArray(a.c)?a.c:[]).filter(Number.isInteger)):pass(S,i);
      return !e||!!was;
    }
  }
  return false;
}
function botPick(S,seat){
  const h=S.hands[seat];
  let list=combos(h);
  if(S.first)list=list.filter(x=>x.c.includes(S.low));
  const opp=Math.min(...S.hands.map((x,i)=>i!==seat&&x.length?x.length:99));
  const threat=opp<=2;
  const str=x=>x.k.n<5?Math.max(...x.c):52+x.k.t*14+R(Math.max(...x.c));
  const cnt={};h.forEach(x=>cnt[R(x)]=(cnt[R(x)]||0)+1);
  if(!S.last){
    const all=list.find(x=>x.c.length===h.length);if(all)return all.c;
    let cand=list;
    if(opp===1){const m=list.filter(x=>x.c.length>1);cand=m.length?m:[list.reduce((a,b)=>str(b)>str(a)?b:a)]}
    else{const lo=S.first?S.low:h[0];const m=list.filter(x=>x.c.includes(lo));if(m.length)cand=m}
    cand=[...cand].sort((a,b)=>{
      const pa=a.c.some(x=>R(x)>=11)&&a.c.length>1?1:0,pb=b.c.some(x=>R(x)>=11)&&b.c.length>1?1:0;
      return pa-pb||b.c.length-a.c.length||str(a)-str(b);
    });
    return cand[0].c;
  }
  const L=cls(S.last.c);
  let cand=list.filter(x=>x.k.n===L.n&&beats(x.k,L));
  if(!cand.length)return null;
  const fin=cand.find(x=>x.c.length===h.length);if(fin)return fin.c;
  if(threat&&L.n===1)return cand.reduce((a,b)=>str(b)>str(a)?b:a).c;
  const sc=x=>{
    let v=str(x);
    if(x.k.n<5&&x.c.some(y=>cnt[R(y)]>x.c.filter(z=>R(z)===R(y)).length))v+=12;
    if(!threat&&h.length>4&&x.c.some(y=>R(y)===12))v+=25;
    if(x.k.n===5&&x.c.some(y=>R(y)>=11))v+=6;
    return v;
  };
  cand.sort((a,b)=>sc(a)-sc(b));
  if(!threat&&h.length>5&&L.n<5&&sc(cand[0])>58)return null;
  return cand[0].c;
}

if(typeof module!=='undefined'&&module.exports)module.exports={fresh,apply,deal,play,pass,valid,botPick,cls,desc,clean,seatOf,canDeal,preview,clock};
