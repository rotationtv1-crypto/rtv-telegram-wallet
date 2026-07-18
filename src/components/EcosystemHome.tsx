import { useState } from "react";
const COMPANIES = [
  {id:'rotationtv-network',name:'RotationTV Network',icon:'⚡',color:'#CCFF00',desc:'Media AI Web3'},
  {id:'rotationpay',name:'RotationPay',icon:'💳',color:'#00FF88',desc:'Multi-chain payments'},
  {id:'rotationcall',name:'RotationCall',icon:'📞',color:'#00D4FF',desc:'AI voice'},
  {id:'rtv-university',name:'RTV University',icon:'🎓',color:'#FFD700',desc:'On-chain education'},
  {id:'bigo-agency',name:'Bigo Agency',icon:'🎭',color:'#9945FF',desc:'Creative agency'},
  {id:'white-logistics',name:'White Logistics',icon:'🚚',color:'#FF6B6B',desc:'Supply chain'},
  {id:'pretrial-services',name:'Pretrial Services',icon:'⚖️',color:'#4A90D9',desc:'Justice tech'},
  {id:'emergentlabs',name:'EmergentLabs',icon:'🔬',color:'#FF00FF',desc:'Build platform'},
  {id:'openclaw',name:'OpenClaw',icon:'🦅',color:'#00FFAA',desc:'AI agents'},
];
export function EcosystemHome({ onSelect }: any) {
  const [s, setS] = useState('');
  const f = COMPANIES.filter(c => c.name.toLowerCase().includes(s.toLowerCase()));
  return <div style={{minHeight:'100vh',background:'#0A0A0A',color:'#FFF',fontFamily:'-apple-system,sans-serif',maxWidth:480,margin:'0 auto'}}>
    <div style={{padding:'14px 16px',borderBottom:'1px solid rgba(204,255,0,0.12)',position:'sticky',top:0,background:'rgba(10,10,10,0.96)',zIndex:100}}><b style={{color:'#CCFF00',fontSize:16}}>ECOSYSTEM</b></div>
    <div style={{padding:'12px 14px'}}><input value={s} onChange={e=>setS(e.target.value)} placeholder="Search..." style={{width:'100%',padding:12,borderRadius:24,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(204,255,0,0.12)',color:'#FFF',fontSize:14,outline:'none'}} /></div>
    <div style={{padding:'0 14px 20px',display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
      {f.map(c => <button key={c.id} onClick={()=>onSelect(c)} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(204,255,0,0.12)',borderRadius:16,padding:16,cursor:'pointer',textAlign:'left'}}><div style={{fontSize:24,marginBottom:8}}>{c.icon}</div><div style={{fontWeight:800,fontSize:12,color:c.color}}>{c.name}</div><div style={{fontSize:10,color:'rgba(255,255,255,0.35)'}}>{c.desc}</div></button>)}
    </div>
  </div>;
}
