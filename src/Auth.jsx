import { useState } from "react";
import { supabase } from "./supabase";

const C = {
  bg:'#07101A', card:'#0E1C2E', card2:'#162437',
  accent:'#34D399', text:'#EFF6FF', muted:'#64748B',
  border:'rgba(255,255,255,0.07)', fats:'#F87171',
};

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    setLoading(true);
    let result;
    if (mode === 'login') {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({ email, password });
    }
    setLoading(false);
    if (result.error) { setError(result.error.message); return; }
    onAuth(result.data.user);
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:C.bg,padding:'20px'}}>
      <div style={{background:C.card,borderRadius:24,padding:'32px 26px',width:'100%',maxWidth:400,border:`1px solid ${C.border}`}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <h1 style={{fontFamily:'Heebo',fontSize:28,fontWeight:800,color:C.text,margin:0}}>
            nutri<span style={{color:C.accent}}>track</span>
          </h1>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:24}}>
          {['login','signup'].map(m=>(
            <button key={m} onClick={()=>setMode(m)}
              style={{flex:1,padding:'9px',borderRadius:10,border:`1px solid ${mode===m?C.accent:C.border}`,background:mode===m?`${C.accent}1E`:'transparent',color:mode===m?C.accent:C.muted,fontSize:13,fontFamily:'Heebo',fontWeight:600,cursor:'pointer'}}>
              {m==='login'?'Log In':'Sign Up'}
            </button>
          ))}
        </div>
        <div style={{marginBottom:14}}>
          <label style={{display:'block',color:C.muted,fontSize:11,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:5,fontFamily:'Heebo'}}>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com"
            style={{width:'100%',background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 12px',color:C.text,fontSize:14,fontFamily:'Heebo'}}/>
        </div>
        <div style={{marginBottom:22}}>
          <label style={{display:'block',color:C.muted,fontSize:11,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:5,fontFamily:'Heebo'}}>Password</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••"
            style={{width:'100%',background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 12px',color:C.text,fontSize:14,fontFamily:'Heebo'}}/>
        </div>
        {error&&<p style={{color:C.fats,fontSize:12,fontFamily:'Heebo',marginBottom:14,textAlign:'center'}}>{error}</p>}
        <button onClick={handleSubmit} disabled={loading}
          style={{width:'100%',padding:'13px',borderRadius:12,background:C.accent,border:'none',color:'#07101A',fontSize:15,fontFamily:'Heebo',fontWeight:700,cursor:'pointer'}}>
          {loading?'...':(mode==='login'?'Log In':'Create Account')}
        </button>
      </div>
    </div>
  );
}