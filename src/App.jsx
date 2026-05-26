import { useState, useEffect, useRef } from "react";

const C = {
  bg:'#07101A', card:'#0E1C2E', card2:'#162437',
  protein:'#34D399', carbs:'#FBBF24', fats:'#F87171', cal:'#60A5FA',
  text:'#EFF6FF', muted:'#64748B', accent:'#34D399',
  border:'rgba(255,255,255,0.07)',
};

// ─── Storage helpers ───
async function storageSave(key, value) {
  try { await window.storage.set(key, JSON.stringify(value)); } catch(e) {}
}
async function storageLoad(key) {
  try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; }
  catch(e) { return null; }
}
async function storageDelete(key) {
  try { await window.storage.delete(key); } catch(e) {}
}
async function storageListKeys(prefix) {
  try { const r = await window.storage.list(prefix); return r ? r.keys : []; }
  catch(e) { return []; }
}

// ─── Export / Import ───
async function exportAllData() {
  const logKeys = await storageListKeys('log:');
  const logs = {};
  await Promise.all(logKeys.map(async k => {
    const v = await storageLoad(k);
    if (v) logs[k.replace('log:','')] = v;
  }));
  const payload = {
    _nutritrack: true,
    version: 1,
    exportDate: new Date().toISOString(),
    profile:  await storageLoad('profile'),
    goals:    await storageLoad('goals'),
    lang:     await storageLoad('lang'),
    products: await storageLoad('products'),
    logs,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nutritrack-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importAllData(onSuccess, onError) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data._nutritrack) throw new Error('not a nutritrack file');
        const saves = [];
        if (data.profile)  saves.push(storageSave('profile',  data.profile));
        if (data.goals)    saves.push(storageSave('goals',    data.goals));
        if (data.lang)     saves.push(storageSave('lang',     data.lang));
        if (data.products) saves.push(storageSave('products', data.products));
        if (data.logs) {
          Object.entries(data.logs).forEach(([k,v]) => saves.push(storageSave(`log:${k}`, v)));
        }
        await Promise.all(saves);
        onSuccess(data);
      } catch(err) { onError(); }
    };
    reader.readAsText(file);
  };
  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

// ─── Date helpers ───
function dateStr(d) { return d.toISOString().split('T')[0]; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function isToday(d) { return dateStr(d) === dateStr(new Date()); }

const TR = {
  en: {
    subtitle:"Your personal nutrition companion",
    tellUs:"Tell us about yourself", tellUsSub:"We'll calculate your personalized daily nutrition targets",
    age:"age", height:"height", weight:"weight", yrs:"yrs", cm:"cm", kg:"kg",
    gender:"Gender", male:"Male", female:"Female",
    activityLabel:"Activity Level", goalLabel:"My Goal", calcBtn:"Calculate My Goals →",
    acts:[{l:"Sedentary",d:"Desk job, no exercise"},{l:"Light",d:"1–3 workouts/week"},{l:"Moderate",d:"3–5 workouts/week"},{l:"Active",d:"Daily training"},{l:"Very Active",d:"Athlete level"}],
    goalOpts:[{v:'lose',l:"Lose Weight",i:"↓"},{v:'maintain',l:"Maintain",i:"→"},{v:'gain',l:"Gain Weight",i:"↑"}],
    calculating:"Calculating your nutrition plan...",
    yourTargets:"Your Daily Targets",
    tdeeLine:(g,p)=>`BMR ${g.bmr} → TDEE ${g.tdee} kcal${p.goal!=='maintain'?` → ${p.goal==='lose'?'−350 deficit':'+350 surplus'}`:''}`,
    startBtn:"Start Tracking Today →",
    calLabel:"Calories", proteinLabel:"Protein", carbsLabel:"Carbs", fatsLabel:"Fats",
    kcalLeft:"kcal left", kcalOver:"kcal over",
    today:"Today", searchPlaceholder:"Search food (typos OK — try 'chiken')",
    customBtn:"+ Custom", productsBtn:"📋 Products",
    logTitle:"Food Log", clearAll:"Clear", emptyLog:"Nothing logged yet. Search above to get started.",
    noMatch:(q)=>`No match for "${q}" —`, addManually:"add it manually",
    total:"Total", perServing:"Per serving:", weightTip:"For weighted items (cheese, oils), 1 = 100g. For countable, 1 = 1 unit.",
    amountLabel:"Amount", cancel:"Cancel", addToLog:"Add to Log",
    addCustomTitle:"Add Custom Food", addCustomSub:"Values per serving (or per 100g for weighted items)",
    nameLabel:"English Name", heNameLabel:"Hebrew Name", heNamePlaceholder:"e.g. חזה עוף",
    foodNamePlaceholder:"e.g. Greek Yogurt",
    calField:"Calories (kcal)", proteinField:"Protein (g)", carbsField:"Carbs (g)", fatsField:"Fats (g)",
    savedNote:"Saved to your database for future searches.", addAndLog:"Add & Log",
    productDBTitle:"Product Database", productDBSub:(n)=>`${n} products · per serving or per 100g`,
    addBtn:"+ Add", filterPlaceholder:"Filter products...", noProducts:"No products found",
    newProductTitle:"New Product", saveProduct:"Save Product",
    editBtn:"Edit", deleteBtn:"Delete", saveBtn:"Save",
    settingsTitle:"Settings", recalcBtn:"Recalculate Goals", resetBtn:"Reset All Data",
    resetConfirm:"This will delete your profile, goals and all food logs. Products database will be kept. Are you sure?",
    loading:"Loading your data...",
    exportBtn:"📤 Export to JSON", importBtn:"📥 Import from JSON",
    exportNote:"Downloads a backup file you can reimport anytime.",
    importNote:"Restore from a NutriTrack backup file.",
    importError:"Invalid file — please use a NutriTrack export.",
    importSuccess:"Data imported! Reloading...",
  },
  he: {
    subtitle:"הלוח האישי שלך לתזונה",
    tellUs:"ספר/י לנו על עצמך", tellUsSub:"נחשב עבורך יעדים יומיים מותאמים אישית",
    age:"גיל", height:"גובה", weight:"משקל", yrs:"שנ׳", cm:"ס״מ", kg:"ק״ג",
    gender:"מין", male:"זכר", female:"נקבה",
    activityLabel:"רמת פעילות גופנית", goalLabel:"המטרה שלי", calcBtn:"חשב את היעדים שלי ←",
    acts:[{l:"יושבני",d:"עבודה במשרד, ללא פעילות"},{l:"קל",d:"1–3 אימונים בשבוע"},{l:"בינוני",d:"3–5 אימונים בשבוע"},{l:"פעיל",d:"אימון יומי"},{l:"פעיל מאוד",d:"רמת ספורטאי"}],
    goalOpts:[{v:'lose',l:"ירידה במשקל",i:"↓"},{v:'maintain',l:"שמירה על משקל",i:"→"},{v:'gain',l:"עלייה במשקל",i:"↑"}],
    calculating:"מחשב את תוכנית התזונה שלך...",
    yourTargets:"היעדים היומיים שלך",
    tdeeLine:(g,p)=>`BMR ${g.bmr} ← TDEE ${g.tdee} קל׳${p.goal!=='maintain'?` ← ${p.goal==='lose'?'גירעון 350−':'עודף +350'}`:''}`,
    startBtn:"התחל לעקוב ←",
    calLabel:"קלוריות", proteinLabel:"חלבון", carbsLabel:"פחמימות", fatsLabel:"שומנים",
    kcalLeft:"קל׳ נותרו", kcalOver:"קל׳ חריגה",
    today:"היום", searchPlaceholder:"חפש מוצר (גם עם שגיאות כתיב...)",
    customBtn:"+ מותאם", productsBtn:"📋 מוצרים",
    logTitle:"יומן אכילה", clearAll:"נקה", emptyLog:"לא נרשמו מזונות עדיין. חפש למעלה כדי להתחיל.",
    noMatch:(q)=>`אין תוצאות עבור "${q}" —`, addManually:"הוסף ידנית",
    total:"סה״כ", perServing:"למנה:", weightTip:"למוצרים לפי משקל (גבינה, שמן), 1 = 100 גרם. לספירתיים, 1 = יחידה.",
    amountLabel:"כמות", cancel:"ביטול", addToLog:"הוסף ליומן",
    addCustomTitle:"הוסף מזון מותאם", addCustomSub:"ערכים למנה (או ל-100 גרם למוצרי משקל)",
    nameLabel:"שם באנגלית", heNameLabel:"שם בעברית", heNamePlaceholder:"לדוג׳ חזה עוף",
    foodNamePlaceholder:"לדוג׳ יוגורט יווני",
    calField:"קלוריות (קל׳)", proteinField:"חלבון (ג׳)", carbsField:"פחמימות (ג׳)", fatsField:"שומן (ג׳)",
    savedNote:"יישמר במסד הנתונים שלך לחיפושים עתידיים.", addAndLog:"הוסף ורשום",
    productDBTitle:"מסד נתוני מוצרים", productDBSub:(n)=>`${n} מוצרים · למנה או ל-100 גרם`,
    addBtn:"+ הוסף", filterPlaceholder:"סנן מוצרים...", noProducts:"לא נמצאו מוצרים",
    newProductTitle:"מוצר חדש", saveProduct:"שמור מוצר",
    editBtn:"ערוך", deleteBtn:"מחק", saveBtn:"שמור",
    settingsTitle:"הגדרות", recalcBtn:"חשב מחדש יעדים", resetBtn:"אפס את כל הנתונים",
    resetConfirm:"פעולה זו תמחק את הפרופיל, היעדים וכל יומני האכילה. מסד המוצרים יישמר. להמשיך?",
    loading:"טוען את הנתונים שלך...",
    exportBtn:"📤 יצא ל-JSON", importBtn:"📥 יבא מ-JSON",
    exportNote:"מוריד קובץ גיבוי שניתן לייבא בכל עת.",
    importNote:"שחזר מקובץ גיבוי של NutriTrack.",
    importError:"קובץ לא תקין — אנא השתמש בקובץ יצוא של NutriTrack.",
    importSuccess:"הנתונים יובאו! טוען מחדש...",
  },
};

const DEFAULT_PRODUCTS = [
  {name:"eggs",              nameHe:"ביצים",                   protein:7,   carbs:0,   fats:2,   calories:47},
  {name:"pita",              nameHe:"פיתה",                    protein:7,   carbs:51,  fats:0,   calories:243},
  {name:"white cheese",      nameHe:"גבינה לבנה",              protein:8,   carbs:4,   fats:5,   calories:96},
  {name:"white fish",        nameHe:"דג לבן",                  protein:49,  carbs:0,   fats:5,   calories:193},
  {name:"rice",              nameHe:"אורז",                    protein:3,   carbs:28,  fats:0,   calories:130},
  {name:"string beans",      nameHe:"שעועית ירוקה",            protein:2,   carbs:7,   fats:0,   calories:31},
  {name:"kaki",              nameHe:"חקי (אפרסמון)",           protein:7,   carbs:7,   fats:7,   calories:7},
  {name:"cottage cheese",    nameHe:"קוטג׳",                   protein:11,  carbs:1,   fats:5,   calories:95},
  {name:"feta",              nameHe:"פטה",                     protein:15,  carbs:0,   fats:16,  calories:206},
  {name:"square of chocolate",nameHe:"קוביית שוקולד",          protein:0,   carbs:2,   fats:1,   calories:23},
  {name:"hot dogs",          nameHe:"נקניקיות",                protein:11,  carbs:5,   fats:15,  calories:200},
  {name:"schnitzel",         nameHe:"שניצל",                   protein:16,  carbs:15,  fats:10,  calories:201},
  {name:"mayo",              nameHe:"מיונז",                   protein:0,   carbs:0,   fats:71,  calories:643},
  {name:"tahini",            nameHe:"טחינה",                   protein:20,  carbs:13,  fats:63,  calories:699},
  {name:"go אוורירי",        nameHe:"go אוורירי",              protein:20,  carbs:6,   fats:1,   calories:123},
  {name:"milk",              nameHe:"חלב",                     protein:3,   carbs:5,   fats:3,   calories:60},
  {name:"chicken thigh",     nameHe:"ירך עוף",                 protein:25,  carbs:0,   fats:8,   calories:195},
  {name:"protein shake",     nameHe:"שייק חלבון",              protein:25,  carbs:19,  fats:5,   calories:227},
  {name:"tuna",              nameHe:"טונה",                    protein:23,  carbs:0,   fats:1,   calories:98},
  {name:"yellow cheese",     nameHe:"גבינה צהובה",             protein:30,  carbs:0,   fats:9,   calories:201},
  {name:"vanilla protein yogurt",nameHe:"יוגורט חלבון וניל",  protein:25,  carbs:12,  fats:0,   calories:136},
  {name:"rice noodles",      nameHe:"אטריות אורז",             protein:0,   carbs:28,  fats:0,   calories:126},
  {name:"edamame",           nameHe:"אדממה",                   protein:12,  carbs:13,  fats:4,   calories:125},
  {name:"chicken breast",    nameHe:"חזה עוף",                 protein:31,  carbs:0,   fats:4,   calories:165},
  {name:"olive oil",         nameHe:"שמן זית",                 protein:0,   carbs:0,   fats:100, calories:900},
  {name:"muller protein yogurt 1.6%",nameHe:"יוגורט חלבון מולר 1.6%",protein:20,carbs:11,fats:2,calories:202},
  {name:"go protein shake",  nameHe:"שייק חלבון go",           protein:25,  carbs:17,  fats:6,   calories:228},
  {name:"ground beef",       nameHe:"בשר טחון",                protein:24,  carbs:0,   fats:13,  calories:218},
  {name:"mozzarella",        nameHe:"מוצרלה",                  protein:22.5,carbs:0,   fats:23,  calories:297},
  {name:"gouda",             nameHe:"גאודה",                   protein:19,  carbs:0,   fats:30,  calories:364},
  {name:"hamburger",         nameHe:"המבורגר",                 protein:55,  carbs:51,  fats:47.3,calories:871.9},
  {name:"corned beef",       nameHe:"קורנד ביף",               protein:18,  carbs:0,   fats:19,  calories:250},
  {name:"orange juice",      nameHe:"מיץ תפוזים",              protein:1,   carbs:10,  fats:0,   calories:43},
  {name:"oreo egg",          nameHe:"ביצת אוראו",              protein:2,   carbs:17,  fats:11,  calories:179},
  {name:"tortilla",          nameHe:"טורטייה",                 protein:3.5, carbs:20,  fats:2.7, calories:122},
  {name:"sour cream 9%",     nameHe:"שמנת חמוצה 9%",          protein:3.5, carbs:4.7, fats:9,   calories:114},
  {name:"beer",              nameHe:"בירה",                    protein:0,   carbs:0,   fats:0,   calories:138.6},
  {name:"muller protein shake",nameHe:"שייק חלבון מולר",       protein:24,  carbs:12,  fats:0,   calories:140},
  {name:"cusmin pita",       nameHe:"פיתה כוסמין",             protein:7,   carbs:47,  fats:2,   calories:234},
  {name:"cake",              nameHe:"עוגה",                    protein:0,   carbs:0,   fats:0,   calories:200},
];

function lev(a,b){
  const m=a.length,n=b.length;
  const d=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)
    d[i][j]=a[i-1]===b[j-1]?d[i-1][j-1]:1+Math.min(d[i-1][j],d[i][j-1],d[i-1][j-1]);
  return d[m][n];
}

function fuzzySearch(q,products){
  if(!q.trim())return[];
  const query=q.toLowerCase().trim();
  return products.map(p=>{
    const n=p.name.toLowerCase(), nHe=(p.nameHe||'').toLowerCase();
    let s=0;
    for(const str of[n,nHe]){
      if(!str)continue;
      if(str===query)s=Math.max(s,100);
      else if(str.startsWith(query))s=Math.max(s,85);
      else if(str.includes(query))s=Math.max(s,72);
      else{
        const words=str.split(/\s+/);
        for(const w of words){if(w.startsWith(query)){s=Math.max(s,65);break;}if(w.includes(query)){s=Math.max(s,55);break;}}
        if(s===0&&query.length>=3){
          const dv=lev(query,str.substring(0,query.length+3));
          if(dv<=2)s=Math.max(s,45-dv*10);
          else for(const w of words){const d2=lev(query,w);if(d2<=Math.max(1,Math.floor(query.length/3)))s=Math.max(s,35-d2*8);}
        }
      }
    }
    return{...p,s};
  }).filter(p=>p.s>0).sort((a,b)=>b.s-a.s).slice(0,8);
}

function displayName(p,lang){return lang==='he'&&p.nameHe?p.nameHe:p.name;}

function LangToggle({lang,setLang}){
  return(
    <button onClick={()=>setLang(l=>l==='en'?'he':'en')}
      style={{padding:'5px 11px',borderRadius:8,background:C.card2,border:`1px solid ${C.border}`,color:C.accent,fontSize:12,fontFamily:'Heebo',fontWeight:700,cursor:'pointer',flexShrink:0}}>
      {lang==='en'?'עב':'EN'}
    </button>
  );
}

function Ring({label,value,goal,color,unit='g'}){
  const r=34,circ=2*Math.PI*r,pct=goal>0?Math.min(value/goal,1):0,over=value>goal&&goal>0;
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5}}>
      <svg width={84} height={84} viewBox="0 0 84 84">
        <circle cx={42} cy={42} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7}/>
        <circle cx={42} cy={42} r={r} fill="none" stroke={over?C.fats:color} strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round"
          transform="rotate(-90 42 42)" style={{transition:'stroke-dashoffset 0.55s ease'}}/>
        <text x={42} y={40} textAnchor="middle" fill={C.text} fontSize={12} fontWeight={700} fontFamily="Heebo">{Math.round(value)}</text>
        <text x={42} y={52} textAnchor="middle" fill={C.muted} fontSize={9} fontFamily="Heebo">/{Math.round(goal)}{unit}</text>
      </svg>
      <span style={{color:C.muted,fontSize:10,letterSpacing:'0.04em',textTransform:'uppercase',fontFamily:'Heebo'}}>{label}</span>
    </div>
  );
}

// ─────────────────────── PRODUCTS PANEL ───────────────────────
function ProductsPanel({products,setProducts,onClose,lang}){
  const t=TR[lang];
  const[filter,setFilter]=useState('');
  const[editId,setEditId]=useState(null);
  const[editForm,setEditForm]=useState({});
  const[showAdd,setShowAdd]=useState(false);
  const[addForm,setAddForm]=useState({name:'',nameHe:'',protein:'',carbs:'',fats:'',calories:''});

  const filtered=products.filter(p=>p.name.toLowerCase().includes(filter.toLowerCase())||(p.nameHe||'').includes(filter));

  function startEdit(p){const idx=products.indexOf(p);setEditId(idx);setEditForm({...p});}
  function saveEdit(){
    setProducts(prev=>prev.map((p,i)=>i===editId?{name:editForm.name||p.name,nameHe:editForm.nameHe||'',protein:+editForm.protein||0,carbs:+editForm.carbs||0,fats:+editForm.fats||0,calories:+editForm.calories||0}:p));
    setEditId(null);
  }
  function deleteProduct(p){setProducts(prev=>prev.filter(x=>x!==p));setEditId(null);}
  function addProduct(){
    if(!addForm.name.trim()&&!addForm.nameHe.trim())return;
    setProducts(prev=>[...prev,{name:addForm.name.trim()||addForm.nameHe.trim(),nameHe:addForm.nameHe.trim(),protein:+addForm.protein||0,carbs:+addForm.carbs||0,fats:+addForm.fats||0,calories:+addForm.calories||0}]);
    setAddForm({name:'',nameHe:'',protein:'',carbs:'',fats:'',calories:''});
    setShowAdd(false);
  }

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.82)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:300}}>
      <div style={{background:C.card,borderRadius:'22px 22px 0 0',width:'100%',maxWidth:540,maxHeight:'90vh',display:'flex',flexDirection:'column',border:`1px solid ${C.border}`,boxShadow:'0 -32px 80px rgba(0,0,0,0.6)'}}>
        <div style={{padding:'20px 20px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <div>
            <h2 style={{fontFamily:'Heebo',fontSize:17,fontWeight:700,color:C.text,margin:0}}>{t.productDBTitle}</h2>
            <p style={{color:C.muted,fontSize:11,marginTop:2}}>{t.productDBSub(products.length)}</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setShowAdd(s=>!s)} style={{padding:'7px 13px',borderRadius:9,background:showAdd?`${C.accent}22`:C.card2,border:`1px solid ${showAdd?C.accent:C.border}`,color:showAdd?C.accent:C.muted,fontSize:12,fontFamily:'Heebo',fontWeight:600,cursor:'pointer'}}>{t.addBtn}</button>
            <button onClick={onClose} style={{width:32,height:32,borderRadius:'50%',background:C.card2,border:`1px solid ${C.border}`,color:C.muted,fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
          </div>
        </div>

        {showAdd&&(
          <div style={{padding:'14px 20px',borderBottom:`1px solid ${C.border}`,background:`${C.accent}08`,flexShrink:0}}>
            <p style={{color:C.accent,fontSize:11,fontFamily:'Heebo',fontWeight:600,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.04em'}}>{t.newProductTitle}</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
              <div>
                <label style={{display:'block',color:C.muted,fontSize:10,fontFamily:'Heebo',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>{t.nameLabel}</label>
                <input value={addForm.name} onChange={e=>setAddForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Greek Yogurt" dir="ltr" style={{width:'100%',background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:'7px 10px',color:C.text,fontSize:13,fontFamily:'Heebo'}}/>
              </div>
              <div>
                <label style={{display:'block',color:C.accent,fontSize:10,fontFamily:'Heebo',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>{t.heNameLabel}</label>
                <input value={addForm.nameHe} onChange={e=>setAddForm(f=>({...f,nameHe:e.target.value}))} placeholder={t.heNamePlaceholder} dir="rtl" style={{width:'100%',background:C.card2,border:`1px solid ${C.accent}44`,borderRadius:8,padding:'7px 10px',color:C.text,fontSize:13,fontFamily:'Heebo'}}/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:6,marginBottom:10}}>
              {[{k:'calories',l:'kcal'},{k:'protein',l:'P'},{k:'carbs',l:'C'},{k:'fats',l:'F'}].map(({k,l})=>(
                <div key={k}>
                  <label style={{display:'block',color:C.muted,fontSize:9,fontFamily:'Heebo',textAlign:'center',marginBottom:3,textTransform:'uppercase'}}>{l}</label>
                  <input type="number" value={addForm[k]} onChange={e=>setAddForm(f=>({...f,[k]:e.target.value}))} style={{width:'100%',background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:'7px 8px',color:C.text,fontSize:12,fontFamily:'Heebo',textAlign:'center'}}/>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setShowAdd(false)} style={{flex:1,padding:'8px',borderRadius:8,background:C.card2,border:`1px solid ${C.border}`,color:C.muted,fontSize:12,fontFamily:'Heebo',cursor:'pointer'}}>{t.cancel}</button>
              <button onClick={addProduct} style={{flex:2,padding:'8px',borderRadius:8,background:C.accent,border:'none',color:'#07101A',fontSize:13,fontFamily:'Heebo',fontWeight:700,cursor:'pointer'}}>{t.saveProduct}</button>
            </div>
          </div>
        )}

        <div style={{padding:'12px 20px',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <div style={{position:'relative'}}>
            <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder={t.filterPlaceholder} dir="auto"
              style={{width:'100%',background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:'9px 36px 9px 12px',color:C.text,fontSize:13,fontFamily:'Heebo'}}/>
            {filter&&<button onClick={()=>setFilter('')} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:C.muted,fontSize:14,cursor:'pointer',padding:0}}>✕</button>}
          </div>
        </div>

        <div style={{overflowY:'auto',flex:1,padding:'8px 12px 20px'}}>
          {filtered.length===0&&<p style={{color:C.muted,textAlign:'center',padding:'24px 0',fontSize:13,fontFamily:'Heebo'}}>{t.noProducts}</p>}
          {filtered.map((p,i)=>{
            const realIdx=products.indexOf(p),isEditing=editId===realIdx;
            return(
              <div key={i} style={{borderRadius:12,border:`1px solid ${isEditing?C.accent:C.border}`,background:isEditing?`${C.accent}08`:C.card,marginBottom:6,overflow:'hidden',transition:'border-color 0.2s'}}>
                {!isEditing?(
                  <div style={{display:'flex',alignItems:'center',padding:'10px 13px',gap:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'baseline',gap:8,flexWrap:'wrap'}}>
                        <span style={{color:C.text,fontSize:13,fontFamily:'Heebo',fontWeight:500}}>{p.name}</span>
                        {p.nameHe&&<span style={{color:C.accent,fontSize:12,fontFamily:'Heebo',fontWeight:600,direction:'rtl'}}>{p.nameHe}</span>}
                      </div>
                      <div style={{fontSize:11,marginTop:3,display:'flex',gap:8}}>
                        <span style={{color:C.cal}}>{p.calories} kcal</span>
                        <span style={{color:C.protein}}>P:{p.protein}g</span>
                        <span style={{color:C.carbs}}>C:{p.carbs}g</span>
                        <span style={{color:C.fats}}>F:{p.fats}g</span>
                      </div>
                    </div>
                    <button onClick={()=>startEdit(p)} style={{padding:'5px 11px',borderRadius:7,background:C.card2,border:`1px solid ${C.border}`,color:C.muted,fontSize:11,fontFamily:'Heebo',cursor:'pointer',flexShrink:0}}>{t.editBtn}</button>
                  </div>
                ):(
                  <div style={{padding:'12px 13px'}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                      <div>
                        <label style={{display:'block',color:C.muted,fontSize:10,fontFamily:'Heebo',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>{t.nameLabel}</label>
                        <input value={editForm.name||''} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} dir="ltr" style={{width:'100%',background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:'7px 10px',color:C.text,fontSize:13,fontFamily:'Heebo'}}/>
                      </div>
                      <div>
                        <label style={{display:'block',color:C.accent,fontSize:10,fontFamily:'Heebo',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>{t.heNameLabel}</label>
                        <input value={editForm.nameHe||''} onChange={e=>setEditForm(f=>({...f,nameHe:e.target.value}))} dir="rtl" style={{width:'100%',background:C.card2,border:`1px solid ${C.accent}44`,borderRadius:8,padding:'7px 10px',color:C.text,fontSize:13,fontFamily:'Heebo'}}/>
                      </div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:6,marginBottom:10}}>
                      {[{k:'calories',l:'kcal',c:C.cal},{k:'protein',l:'P',c:C.protein},{k:'carbs',l:'C',c:C.carbs},{k:'fats',l:'F',c:C.fats}].map(({k,l,c})=>(
                        <div key={k}>
                          <label style={{display:'block',color:c,fontSize:9,fontFamily:'Heebo',textAlign:'center',marginBottom:3,textTransform:'uppercase'}}>{l}</label>
                          <input type="number" value={editForm[k]??''} onChange={e=>setEditForm(f=>({...f,[k]:e.target.value}))} style={{width:'100%',background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:'6px 8px',color:C.text,fontSize:13,fontFamily:'Heebo',textAlign:'center'}}/>
                        </div>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:7}}>
                      <button onClick={()=>deleteProduct(p)} style={{padding:'7px 10px',borderRadius:8,background:`${C.fats}18`,border:`1px solid ${C.fats}40`,color:C.fats,fontSize:12,fontFamily:'Heebo',cursor:'pointer'}}>{t.deleteBtn}</button>
                      <button onClick={()=>setEditId(null)} style={{flex:1,padding:'7px',borderRadius:8,background:C.card2,border:`1px solid ${C.border}`,color:C.muted,fontSize:12,fontFamily:'Heebo',cursor:'pointer'}}>{t.cancel}</button>
                      <button onClick={saveEdit} style={{flex:2,padding:'7px',borderRadius:8,background:C.accent,border:'none',color:'#07101A',fontSize:13,fontFamily:'Heebo',fontWeight:700,cursor:'pointer'}}>{t.saveBtn}</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────── ONBOARDING ───────────────────────
function Onboarding({onSubmit,lang,setLang}){
  const t=TR[lang];
  const[f,setF]=useState({age:'',height:'',weight:'',gender:'male',activity:'moderate',goal:'maintain'});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const ok=f.age&&f.height&&f.weight&&+f.age>0&&+f.height>0&&+f.weight>0;
  const inp={background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 32px 10px 12px',color:C.text,fontSize:14,fontFamily:'Heebo',width:'100%'};
  const vals=['sedentary','light','moderate','active','veryActive'];
  return(
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px 16px',background:C.bg}}>
      <div style={{marginBottom:32,textAlign:'center'}}>
        <div style={{width:52,height:52,borderRadius:'50%',background:`${C.accent}20`,border:`1px solid ${C.accent}40`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',fontSize:22}}>🥗</div>
        <h1 style={{fontFamily:'Heebo',fontSize:32,fontWeight:800,color:C.text,letterSpacing:'-0.02em',margin:0}}>nutri<span style={{color:C.accent}}>track</span></h1>
        <p style={{color:C.muted,fontSize:14,marginTop:6}}>{t.subtitle}</p>
        <div style={{marginTop:12}}><LangToggle lang={lang} setLang={setLang}/></div>
      </div>
      <div style={{background:C.card,borderRadius:24,padding:'32px 26px',width:'100%',maxWidth:460,border:`1px solid ${C.border}`,boxShadow:'0 32px 72px rgba(0,0,0,0.5)'}}>
        <h2 style={{fontFamily:'Heebo',fontSize:17,fontWeight:600,color:C.text,marginBottom:4}}>{t.tellUs}</h2>
        <p style={{color:C.muted,fontSize:12,marginBottom:22}}>{t.tellUsSub}</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:18}}>
          {[{k:'age',u:t.yrs},{k:'height',u:t.cm},{k:'weight',u:t.kg}].map(({k,u})=>(
            <div key={k}>
              <label style={{display:'block',color:C.muted,fontSize:10,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:5}}>{t[k]}</label>
              <div style={{position:'relative'}}>
                <input type="number" value={f[k]} onChange={e=>s(k,e.target.value)} style={inp}/>
                <span style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',color:C.muted,fontSize:10}}>{u}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{marginBottom:18}}>
          <label style={{display:'block',color:C.muted,fontSize:10,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:7}}>{t.gender}</label>
          <div style={{display:'flex',gap:10}}>
            {['male','female'].map(g=>(
              <button key={g} onClick={()=>s('gender',g)} style={{flex:1,padding:'10px',borderRadius:10,border:`1px solid ${f.gender===g?C.accent:C.border}`,background:f.gender===g?`${C.accent}1E`:C.card2,color:f.gender===g?C.accent:C.muted,fontSize:13,fontFamily:'Heebo',fontWeight:500,cursor:'pointer'}}>
                {g==='male'?t.male:t.female}
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:18}}>
          <label style={{display:'block',color:C.muted,fontSize:10,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:7}}>{t.activityLabel}</label>
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            {t.acts.map((a,i)=>(
              <button key={i} onClick={()=>s('activity',vals[i])} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 13px',borderRadius:10,border:`1px solid ${f.activity===vals[i]?C.accent:C.border}`,background:f.activity===vals[i]?`${C.accent}14`:C.card2,cursor:'pointer',fontFamily:'Heebo'}}>
                <span style={{color:f.activity===vals[i]?C.accent:C.text,fontSize:13,fontWeight:500}}>{a.l}</span>
                <span style={{color:C.muted,fontSize:11}}>{a.d}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:26}}>
          <label style={{display:'block',color:C.muted,fontSize:10,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:7}}>{t.goalLabel}</label>
          <div style={{display:'flex',gap:10}}>
            {t.goalOpts.map(g=>(
              <button key={g.v} onClick={()=>s('goal',g.v)} style={{flex:1,padding:'13px 6px',borderRadius:12,border:`1px solid ${f.goal===g.v?C.accent:C.border}`,background:f.goal===g.v?`${C.accent}1E`:C.card2,color:f.goal===g.v?C.accent:C.muted,display:'flex',flexDirection:'column',alignItems:'center',gap:5,cursor:'pointer',fontFamily:'Heebo'}}>
                <span style={{fontSize:18}}>{g.i}</span><span style={{fontSize:11}}>{g.l}</span>
              </button>
            ))}
          </div>
        </div>
        <button onClick={()=>ok&&onSubmit(f)} style={{width:'100%',padding:'14px',borderRadius:12,background:ok?C.accent:'#1A2535',border:'none',color:ok?'#07101A':C.muted,fontSize:15,fontFamily:'Heebo',fontWeight:700,cursor:ok?'pointer':'default'}}>
          {t.calcBtn}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────── REPORT ───────────────────────
function Report({profile,onStart,lang,setLang}){
  const t=TR[lang];
  const[loading,setLoading]=useState(true);
  const[goals,setGoals]=useState(null);
  const[message,setMessage]=useState('');
  useEffect(()=>{callApi();},[]);
  async function callApi(){
    const actMap={sedentary:1.2,light:1.375,moderate:1.55,active:1.725,veryActive:1.9};
    const adjMap={lose:-350,maintain:0,gain:350};
    const langNote=lang==='he'?'Write the message in Hebrew.':'Write the message in English.';
    const prompt=`Nutrition expert. Calculate targets.
Profile: Age ${profile.age}, Height ${profile.height}cm, Weight ${profile.weight}kg, ${profile.gender}, Activity: ${profile.activity} (factor ${actMap[profile.activity]}), Goal: ${profile.goal} (adj: ${adjMap[profile.goal]} kcal).
Mifflin-St Jeor BMR: Male=10w+6.25h-5a+5, Female=10w+6.25h-5a-161. TDEE=BMR×factor. GoalCal=TDEE+adj. Protein=weight×1.8. Fats=27%goalCal÷9. Carbs=(goalCal-P×4-F×9)÷4. Round all.
${langNote}
JSON only: {"bmr":N,"tdee":N,"goalCalories":N,"protein":N,"carbs":N,"fats":N,"message":"2-3 sentence motivational note"}`;
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      const text=data.content.map(b=>b.text||'').join('').replace(/```json|```/g,'').trim();
      const parsed=JSON.parse(text);
      setGoals(parsed);setMessage(parsed.message);
    }catch(e){
      const actMap2={sedentary:1.2,light:1.375,moderate:1.55,active:1.725,veryActive:1.9};
      const w=+profile.weight,h=+profile.height,a=+profile.age;
      const bmr=profile.gender==='male'?10*w+6.25*h-5*a+5:10*w+6.25*h-5*a-161;
      const tdee=Math.round(bmr*actMap2[profile.activity]);
      const goalCal=tdee+adjMap[profile.goal];
      const protein=Math.round(w*1.8),fats=Math.round(goalCal*0.27/9),carbs=Math.round((goalCal-protein*4-fats*9)/4);
      setGoals({bmr:Math.round(bmr),tdee,goalCalories:goalCal,protein,carbs,fats});
      setMessage(lang==='he'?`לפי הפרופיל שלך, אתה צריך ${goalCal} קל׳ ביום להשגת המטרה. שאף ל-${Math.round(w*1.8)}ג׳ חלבון מדי יום. עקביות היא המפתח!`:`Based on your profile, you need ${goalCal} kcal daily. Aim for ${Math.round(w*1.8)}g protein. Stay consistent!`);
    }
    setLoading(false);
  }
  if(loading)return(<div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:C.bg,gap:18}}><div style={{width:44,height:44,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.accent}`,borderRadius:'50%',animation:'spin 0.9s linear infinite'}}/><p style={{color:C.muted,fontFamily:'Heebo',fontSize:14}}>{t.calculating}</p></div>);
  if(!goals)return null;
  const cards=[{label:t.calLabel,v:goals.goalCalories,u:'kcal',c:C.cal,icon:'🔥'},{label:t.proteinLabel,v:goals.protein,u:'g',c:C.protein,icon:'💪'},{label:t.carbsLabel,v:goals.carbs,u:'g',c:C.carbs,icon:'⚡'},{label:t.fatsLabel,v:goals.fats,u:'g',c:C.fats,icon:'🥑'}];
  return(
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px 16px',background:C.bg}}>
      <div style={{width:'100%',maxWidth:460}}>
        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}><LangToggle lang={lang} setLang={setLang}/></div>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{width:52,height:52,borderRadius:'50%',background:`${C.accent}20`,border:`1px solid ${C.accent}40`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:22,color:C.accent}}>✓</div>
          <h2 style={{fontFamily:'Heebo',fontSize:26,fontWeight:700,color:C.text,margin:0}}>{t.yourTargets}</h2>
          <p style={{color:C.muted,fontSize:12,marginTop:8}}>{t.tdeeLine(goals,profile)}</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
          {cards.map(m=>(
            <div key={m.label} style={{background:C.card,borderRadius:16,padding:'20px 16px',border:`1px solid ${C.border}`,textAlign:'center'}}>
              <div style={{fontSize:22,marginBottom:10}}>{m.icon}</div>
              <div style={{fontFamily:'Heebo',fontSize:28,fontWeight:800,color:m.c}}>{m.v}</div>
              <div style={{color:C.muted,fontSize:11,marginTop:4}}>{m.u}/day · {m.label}</div>
            </div>
          ))}
        </div>
        <div style={{background:C.card,borderRadius:16,padding:'18px',border:`1px solid ${C.border}`,marginBottom:20,display:'flex',gap:12,alignItems:'flex-start'}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:`${C.accent}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:14}}>💬</div>
          <p style={{color:C.text,fontSize:13,lineHeight:1.75,fontFamily:'Heebo',margin:0}}>{message}</p>
        </div>
        <button onClick={()=>onStart(goals)} style={{width:'100%',padding:'14px',borderRadius:12,background:C.accent,border:'none',color:'#07101A',fontSize:15,fontFamily:'Heebo',fontWeight:700,cursor:'pointer'}}>{t.startBtn}</button>
      </div>
    </div>
  );
}

// ─────────────────────── TRACKER ───────────────────────
function Tracker({goals,products,setProducts,lang,setLang,onRecalculate,onResetAll,onImport}){
  const t=TR[lang];
  const rtl=lang==='he';
  const iconSide=rtl?'right':'left';
  const[currentDate,setCurrentDate]=useState(new Date());
  const[log,setLog]=useState([]);
  const[logReady,setLogReady]=useState(false);
  const loadedForDateRef=useRef('');
  const[query,setQuery]=useState('');
  const[results,setResults]=useState([]);
  const[selected,setSelected]=useState(null);
  const[amount,setAmount]=useState('1');
  const[showAmt,setShowAmt]=useState(false);
  const[showCustom,setShowCustom]=useState(false);
  const[showProducts,setShowProducts]=useState(false);
  const[showSettings,setShowSettings]=useState(false);
  const[custom,setCustom]=useState({name:'',nameHe:'',protein:'',carbs:'',fats:'',calories:''});
  const[dropOpen,setDropOpen]=useState(false);
  const[hovIdx,setHovIdx]=useState(-1);

  const ds=dateStr(currentDate);

  // Load log when date changes
  useEffect(()=>{
    setLogReady(false);
    storageLoad(`log:${ds}`).then(saved=>{
      loadedForDateRef.current=ds;
      setLog(saved||[]);
      setLogReady(true);
    });
  },[ds]);

  // Save log when it changes (only after loaded)
  useEffect(()=>{
    if(logReady&&loadedForDateRef.current===ds){
      storageSave(`log:${ds}`,log);
    }
  },[log,logReady]);

  useEffect(()=>{
    if(query.trim()){setResults(fuzzySearch(query,products));setDropOpen(true);}
    else{setResults([]);setDropOpen(false);}
  },[query,products]);

  const totals=log.reduce((a,i)=>({calories:a.calories+(i.calories||0)*i.amount,protein:a.protein+(i.protein||0)*i.amount,carbs:a.carbs+(i.carbs||0)*i.amount,fats:a.fats+(i.fats||0)*i.amount}),{calories:0,protein:0,carbs:0,fats:0});
  const remaining=Math.round(goals.goalCalories-totals.calories);

  function pick(p){setSelected(p);setAmount('1');setQuery('');setDropOpen(false);setShowAmt(true);}
  function addToLog(){
    if(!selected||!amount||+amount<=0)return;
    setLog(prev=>[...prev,{id:Date.now(),name:selected.name,nameHe:selected.nameHe||'',amount:+amount,protein:selected.protein||0,carbs:selected.carbs||0,fats:selected.fats||0,calories:selected.calories||0}]);
    setSelected(null);setShowAmt(false);setAmount('1');
  }
  function addCustom(){
    if(!custom.name.trim()&&!custom.nameHe.trim())return;
    const p={name:custom.name.trim()||custom.nameHe.trim(),nameHe:custom.nameHe.trim(),protein:+custom.protein||0,carbs:+custom.carbs||0,fats:+custom.fats||0,calories:+custom.calories||0};
    setProducts(prev=>[...prev,p]);
    setLog(prev=>[...prev,{id:Date.now(),amount:1,...p}]);
    setCustom({name:'',nameHe:'',protein:'',carbs:'',fats:'',calories:''});
    setShowCustom(false);
  }

  const todayDate=new Date();
  const isTodayView=isToday(currentDate);
  const isPast=currentDate<new Date(dateStr(todayDate));
  const displayDate=currentDate.toLocaleDateString(rtl?'he-IL':'en-GB',{weekday:'long',day:'numeric',month:'long'});

  const baseInp={background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 12px',color:C.text,fontSize:14,fontFamily:'Heebo',width:'100%'};

  return(
    <div style={{minHeight:'100vh',background:C.bg,paddingBottom:60,position:'relative'}}>
      <div style={{maxWidth:520,margin:'0 auto'}}>

        {/* Header */}
        <div style={{padding:'22px 20px 0',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <h1 style={{fontFamily:'Heebo',fontSize:20,fontWeight:800,color:C.text,margin:0,letterSpacing:'-0.02em'}}>nutri<span style={{color:C.accent}}>track</span></h1>
            </div>
            {/* Date nav */}
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <button onClick={()=>setCurrentDate(d=>addDays(d,-1))} style={{background:'none',border:'none',color:C.muted,fontSize:16,cursor:'pointer',padding:'0 2px',lineHeight:1}}>‹</button>
              <span style={{color:isTodayView?C.accent:C.muted,fontSize:12,fontFamily:'Heebo',fontWeight:isTodayView?600:400}}>{isTodayView?t.today:displayDate}</span>
              {!isTodayView&&<button onClick={()=>setCurrentDate(d=>addDays(d,1))} style={{background:'none',border:'none',color:C.muted,fontSize:16,cursor:'pointer',padding:'0 2px',lineHeight:1}}>›</button>}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'flex-start',gap:7,flexShrink:0}}>
            <button onClick={()=>setShowProducts(true)} style={{padding:'6px 10px',borderRadius:9,background:C.card,border:`1px solid ${C.border}`,color:C.muted,fontSize:11,fontFamily:'Heebo',fontWeight:600,cursor:'pointer'}}>{t.productsBtn}</button>
            <LangToggle lang={lang} setLang={setLang}/>
            <button onClick={()=>setShowSettings(true)} style={{width:30,height:30,borderRadius:8,background:C.card,border:`1px solid ${C.border}`,color:C.muted,fontSize:15,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>⚙</button>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:'Heebo',fontSize:24,fontWeight:700,color:remaining>=0?C.accent:C.fats,lineHeight:1}}>{Math.abs(remaining)}</div>
              <div style={{color:C.muted,fontSize:10,marginTop:3}}>{remaining>=0?t.kcalLeft:t.kcalOver}</div>
            </div>
          </div>
        </div>

        {/* Past day banner */}
        {!isTodayView&&(
          <div style={{margin:'14px 20px 0',background:`${C.carbs}14`,borderRadius:10,padding:'8px 14px',border:`1px solid ${C.carbs}30`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{color:C.carbs,fontSize:12,fontFamily:'Heebo'}}>{displayDate}</span>
            <button onClick={()=>setCurrentDate(new Date())} style={{background:'none',border:'none',color:C.carbs,fontSize:11,fontFamily:'Heebo',cursor:'pointer',fontWeight:600}}>{t.today} →</button>
          </div>
        )}

        {/* Rings */}
        <div style={{margin:'14px 20px 0',background:C.card,borderRadius:20,padding:'18px 12px',border:`1px solid ${C.border}`,display:'flex',justifyContent:'space-around'}}>
          <Ring label={t.calLabel} value={totals.calories} goal={goals.goalCalories} color={C.cal} unit=""/>
          <Ring label={t.proteinLabel} value={totals.protein} goal={goals.protein} color={C.protein}/>
          <Ring label={t.carbsLabel} value={totals.carbs} goal={goals.carbs} color={C.carbs}/>
          <Ring label={t.fatsLabel} value={totals.fats} goal={goals.fats} color={C.fats}/>
        </div>

        {/* Search (only on today) */}
        {isTodayView&&(
          <div style={{margin:'14px 20px 0',position:'relative'}}>
            <div style={{display:'flex',gap:8}}>
              <div style={{flex:1,position:'relative'}}>
                <input value={query} onChange={e=>setQuery(e.target.value)} onFocus={()=>query&&setDropOpen(true)} onBlur={()=>setTimeout(()=>setDropOpen(false),160)}
                  placeholder={t.searchPlaceholder} dir="auto"
                  style={{...baseInp,[`padding${rtl?'Right':'Left'}`]:38}}/>
                <span style={{position:'absolute',[iconSide]:12,top:'50%',transform:'translateY(-50%)',color:C.muted,fontSize:15}}>⌕</span>
                {query&&<button onClick={()=>{setQuery('');setDropOpen(false);}} style={{position:'absolute',[rtl?'left':'right']:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:C.muted,fontSize:15,cursor:'pointer',padding:0}}>✕</button>}
              </div>
              <button onClick={()=>setShowCustom(true)} style={{padding:'0 13px',background:C.card,border:`1px solid ${C.border}`,borderRadius:10,color:C.muted,fontSize:12,fontFamily:'Heebo',whiteSpace:'nowrap',cursor:'pointer'}}>{t.customBtn}</button>
            </div>
            {dropOpen&&results.length>0&&(
              <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:80,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden',zIndex:100,boxShadow:'0 20px 48px rgba(0,0,0,0.6)'}}>
                {results.map((p,i)=>(
                  <button key={i} onMouseDown={()=>pick(p)} onMouseEnter={()=>setHovIdx(i)} onMouseLeave={()=>setHovIdx(-1)}
                    style={{width:'100%',padding:'10px 15px',background:i===hovIdx?'rgba(255,255,255,0.04)':'none',border:'none',borderBottom:i<results.length-1?`1px solid ${C.border}`:'none',display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer',textAlign:'left'}}>
                    <div>
                      <div style={{display:'flex',alignItems:'baseline',gap:7}}>
                        <span style={{color:C.text,fontSize:13,fontFamily:'Heebo',fontWeight:500}}>{p.name}</span>
                        {p.nameHe&&<span style={{color:C.accent,fontSize:12,fontFamily:'Heebo',direction:'rtl'}}>{p.nameHe}</span>}
                      </div>
                      <div style={{color:C.muted,fontSize:11,marginTop:2}}>
                        <span style={{color:C.protein}}>P:{p.protein}g</span> · <span style={{color:C.carbs}}>C:{p.carbs}g</span> · <span style={{color:C.fats}}>F:{p.fats}g</span>
                      </div>
                    </div>
                    <span style={{color:C.cal,fontSize:13,fontWeight:700,fontFamily:'Heebo',flexShrink:0,marginLeft:8}}>{p.calories} kcal</span>
                  </button>
                ))}
              </div>
            )}
            {dropOpen&&results.length===0&&query.trim()&&(
              <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:80,background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'13px 16px',zIndex:100,textAlign:'center'}}>
                <p style={{color:C.muted,fontSize:13,fontFamily:'Heebo'}}>
                  {t.noMatch(query)}{' '}
                  <button onMouseDown={()=>{setShowCustom(true);setCustom(c=>({...c,[rtl?'nameHe':'name']:query}));}} style={{background:'none',border:'none',color:C.accent,cursor:'pointer',fontSize:13,padding:0,fontFamily:'Heebo'}}>{t.addManually}</button>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Log */}
        <div style={{margin:'16px 20px 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h3 style={{fontFamily:'Heebo',fontSize:11,fontWeight:600,color:C.muted,letterSpacing:'0.08em',textTransform:'uppercase',margin:0}}>{t.logTitle}</h3>
          {log.length>0&&isTodayView&&<button onClick={()=>setLog([])} style={{background:'none',border:'none',color:C.muted,fontSize:11,cursor:'pointer',fontFamily:'Heebo'}}>{t.clearAll}</button>}
        </div>

        <div style={{margin:'10px 20px 0'}}>
          {!logReady?(
            <div style={{background:C.card,borderRadius:16,padding:'28px',textAlign:'center',border:`1px solid ${C.border}`}}>
              <div style={{width:24,height:24,border:`2px solid ${C.border}`,borderTop:`2px solid ${C.accent}`,borderRadius:'50%',animation:'spin 0.9s linear infinite',margin:'0 auto'}}/>
            </div>
          ):log.length===0?(
            <div style={{background:C.card,borderRadius:16,padding:'36px',textAlign:'center',border:`1px solid ${C.border}`}}>
              <div style={{fontSize:34,marginBottom:10}}>🍽️</div>
              <p style={{color:C.muted,fontSize:13,fontFamily:'Heebo'}}>{t.emptyLog}</p>
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {log.map(item=>(
                <div key={item.id} style={{background:C.card,borderRadius:13,padding:'12px 14px',border:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:12}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'baseline',gap:5,flexWrap:'wrap'}}>
                      <span style={{color:C.text,fontSize:13,fontFamily:'Heebo',fontWeight:500}}>{displayName(item,lang)}</span>
                      <span style={{color:C.muted,fontSize:11,flexShrink:0}}>×{item.amount}</span>
                    </div>
                    <div style={{fontSize:11,marginTop:3}}>
                      <span style={{color:C.protein}}>P {Math.round(item.protein*item.amount)}g</span>
                      <span style={{color:C.muted,margin:'0 4px'}}>·</span>
                      <span style={{color:C.carbs}}>C {Math.round(item.carbs*item.amount)}g</span>
                      <span style={{color:C.muted,margin:'0 4px'}}>·</span>
                      <span style={{color:C.fats}}>F {Math.round(item.fats*item.amount)}g</span>
                    </div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{color:C.cal,fontSize:14,fontFamily:'Heebo',fontWeight:700}}>{Math.round(item.calories*item.amount)}</div>
                    <div style={{color:C.muted,fontSize:10}}>kcal</div>
                  </div>
                  {isTodayView&&<button onClick={()=>setLog(l=>l.filter(i=>i.id!==item.id))} style={{background:'none',border:'none',color:C.muted,fontSize:16,padding:'0 2px',cursor:'pointer',lineHeight:1,flexShrink:0}}>✕</button>}
                </div>
              ))}
            </div>
          )}
        </div>

        {log.length>0&&(
          <div style={{margin:'10px 20px 0',background:C.card,borderRadius:12,padding:'11px 15px',border:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{color:C.muted,fontSize:10,textTransform:'uppercase',letterSpacing:'0.07em',fontFamily:'Heebo'}}>{t.total}</span>
            <div style={{display:'flex',gap:16}}>
              {[{l:'P',v:totals.protein,c:C.protein},{l:'C',v:totals.carbs,c:C.carbs},{l:'F',v:totals.fats,c:C.fats},{l:'kcal',v:totals.calories,c:C.cal}].map(({l,v,c})=>(
                <div key={l} style={{textAlign:'center'}}>
                  <div style={{color:c,fontSize:13,fontWeight:700,fontFamily:'Heebo'}}>{Math.round(v)}</div>
                  <div style={{color:C.muted,fontSize:9}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Amount modal */}
      {showAmt&&selected&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.78)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:'20px'}}>
          <div style={{background:C.card,borderRadius:22,padding:'28px',width:'100%',maxWidth:340,border:`1px solid ${C.border}`,boxShadow:'0 40px 80px rgba(0,0,0,0.7)'}}>
            <div style={{marginBottom:3}}>
              <span style={{color:C.text,fontSize:17,fontFamily:'Heebo',fontWeight:700}}>{selected.name}</span>
              {selected.nameHe&&<span style={{color:C.accent,fontSize:15,fontFamily:'Heebo',fontWeight:600,marginRight:8,direction:'rtl',display:'inline-block'}}> · {selected.nameHe}</span>}
            </div>
            <p style={{color:C.muted,fontSize:12,marginBottom:14}}>{t.perServing} P:{selected.protein}g · C:{selected.carbs}g · F:{selected.fats}g · {selected.calories} kcal</p>
            <div style={{background:C.card2,borderRadius:8,padding:'7px 11px',marginBottom:18,display:'flex',gap:6,alignItems:'flex-start'}}>
              <span style={{fontSize:13}}>💡</span>
              <p style={{color:C.muted,fontSize:11,margin:0,lineHeight:1.5,fontFamily:'Heebo'}}>{t.weightTip}</p>
            </div>
            <label style={{display:'block',color:C.muted,fontSize:10,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6,fontFamily:'Heebo'}}>{t.amountLabel}</label>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} min="0.1" step="0.1" autoFocus
              style={{...baseInp,fontSize:22,fontFamily:'Heebo',fontWeight:700,textAlign:'center',marginBottom:12}}/>
            <div style={{background:C.card2,borderRadius:10,padding:'10px 13px',marginBottom:22}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{color:C.cal,fontFamily:'Heebo',fontWeight:700,fontSize:14}}>{Math.round((selected.calories||0)*+(amount||0))} kcal</span>
                <div style={{display:'flex',gap:10,fontSize:12}}>
                  <span style={{color:C.protein}}>P:{Math.round((selected.protein||0)*+(amount||0))}g</span>
                  <span style={{color:C.carbs}}>C:{Math.round((selected.carbs||0)*+(amount||0))}g</span>
                  <span style={{color:C.fats}}>F:{Math.round((selected.fats||0)*+(amount||0))}g</span>
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setShowAmt(false)} style={{flex:1,padding:'11px',borderRadius:10,background:C.card2,border:`1px solid ${C.border}`,color:C.muted,fontSize:13,fontFamily:'Heebo',cursor:'pointer'}}>{t.cancel}</button>
              <button onClick={addToLog} style={{flex:2,padding:'11px',borderRadius:10,background:C.accent,border:'none',color:'#07101A',fontSize:14,fontFamily:'Heebo',fontWeight:700,cursor:'pointer'}}>{t.addToLog}</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom food modal */}
      {showCustom&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.78)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:'20px',overflowY:'auto'}}>
          <div style={{background:C.card,borderRadius:22,padding:'28px',width:'100%',maxWidth:380,border:`1px solid ${C.border}`,boxShadow:'0 40px 80px rgba(0,0,0,0.7)',margin:'auto'}}>
            <h3 style={{fontFamily:'Heebo',fontSize:17,fontWeight:700,color:C.text,marginBottom:3}}>{t.addCustomTitle}</h3>
            <p style={{color:C.muted,fontSize:12,marginBottom:18}}>{t.addCustomSub}</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
              <div>
                <label style={{display:'block',color:C.muted,fontSize:10,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:5,fontFamily:'Heebo'}}>{t.nameLabel}</label>
                <input value={custom.name} onChange={e=>setCustom(p=>({...p,name:e.target.value}))} placeholder="e.g. Yogurt" dir="ltr" style={{...baseInp,fontSize:13}}/>
              </div>
              <div>
                <label style={{display:'block',color:C.accent,fontSize:10,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:5,fontFamily:'Heebo'}}>{t.heNameLabel}</label>
                <input value={custom.nameHe} onChange={e=>setCustom(p=>({...p,nameHe:e.target.value}))} placeholder={t.heNamePlaceholder} dir="rtl" style={{...baseInp,fontSize:13,border:`1px solid ${C.accent}44`}}/>
              </div>
            </div>
            {[{k:'calories',l:t.calField},{k:'protein',l:t.proteinField},{k:'carbs',l:t.carbsField},{k:'fats',l:t.fatsField}].map(({k,l})=>(
              <div key={k} style={{marginBottom:10}}>
                <label style={{display:'block',color:C.muted,fontSize:10,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:5,fontFamily:'Heebo'}}>{l}</label>
                <input type="number" value={custom[k]} onChange={e=>setCustom(p=>({...p,[k]:e.target.value}))} style={{...baseInp,fontSize:13}}/>
              </div>
            ))}
            <div style={{background:C.card2,borderRadius:8,padding:'7px 11px',margin:'12px 0',display:'flex',gap:6}}>
              <span style={{fontSize:13}}>💾</span>
              <p style={{color:C.muted,fontSize:11,margin:0,fontFamily:'Heebo'}}>{t.savedNote}</p>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setShowCustom(false)} style={{flex:1,padding:'11px',borderRadius:10,background:C.card2,border:`1px solid ${C.border}`,color:C.muted,fontSize:13,fontFamily:'Heebo',cursor:'pointer'}}>{t.cancel}</button>
              <button onClick={addCustom} style={{flex:2,padding:'11px',borderRadius:10,background:C.accent,border:'none',color:'#07101A',fontSize:14,fontFamily:'Heebo',fontWeight:700,cursor:'pointer'}}>{t.addAndLog}</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettings&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.78)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:'20px'}}>
          <div style={{background:C.card,borderRadius:22,padding:'28px',width:'100%',maxWidth:340,border:`1px solid ${C.border}`,boxShadow:'0 40px 80px rgba(0,0,0,0.7)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h3 style={{fontFamily:'Heebo',fontSize:17,fontWeight:700,color:C.text,margin:0}}>{t.settingsTitle}</h3>
              <button onClick={()=>setShowSettings(false)} style={{background:'none',border:'none',color:C.muted,fontSize:18,cursor:'pointer',padding:0}}>✕</button>
            </div>

            {/* Export */}
            <div style={{marginBottom:8}}>
              <button onClick={()=>{setShowSettings(false);exportAllData();}}
                style={{width:'100%',padding:'12px',borderRadius:11,background:C.card2,border:`1px solid ${C.border}`,color:C.text,fontSize:14,fontFamily:'Heebo',fontWeight:500,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:18}}>📤</span>
                <div>
                  <div>{t.exportBtn.replace('📤 ','')}</div>
                  <div style={{color:C.muted,fontSize:11,marginTop:2}}>{t.exportNote}</div>
                </div>
              </button>
            </div>

            {/* Import */}
            <div style={{marginBottom:16}}>
              <button onClick={()=>{
                setShowSettings(false);
                importAllData(
                  data => { alert(t.importSuccess); onImport(data); },
                  ()   => alert(t.importError)
                );
              }} style={{width:'100%',padding:'12px',borderRadius:11,background:C.card2,border:`1px solid ${C.border}`,color:C.text,fontSize:14,fontFamily:'Heebo',fontWeight:500,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:18}}>📥</span>
                <div>
                  <div>{t.importBtn.replace('📥 ','')}</div>
                  <div style={{color:C.muted,fontSize:11,marginTop:2}}>{t.importNote}</div>
                </div>
              </button>
            </div>

            <div style={{height:'1px',background:C.border,marginBottom:16}}/>

            <button onClick={()=>{setShowSettings(false);onRecalculate();}}
              style={{width:'100%',padding:'12px',borderRadius:11,background:C.card2,border:`1px solid ${C.border}`,color:C.text,fontSize:14,fontFamily:'Heebo',fontWeight:500,cursor:'pointer',marginBottom:8,textAlign:'left',display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:18}}>🔄</span>{t.recalcBtn}
            </button>
            <button onClick={()=>{if(window.confirm(t.resetConfirm)){setShowSettings(false);onResetAll();}}}
              style={{width:'100%',padding:'12px',borderRadius:11,background:`${C.fats}14`,border:`1px solid ${C.fats}30`,color:C.fats,fontSize:14,fontFamily:'Heebo',fontWeight:500,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:18}}>🗑️</span>{t.resetBtn}
            </button>
          </div>
        </div>
      )}

      {showProducts&&<ProductsPanel products={products} setProducts={setProducts} onClose={()=>setShowProducts(false)} lang={lang}/>}
    </div>
  );
}

// ─────────────────────── APP ───────────────────────
export default function App(){
  const[screen,setScreen]=useState('loading');
  const[profile,setProfile]=useState(null);
  const[goals,setGoals]=useState(null);
  const[products,setProducts]=useState(DEFAULT_PRODUCTS);
  const[lang,setLang]=useState('en');

  // Load font
  useEffect(()=>{
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  },[]);

  // Load all persisted state on mount
  useEffect(()=>{
    async function init(){
      const[prof,g,prods,lng]=await Promise.all([
        storageLoad('profile'),storageLoad('goals'),
        storageLoad('products'),storageLoad('lang'),
      ]);
      if(lng)setLang(lng);
      if(prods)setProducts(prods);
      if(prof&&g){setProfile(prof);setGoals(g);setScreen('tracker');}
      else setScreen('onboarding');
    }
    init();
  },[]);

  // Persist state changes
  useEffect(()=>{if(profile)storageSave('profile',profile);},[profile]);
  useEffect(()=>{if(goals)storageSave('goals',goals);},[goals]);
  useEffect(()=>{storageSave('products',products);},[products]);
  useEffect(()=>{storageSave('lang',lang);},[lang]);

  async function handleResetAll(){
    // Clear profile/goals/logs but keep products
    await storageDelete('profile');
    await storageDelete('goals');
    const keys=await storageListKeys('log:');
    await Promise.all(keys.map(k=>storageDelete(k)));
    setProfile(null);setGoals(null);setScreen('onboarding');
  }

  function handleImport(data) {
    if(data.lang)     setLang(data.lang);
    if(data.products) setProducts(data.products);
    if(data.profile)  setProfile(data.profile);
    if(data.goals)    setGoals(data.goals);
    if(data.profile && data.goals) setScreen('tracker');
    else setScreen('onboarding');
  }

  const t=TR[lang];

  if(screen==='loading')return(
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:C.bg,gap:16}}>
      <div style={{width:44,height:44,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.accent}`,borderRadius:'50%',animation:'spin 0.9s linear infinite'}}/>
      <p style={{color:C.muted,fontFamily:'Heebo',fontSize:14}}>{t.loading}</p>
    </div>
  );

  return(
    <div dir={lang==='he'?'rtl':'ltr'} style={{background:C.bg,minHeight:'100vh',color:C.text,fontFamily:'Heebo, system-ui, sans-serif'}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        input::placeholder{color:#2D4060;}
        input{outline:none;}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        button{cursor:pointer;transition:transform 0.12s,opacity 0.12s;font-family:Heebo,sans-serif;}
        button:active{transform:scale(0.97);}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:#162437;border-radius:3px;}
        @keyframes spin{to{transform:rotate(360deg);}}
      `}</style>
      {screen==='onboarding'&&<Onboarding onSubmit={p=>{setProfile(p);setScreen('report');}} lang={lang} setLang={setLang}/>}
      {screen==='report'&&<Report profile={profile} onStart={g=>{setGoals(g);setScreen('tracker');}} lang={lang} setLang={setLang}/>}
      {screen==='tracker'&&<Tracker goals={goals} products={products} setProducts={setProducts} lang={lang} setLang={setLang}
        onRecalculate={()=>{setGoals(null);setScreen('onboarding');}}
        onResetAll={handleResetAll}
        onImport={handleImport}/>}
    </div>
  );
}
