"use client";
import { useState, useRef, useCallback, useEffect } from "react";

const STEPS = ["Fahrzeug","Details","Zustand","Fotos","Veröffentlichen"];
const BRANDS = ["Audi","BMW","Mercedes-Benz","Volkswagen","Ford","Opel","Toyota","Renault","Skoda","Seat","Hyundai","Kia","Nissan","Mazda","Volvo","Porsche","Andere"];
const MODELS = { "Audi":["A1","A3","A4","A6","Q3","Q5","Q7","TT"], "BMW":["1er","2er","3er","4er","5er","X1","X3","X5","M3"], "Mercedes-Benz":["A-Klasse","C-Klasse","E-Klasse","S-Klasse","GLA","GLC","GLE"], "Volkswagen":["Golf","Polo","Passat","Tiguan","T-Roc","ID.4","ID.3"], "Ford":["Fiesta","Focus","Puma","Kuga","Mustang"], "Opel":["Corsa","Astra","Insignia","Mokka"], "Toyota":["Yaris","Corolla","RAV4","C-HR"], "Renault":["Clio","Megane","Captur","Zoe"], "Andere":["Sonstiges"] };
const FUEL_TYPES = ["Benzin","Diesel","Elektro","Hybrid","Plug-in-Hybrid","Erdgas","LPG"];
const GEARBOX = ["Schaltgetriebe","Automatik","Halbautomatik"];
const CONDITIONS = ["Neu","Neuwertig","Gut","Gebraucht","Mit Mängeln"];
const BODY_TYPES = ["Limousine","Kombi","SUV","Coupe","Cabrio","Van","Pickup","Kleinwagen"];
const COLORS = ["Schwarz","Weiß","Silber","Grau","Blau","Rot","Grün","Braun","Beige","Orange","Gelb","Sonstige"];
const DURATIONS = ["7 Tage","14 Tage","30 Tage"];
const PLATE_API_TOKEN = "a8f921f9a538ed3af6e796debf4e6a2e3059d080";

const initialForm = { brand:"",model:"",year:"",bodyType:"",price:"",mileage:"",fuel:"",gearbox:"",power:"",color:"",condition:"",description:"",seats:"",doors:"",firstRegistration:"",vin:"",images:[],duration:"30 Tage",name:"",phone:"",location:"",agreeTerms:false };

// ── Plate blur ────────────────────────────────────────────────────────────────
async function applyBlurFromCoords(dataUrl, results) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      if (results.length === 0) {
        applyBottomBlur(ctx, img.width, img.height);
      } else {
        results.forEach(r => {
          const { xmin, ymin, xmax, ymax } = r.box;
          const pad = 12;
          const x = Math.max(0, xmin-pad), y = Math.max(0, ymin-pad);
          const w = Math.min(img.width, xmax+pad)-x, h = Math.min(img.height, ymax+pad)-y;
          ctx.save(); ctx.filter="blur(12px)";
          for (let i=0;i<4;i++) ctx.drawImage(canvas,x,y,w,h,x,y,w,h);
          ctx.restore();
          ctx.fillStyle="rgba(0,0,0,0.85)"; ctx.fillRect(x,y,w,h);
          ctx.fillStyle="rgba(255,255,255,0.9)";
          ctx.font=`bold ${Math.max(9,h*0.45)}px sans-serif`;
          ctx.textAlign="center"; ctx.textBaseline="middle";
          ctx.fillText("🛡️", x+w/2, y+h/2);
        });
      }
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.src = dataUrl;
  });
}
function applyBottomBlur(ctx, w, h) {
  const y = Math.floor(h*0.80);
  ctx.fillStyle="rgba(0,0,0,0.8)"; ctx.fillRect(0,y,w,h-y);
  ctx.fillStyle="rgba(255,255,255,0.85)";
  ctx.font=`bold ${Math.max(10,w*0.03)}px sans-serif`;
  ctx.textAlign="center";
  ctx.fillText("🛡️ KENNZEICHEN GESCHWÄRZT", w/2, y+(h-y)/2+4);
}

// ── Styles ────────────────────────────────────────────────────────────────────
const inputStyle = { width:"100%", padding:"12px 14px", borderRadius:10, border:"1.5px solid #D0DCF0", fontSize:14, color:"#1A2B4B", background:"#F8FAFD", outline:"none", fontFamily:"'Inter',sans-serif", boxSizing:"border-box", transition:"border-color 0.2s,box-shadow 0.2s" };
const selectStyle = { ...inputStyle, appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7C93' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", paddingRight:40 };
const fStyle = (f) => ({ borderColor:f?"#0052CC":"#D0DCF0", boxShadow:f?"0 0 0 3px rgba(0,82,204,0.1)":"none" });
const useFocus = () => { const [f,setF]=useState(false); return [f,{onFocus:()=>setF(true),onBlur:()=>setF(false)}]; };

const Field = ({label,required,children,hint}) => (
  <div style={{marginBottom:16}}>
    <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",color:"#1A2B4B",marginBottom:5,fontFamily:"'Inter',sans-serif"}}>
      {label}{required&&<span style={{color:"#0052CC",marginLeft:2}}>*</span>}
    </label>
    {children}
    {hint&&<p style={{fontSize:11,color:"#6B7C93",marginTop:4,fontFamily:"'Inter',sans-serif"}}>{hint}</p>}
  </div>
);
const Input = ({value,onChange,placeholder,type="text",...rest}) => {
  const [f,fp]=useFocus();
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{...inputStyle,...fStyle(f)}} {...fp} {...rest} />;
};
const Select = ({value,onChange,children,disabled}) => {
  const [f,fp]=useFocus();
  return <select value={value} onChange={onChange} disabled={disabled} style={{...selectStyle,...fStyle(f),opacity:disabled?0.5:1}} {...fp}>{children}</select>;
};
const Row = ({children}) => <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{children}</div>;
const SectionTitle = ({icon,title,subtitle}) => (
  <div style={{marginBottom:22}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:3}}>
      <span style={{fontSize:20}}>{icon}</span>
      <h2 style={{margin:0,fontSize:19,fontWeight:800,color:"#1A2B4B",fontFamily:"'Inter',sans-serif"}}>{title}</h2>
    </div>
    <p style={{margin:0,fontSize:12,color:"#6B7C93",fontFamily:"'Inter',sans-serif",paddingLeft:30}}>{subtitle}</p>
  </div>
);

// ── Steps ─────────────────────────────────────────────────────────────────────
const StepFahrzeug = ({form,update}) => (
  <div>
    <SectionTitle icon="🚗" title="Fahrzeugdaten" subtitle="Marke, Modell und Karosserie" />
    <Field label="Marke" required>
      <Select value={form.brand} onChange={e=>update("brand",e.target.value)}>
        <option value="">Marke wählen</option>
        {BRANDS.map(b=><option key={b}>{b}</option>)}
      </Select>
    </Field>
    <Field label="Modell" required>
      <Select value={form.model} onChange={e=>update("model",e.target.value)} disabled={!form.brand}>
        <option value="">Modell wählen</option>
        {(MODELS[form.brand]||[]).map(m=><option key={m}>{m}</option>)}
      </Select>
    </Field>
    <Row>
      <Field label="Baujahr" required>
        <Select value={form.year} onChange={e=>update("year",e.target.value)}>
          <option value="">Jahr</option>
          {Array.from({length:35},(_,i)=>2024-i).map(y=><option key={y}>{y}</option>)}
        </Select>
      </Field>
      <Field label="Karosserie">
        <Select value={form.bodyType} onChange={e=>update("bodyType",e.target.value)}>
          <option value="">Typ</option>
          {BODY_TYPES.map(b=><option key={b}>{b}</option>)}
        </Select>
      </Field>
    </Row>
    <Field label="Preis (€)" required>
      <Input value={form.price} onChange={e=>update("price",e.target.value)} placeholder="z.B. 12500" type="number" />
    </Field>
  </div>
);

const StepDetails = ({form,update}) => (
  <div>
    <SectionTitle icon="⚙️" title="Technische Details" subtitle="Motor, Getriebe und Ausstattung" />
    <Field label="Kilometerstand" required>
      <Input value={form.mileage} onChange={e=>update("mileage",e.target.value)} placeholder="z.B. 85000" type="number" />
    </Field>
    <Row>
      <Field label="Kraftstoff" required>
        <Select value={form.fuel} onChange={e=>update("fuel",e.target.value)}>
          <option value="">Kraftstoff</option>
          {FUEL_TYPES.map(f=><option key={f}>{f}</option>)}
        </Select>
      </Field>
      <Field label="Getriebe">
        <Select value={form.gearbox} onChange={e=>update("gearbox",e.target.value)}>
          <option value="">Getriebe</option>
          {GEARBOX.map(g=><option key={g}>{g}</option>)}
        </Select>
      </Field>
    </Row>
    <Row>
      <Field label="Leistung (PS)">
        <Input value={form.power} onChange={e=>update("power",e.target.value)} placeholder="150" type="number" />
      </Field>
      <Field label="Farbe">
        <Select value={form.color} onChange={e=>update("color",e.target.value)}>
          <option value="">Farbe</option>
          {COLORS.map(c=><option key={c}>{c}</option>)}
        </Select>
      </Field>
    </Row>
    <Row>
      <Field label="Sitze">
        <Select value={form.seats} onChange={e=>update("seats",e.target.value)}>
          <option value="">Sitze</option>
          {[2,3,4,5,6,7,8,9].map(n=><option key={n}>{n}</option>)}
        </Select>
      </Field>
      <Field label="Türen">
        <Select value={form.doors} onChange={e=>update("doors",e.target.value)}>
          <option value="">Türen</option>
          {[2,3,4,5].map(n=><option key={n}>{n}</option>)}
        </Select>
      </Field>
    </Row>
    <Field label="Erstzulassung">
      <Input value={form.firstRegistration} onChange={e=>update("firstRegistration",e.target.value)} type="month" />
    </Field>
  </div>
);

const StepZustand = ({form,update}) => (
  <div>
    <SectionTitle icon="📋" title="Zustand & Beschreibung" subtitle="Fahrzeugzustand und Details" />
    <Field label="Fahrzeugzustand" required>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {CONDITIONS.map(c=>(
          <button key={c} onClick={()=>update("condition",c)} style={{padding:"10px 8px",borderRadius:10,border:"1.5px solid",borderColor:form.condition===c?"#0052CC":"#D0DCF0",background:form.condition===c?"#EBF2FF":"#F8FAFD",color:form.condition===c?"#0052CC":"#4A5D70",fontSize:13,fontWeight:form.condition===c?700:400,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all 0.2s"}}>
            {c}
          </button>
        ))}
      </div>
    </Field>
    <Field label="Beschreibung" hint="So genau wie möglich beschreiben">
      <textarea value={form.description} onChange={e=>update("description",e.target.value)} placeholder="z.B. Gepflegt, Nichtraucher, frischer TÜV…" rows={4} style={{...inputStyle,resize:"vertical",lineHeight:1.6}} />
    </Field>
    <Field label="FIN" hint="Optional — erhöht das Vertrauen">
      <Input value={form.vin} onChange={e=>update("vin",e.target.value)} placeholder="WVW ZZZ 1K ZAP…" />
    </Field>
  </div>
);

const StepFotos = ({form,update}) => {
  const fileRef = useRef();
  const [processing,setProcessing] = useState(false);
  const [msg,setMsg] = useState("");
  const [plateFound,setPlateFound] = useState(null);

  const handleFiles = useCallback(async (files) => {
    const valid = Array.from(files).filter(f=>f.type.startsWith("image/"));
    if (!valid.length) return;
    setProcessing(true); setPlateFound(null);

    for (const file of valid) {
      setMsg("📤 Foto wird hochgeladen…");
      const dataUrl = await new Promise(res=>{const r=new FileReader();r.onload=e=>res(e.target.result);r.readAsDataURL(file);});
      setMsg("🔍 Kennzeichen wird erkannt…");
      await new Promise(r=>setTimeout(r,500));

      const blob = await (await fetch(dataUrl)).blob();
      const fd = new FormData();
      fd.append("upload",blob,"car.jpg");
      fd.append("regions","de");

      let results=[];
      try {
        setMsg("🛡️ Kennzeichen wird geschwärzt…");
        const res = await fetch("https://api.platerecognizer.com/v1/plate-reader/",{method:"POST",headers:{Authorization:`Token ${PLATE_API_TOKEN}`},body:fd});
        const json = await res.json();
        results = json.results||[];
        setPlateFound(results.length>0);
      } catch { setPlateFound(false); }

      const blurred = await applyBlurFromCoords(dataUrl,results);
      update("images",prev=>[...prev,{url:blurred,name:file.name,plateFound:results.length>0}]);
    }
    setProcessing(false); setMsg("");
  },[update]);

  const removeImage = (idx) => update("images",prev=>prev.filter((_,i)=>i!==idx));

  return (
    <div>
      <SectionTitle icon="📸" title="Fahrzeugfotos" subtitle="Kennzeichen werden automatisch erkannt & geschwärzt" />

      <div onClick={()=>!processing&&fileRef.current?.click()}
        onDrop={e=>{e.preventDefault();handleFiles(e.dataTransfer.files);}}
        onDragOver={e=>e.preventDefault()}
        style={{border:"2px dashed #B8D0EE",borderRadius:14,padding:"28px 20px",textAlign:"center",background:processing?"#F0F6FF":"#F8FAFD",cursor:processing?"wait":"pointer",marginBottom:14,minHeight:120,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        {processing?(
          <>
            <div style={{fontSize:28,marginBottom:8}}>{msg.includes("erkannt")?"🔍":msg.includes("geschwärzt")?"🛡️":"📤"}</div>
            <p style={{fontSize:14,fontWeight:700,color:"#1A2B4B",margin:"0 0 10px",fontFamily:"'Inter',sans-serif"}}>{msg}</p>
            <div style={{width:160,height:3,background:"#D0DCF0",borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",background:"#0052CC",borderRadius:4,animation:"progress 1.5s ease-in-out infinite"}} />
            </div>
          </>
        ):(
          <>
            <div style={{fontSize:32,marginBottom:8}}>📷</div>
            <p style={{fontSize:14,fontWeight:700,color:"#1A2B4B",margin:"0 0 4px",fontFamily:"'Inter',sans-serif"}}>Fotos hochladen</p>
            <p style={{fontSize:12,color:"#6B7C93",margin:0,fontFamily:"'Inter',sans-serif"}}>Tippen oder hierher ziehen · JPG, PNG</p>
          </>
        )}
        <input ref={fileRef} type="file" multiple accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>handleFiles(e.target.files)} />
      </div>

      {plateFound===true&&(
        <div style={{background:"#E8F5E9",border:"1px solid #A5D6A7",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>✅</span>
          <p style={{fontSize:13,color:"#2E7D32",margin:0,fontWeight:700,fontFamily:"'Inter',sans-serif"}}>Kennzeichen erkannt und geschwärzt!</p>
        </div>
      )}
      {plateFound===false&&(
        <div style={{background:"#FFF8E1",border:"1px solid #FFD54F",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>⚠️</span>
          <p style={{fontSize:12,color:"#795548",margin:0,fontFamily:"'Inter',sans-serif"}}>Kein Kennzeichen erkannt — unterer Bereich geschwärzt.</p>
        </div>
      )}

      <div style={{background:"#EBF2FF",border:"1px solid #B8D0EE",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16}}>🛡️</span>
        <p style={{fontSize:12,color:"#003D99",margin:0,fontFamily:"'Inter',sans-serif"}}><strong>KI-Kennzeichenerkennung:</strong> Automatisch erkannt und geschwärzt.</p>
      </div>

      {form.images.length>0&&(
        <div>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",color:"#1A2B4B",marginBottom:10,fontFamily:"'Inter',sans-serif"}}>
            {form.images.length} Foto{form.images.length!==1?"s":""} ✅
          </p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {form.images.map((img,i)=>(
              <div key={i} style={{position:"relative",borderRadius:10,overflow:"hidden",aspectRatio:"4/3",background:"#F0F4FA"}}>
                <img src={img.url} alt="" style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"cover"}} />
                {i===0&&<div style={{position:"absolute",top:6,left:6,background:"#0052CC",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20}}>TITELBILD</div>}
                <button onClick={e=>{e.stopPropagation();removeImage(i);}} style={{position:"absolute",top:6,right:6,width:22,height:22,borderRadius:"50%",background:"rgba(0,0,0,0.6)",border:"none",color:"#fff",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StepVeroeffentlichen = ({form,update,userName}) => {
  const fmt = (n) => parseInt(n).toLocaleString("de-DE");
  return (
    <div>
      <SectionTitle icon="🚀" title="Veröffentlichen" subtitle="Fast geschafft — letzte Details" />
      {userName&&(
        <div style={{background:"#EBF2FF",border:"1px solid #B8D0EE",borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>👤</span>
          <p style={{fontSize:13,color:"#003D99",margin:0,fontFamily:"'Inter',sans-serif"}}>Angemeldet als <strong>{userName}</strong></p>
        </div>
      )}
      <Field label="Laufzeit" required>
        <div style={{display:"flex",gap:8}}>
          {DURATIONS.map(d=>(
            <button key={d} onClick={()=>update("duration",d)} style={{flex:1,padding:"10px 4px",borderRadius:10,border:"1.5px solid",borderColor:form.duration===d?"#0052CC":"#D0DCF0",background:form.duration===d?"#EBF2FF":"#F8FAFD",color:form.duration===d?"#0052CC":"#4A5D70",fontSize:13,fontWeight:form.duration===d?700:400,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all 0.2s"}}>
              {d}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Ihr Name" required><Input value={form.name} onChange={e=>update("name",e.target.value)} placeholder="Max Mustermann" /></Field>
      <Field label="Telefonnummer"><Input value={form.phone} onChange={e=>update("phone",e.target.value)} placeholder="+49 170 1234567" type="tel" /></Field>
      <Field label="Standort" required><Input value={form.location} onChange={e=>update("location",e.target.value)} placeholder="z.B. 80331 München" /></Field>

      <div style={{background:"#F4F7FB",borderRadius:12,padding:14,marginBottom:16}}>
        <p style={{fontSize:12,fontWeight:700,color:"#1A2B4B",margin:"0 0 8px",fontFamily:"'Inter',sans-serif"}}>📋 Zusammenfassung</p>
        {[["Fahrzeug",[form.brand,form.model,form.year].filter(Boolean).join(" ")||"–"],["Preis",form.price?`${fmt(form.price)} €`:"–"],["Kilometerstand",form.mileage?`${fmt(form.mileage)} km`:"–"],["Kraftstoff",form.fuel||"–"],["Fotos",form.images.length>0?`${form.images.length} Foto(s) 🛡️`:"Keine"]].map(([l,v])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #E0E8F4"}}>
            <span style={{fontSize:12,color:"#6B7C93",fontFamily:"'Inter',sans-serif"}}>{l}</span>
            <span style={{fontSize:12,fontWeight:600,color:"#1A2B4B",fontFamily:"'Inter',sans-serif"}}>{v}</span>
          </div>
        ))}
      </div>

      <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer"}}>
        <input type="checkbox" checked={form.agreeTerms} onChange={e=>update("agreeTerms",e.target.checked)} style={{width:18,height:18,marginTop:2,accentColor:"#0052CC",flexShrink:0}} />
        <span style={{fontSize:12,color:"#4A5D70",lineHeight:1.5,fontFamily:"'Inter',sans-serif"}}>
          Ich stimme den <a href="#" style={{color:"#0052CC",textDecoration:"none",fontWeight:600}}>Nutzungsbedingungen</a> und der <a href="#" style={{color:"#0052CC",textDecoration:"none",fontWeight:600}}>Datenschutzerklärung</a> zu.
        </span>
      </label>
    </div>
  );
};

// ── Step indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({current,labels}) => (
  <div style={{padding:"0 20px 20px"}}>
    <div style={{display:"flex",alignItems:"center"}}>
      {labels.map((label,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",flex:i<labels.length-1?1:0}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,background:i<current?"#0052CC":i===current?"#0052CC":"#E0E8F4",color:i<=current?"#fff":"#6B7C93",border:i===current?"2px solid #0052CC":"2px solid transparent",transition:"all 0.3s",boxShadow:i===current?"0 0 0 3px rgba(0,82,204,0.15)":"none"}}>
              {i<current?"✓":i+1}
            </div>
            <span style={{fontSize:9,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase",color:i===current?"#0052CC":i<current?"#003D99":"#6B7C93",fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap"}}>{label}</span>
          </div>
          {i<labels.length-1&&<div style={{flex:1,height:2,margin:"0 4px",marginBottom:20,background:i<current?"#0052CC":"#E0E8F4",transition:"background 0.3s"}} />}
        </div>
      ))}
    </div>
  </div>
);

// ── Success ───────────────────────────────────────────────────────────────────
const SuccessScreen = ({form}) => (
  <div style={{textAlign:"center",padding:"40px 24px"}}>
    <div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#0052CC,#003D99)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:36}}>✅</div>
    <h2 style={{fontSize:22,fontWeight:800,color:"#1A2B4B",margin:"0 0 8px",fontFamily:"'Inter',sans-serif"}}>Inserat veröffentlicht!</h2>
    <p style={{fontSize:13,color:"#6B7C93",margin:"0 0 6px",lineHeight:1.6,fontFamily:"'Inter',sans-serif"}}>Ihr Fahrzeug ist jetzt auf AutoMarket.de sichtbar.</p>
    <p style={{fontSize:13,color:"#2E7D32",fontWeight:700,margin:"0 0 20px",fontFamily:"'Inter',sans-serif"}}>🛡️ Kennzeichen automatisch geschwärzt</p>
    {form.images.length>0&&(
      <div style={{marginBottom:20,borderRadius:12,overflow:"hidden",height:180,position:"relative",background:"#F0F4FA"}}>
        <img src={form.images[0].url} alt="Fahrzeug" style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"cover"}} />
      </div>
    )}
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <a href="/" style={{display:"block",padding:"14px",borderRadius:12,background:"#0052CC",color:"#fff",fontSize:15,fontWeight:700,fontFamily:"'Inter',sans-serif"}}>
        Mein Inserat ansehen →
      </a>
      <button onClick={()=>window.location.reload()} style={{padding:"14px",borderRadius:12,border:"1.5px solid #D0DCF0",background:"transparent",color:"#1A2B4B",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
        Weiteres Fahrzeug inserieren
      </button>
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CarPostingForm() {
  const [step,setStep] = useState(0);
  const [form,setForm] = useState(initialForm);
  const [submitted,setSubmitted] = useState(false);
  const [submitting,setSubmitting] = useState(false);
  const [userName,setUserName] = useState("");
  const [showLoginPrompt,setShowLoginPrompt] = useState(false);

  useEffect(() => {
    try {
      const u = localStorage.getItem("automarket_user");
      if (u) setUserName(u);
    } catch {}
  }, []);

  const handleGoogleLogin = () => {
    const name = "Toni M.";
    localStorage.setItem("automarket_user", name);
    setUserName(name);
    setShowLoginPrompt(false);
  };

  const update = (field,value) => setForm(prev=>({...prev,[field]:typeof value==="function"?value(prev[field]):value}));

  const canAdvance = () => {
    if (step===0) return form.brand&&form.model&&form.year&&form.price;
    if (step===1) return form.mileage&&form.fuel;
    if (step===2) return form.condition;
    if (step===4) return form.name&&form.location&&form.agreeTerms;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r=>setTimeout(r,1200));
    const newListing = {
      id:`user_${Date.now()}`,
      brand:form.brand, model:form.model, year:form.year,
      price:form.price, mileage:form.mileage, fuel:form.fuel,
      location:form.location, seller:"Privat",
      image:form.images.length>0?form.images[0].url:"https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=90",
      badge:null, isDemo:false,
    };
    try {
      const existing = JSON.parse(localStorage.getItem("automarket_listings")||"[]");
      localStorage.setItem("automarket_listings",JSON.stringify([newListing,...existing]));
      localStorage.setItem("automarket_new_listing",newListing.id);
    } catch {}
    setSubmitting(false);
    setSubmitted(true);
  };

  const steps = [
    <StepFahrzeug form={form} update={update} />,
    <StepDetails form={form} update={update} />,
    <StepZustand form={form} update={update} />,
    <StepFotos form={form} update={update} />,
    <StepVeroeffentlichen form={form} update={update} userName={userName} />,
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; } body { margin:0; background:#F4F7FB; }
        input:focus,select:focus,textarea:focus { outline:none; }
        button:active { transform:scale(0.98); }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes progress { 0%{width:0%;margin-left:0;}50%{width:60%;margin-left:20%;}100%{width:0%;margin-left:100%;} }
        @keyframes fadeIn { from{opacity:0;}to{opacity:1;} }
        .step-content { animation:fadeSlideIn 0.3s ease; }
        .modal-bg { animation:fadeIn 0.2s ease; }
      `}</style>

      {/* Login prompt modal */}
      {showLoginPrompt&&(
        <div className="modal-bg" onClick={()=>setShowLoginPrompt(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:340,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:32,marginBottom:8}}>🔐</div>
              <h2 style={{fontSize:18,fontWeight:800,color:"#1A2B4B",margin:"0 0 4px",fontFamily:"'Inter',sans-serif"}}>Anmelden erforderlich</h2>
              <p style={{fontSize:13,color:"#6B7C93",fontFamily:"'Inter',sans-serif"}}>Um ein Inserat aufzugeben, bitte anmelden</p>
            </div>
            <button onClick={handleGoogleLogin} style={{width:"100%",padding:"13px",borderRadius:12,border:"1.5px solid #E0E8F4",background:"fff",display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontSize:14,fontWeight:700,color:"#1A2B4B",marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",cursor:"pointer"}}>
              <span style={{fontSize:18,fontWeight:900,color:"#4285F4"}}>G</span> Mit Google anmelden
            </button>
            <button onClick={()=>setShowLoginPrompt(false)} style={{width:"100%",padding:"11px",borderRadius:12,border:"1.5px solid #E0E8F4",background:"transparent",fontSize:13,fontWeight:600,color:"#6B7C93",cursor:"pointer"}}>Abbrechen</button>
          </div>
        </div>
      )}

      <div style={{minHeight:"100vh",background:"#F4F7FB",display:"flex",flexDirection:"column",alignItems:"center",padding:"0 0 40px"}}>
        {/* Header */}
        <div style={{width:"100%",background:"#0052CC",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 12px rgba(0,82,204,0.3)"}}>
          <a href="/" style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none"}}>
            <div style={{width:34,height:34,borderRadius:8,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>🚘</div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:"#fff",fontFamily:"'Inter',sans-serif"}}>automarket<span style={{color:"#7EB8FF"}}>.de</span></div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.65)",fontFamily:"'Inter',sans-serif"}}>Fahrzeug inserieren</div>
            </div>
          </a>
          {userName ? (
            <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:700}}>
              {userName.charAt(0)}
            </div>
          ) : (
            <button onClick={()=>setShowLoginPrompt(true)} style={{fontSize:12,fontWeight:700,color:"#0052CC",background:"#fff",border:"none",padding:"7px 12px",borderRadius:8}}>
              Anmelden
            </button>
          )}
        </div>

        {/* Card */}
        <div style={{width:"100%",maxWidth:480,background:"#fff",borderRadius:submitted?"20px":"0 0 20px 20px",boxShadow:"0 4px 24px rgba(0,82,204,0.08)",overflow:"hidden",border:"1px solid #E0E8F4"}}>
          {submitted?<SuccessScreen form={form}/>:(
            <>
              <div style={{padding:"20px 20px 0"}}><StepIndicator current={step} labels={STEPS}/></div>
              <div className="step-content" key={step} style={{padding:"4px 20px 20px"}}>{steps[step]}</div>
              <div style={{padding:"14px 20px",borderTop:"1px solid #F0F4FA",display:"flex",gap:10,position:"sticky",bottom:0,background:"#fff"}}>
                {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,padding:"13px",borderRadius:12,border:"1.5px solid #D0DCF0",background:"transparent",color:"#1A2B4B",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>← Zurück</button>}
                <button onClick={step<STEPS.length-1?()=>setStep(s=>s+1):handleSubmit} disabled={!canAdvance()||submitting}
                  style={{flex:2,padding:"13px",borderRadius:12,border:"none",background:canAdvance()&&!submitting?"#0052CC":"#C8D5E0",color:"#fff",fontSize:14,fontWeight:700,cursor:canAdvance()&&!submitting?"pointer":"not-allowed",fontFamily:"'Inter',sans-serif",transition:"background 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {submitting?(<><span style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/> Wird veröffentlicht…</>):step<STEPS.length-1?"Weiter →":"🚀 Jetzt inserieren"}
                </button>
              </div>
            </>
          )}
        </div>

        {!submitted&&(
          <div style={{display:"flex",gap:16,marginTop:16}}>
            {["🔒 SSL-verschlüsselt","🛡️ Datenschutz","✅ Kostenlos"].map(b=>(
              <div key={b} style={{fontSize:11,color:"#6B7C93",fontFamily:"'Inter',sans-serif"}}>{b}</div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
