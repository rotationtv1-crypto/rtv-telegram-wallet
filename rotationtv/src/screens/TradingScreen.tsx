import { useState, useEffect } from "react";
export function TradingScreen() {
  const [tab, setTab] = useState('trade');
  const [side, setSide] = useState('buy');
  const [amount, setAmount] = useState('');
  const [orders, setOrders] = useState<any>(null);
  useEffect(() => { fetch('/api/ton/orderbook?pair=RTVS_TON').then(r=>r.json()).then(d=>setOrders(d.orders)).catch(()=>{}); }, []);
  return <div style={{minHeight:'100vh',background:'#0A0A0A',color:'#FFF',fontFamily:'-apple-system,sans-serif',maxWidth:480,margin:'0 auto'}}>
    <div style={{padding:14,borderBottom:'1px solid rgba(204,255,0,0.12)',position:'sticky',top:0,background:'rgba(10,10,10,0.96)'}}><b style={{color:'#CCFF00',fontSize:16}}>RTV Trading</b></div>
    <div style={{display:'flex',padding:'12px 14px',gap:6}}>{['trade','orders','pools'].map(t=><button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:8,borderRadius:10,border:'none',cursor:'pointer',background:tab===t?'#CCFF00':'rgba(255,255,255,0.06)',color:tab===t?'#000':'rgba(255,255,255,0.35)',fontWeight:800,fontSize:11,textTransform:'uppercase'}}>{t}</button>)}</div>
    <div style={{padding:'0 14px'}}>
      {tab==='trade' && <div><div style={{display:'flex',gap:6,marginBottom:12}}><button onClick={()=>setSide('buy')} style={{flex:1,padding:12,borderRadius:12,border:'none',cursor:'pointer',background:side==='buy'?'#00FF88':'rgba(255,255,255,0.06)',color:side==='buy'?'#000':'rgba(255,255,255,0.35)',fontWeight:800}}>BUY</button><button onClick={()=>setSide('sell')} style={{flex:1,padding:12,borderRadius:12,border:'none',cursor:'pointer',background:side==='sell'?'#FF6B6B':'rgba(255,255,255,0.06)',color:side==='sell'?'#000':'rgba(255,255,255,0.35)',fontWeight:800}}>SELL</button></div><div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(204,255,0,0.12)',borderRadius:16,padding:16}}><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount RTVS" style={{width:'100%',padding:12,borderRadius:10,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(204,255,0,0.12)',color:'#FFF',fontSize:18,fontWeight:700,outline:'none',marginBottom:12}} /></div></div>}
      {tab==='orders' && orders && <div>{orders.asks?.map((o:any,i:number)=><div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0'}}><span style={{color:'#FF6B6B'}}>{o.price.toFixed(5)}</span><span>{o.amount}</span></div>)}<div style={{textAlign:'center',color:'#CCFF00',fontWeight:900,padding:10}}>{orders.mid_price?.toFixed(5)} MID</div>{orders.bids?.map((o:any,i:number)=><div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0'}}><span style={{color:'#00FF88'}}>{o.price.toFixed(5)}</span><span>{o.amount}</span></div>)}</div>}
      {tab==='pools' && [{p:'RTVS/TON',a:24.5},{p:'RTVS/USDT',a:18.2}].map(x=><div key={x.p} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(204,255,0,0.12)',borderRadius:16,padding:16,marginBottom:10}}><b style={{color:'#CCFF00'}}>{x.p}</b> <span style={{color:'#00FF88',fontWeight:800}}>{x.a}% APY</span></div>)}
    </div>
  </div>;
}
