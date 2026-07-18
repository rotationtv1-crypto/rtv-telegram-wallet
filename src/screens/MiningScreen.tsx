import { useState } from "react";
const ACTS = [{t:'stream_hour',l:'Stream Hour',i:'📹',r:25},{t:'tip_sent',l:'Tip Sent',i:'🎁',r:1},{t:'tip_received',l:'Tip Received',i:'💰',r:2},{t:'pk_win',l:'PK Win',i:'🏆',r:100},{t:'daily_login',l:'Daily Login',i:'🔑',r:10},{t:'referral',l:'Referral',i:'🤝',r:50}];
export function MiningScreen() {
  const [mined, setMined] = useState(0);
  const [toast, setToast] = useState<string|null>(null);
  const claim = async (t: string) => {
    const r = await fetch('/api/ton/mine',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:'demo',wallet_address:'demo',activity_type:t})});
    const d = await r.json();
    if (d.success) { setMined(p=>p+d.reward); setToast(`+${d.reward} RTVS!`); setTimeout(()=>setToast(null),3000); }
  };
  return <div style={{minHeight:'100vh',background:'#0A0A0A',color:'#FFF',fontFamily:'-apple-system,sans-serif',maxWidth:480,margin:'0 auto'}}>
    {toast && <div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',background:'#CCFF00',color:'#000',fontWeight:800,padding:'10px 22px',borderRadius:24,zIndex:999}}>{toast}</div>}
    <div style={{padding:14,borderBottom:'1px solid rgba(204,255,0,0.12)',position:'sticky',top:0,background:'rgba(10,10,10,0.96)'}}><b style={{color:'#CCFF00',fontSize:16}}>RTV Mining</b></div>
    <div style={{padding:14}}>
      <div style={{background:'rgba(204,255,0,0.1)',border:'1px solid rgba(204,255,0,0.4)',borderRadius:16,padding:20,textAlign:'center',marginBottom:16}}><div style={{fontSize:11,color:'#CCFF00',fontWeight:800}}>TOTAL MINED</div><div style={{fontSize:42,fontWeight:900,color:'#CCFF00'}}>{mined.toLocaleString()}</div></div>
      {ACTS.map(a=><div key={a.t} style={{display:'flex',alignItems:'center',gap:10,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(204,255,0,0.12)',borderRadius:12,padding:12,marginBottom:8}}><span style={{fontSize:24}}>{a.i}</span><span style={{flex:1,fontWeight:700,fontSize:13}}>{a.l}</span><span style={{fontWeight:800,color:'#CCFF00'}}>+{a.r}</span><button onClick={()=>claim(a.t)} style={{padding:'6px 10px',borderRadius:8,border:'none',background:'#CCFF00',color:'#000',fontWeight:800,fontSize:10,cursor:'pointer'}}>Mine</button></div>)}
    </div>
  </div>;
}
