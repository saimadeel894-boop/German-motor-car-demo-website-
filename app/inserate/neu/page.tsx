// @ts-nocheck
"use client";
import { useState, useRef, useCallback } from "react";

const STEPS = ["Fahrzeug", "Details", "Zustand", "Fotos", "Veröffentlichen"];
const BRANDS = ["Audi","BMW","Mercedes-Benz","Volkswagen","Ford","Opel","Toyota","Renault","Skoda","Seat","Hyundai","Kia","Nissan","Mazda","Volvo","Porsche","Andere"];
const MODELS = { "Audi":["A1","A3","A4","A6","Q3","Q5","Q7","TT"], "BMW":["1er","2er","3er","4er","5er","X1","X3","X5","M3"], "Mercedes-Benz":["A-Klasse","C-Klasse","E-Klasse","S-Klasse","GLA","GLC","GLE"], "Volkswagen":["Golf","Polo","Passat","Tiguan","T-Roc","ID.4","ID.3"], "Ford":["Fiesta","Focus","Puma","Kuga","Mustang"], "Opel":["Corsa","Astra","Insignia","Mokka"], "Toyota":["Yaris","Corolla","RAV4","C-HR"], "Renault":["Clio","Megane","Captur","Zoe"], "Andere":["Sonstiges"] };
const FUEL_TYPES = ["Benzin","Diesel","Elektro","Hybrid","Plug-in-Hybrid","Erdgas","LPG"];
const GEARBOX = ["Schaltgetriebe","Automatik","Halbautomatik"];
const CONDITIONS = ["Neu","Neuwertig","Gut","Gebraucht","Mit Mängeln"];
const BODY_TYPES = ["Limousine","Kombi","SUV","Coupe","Cabrio","Van","Pickup","Kleinwagen"];
const COLORS = ["Schwarz","Weiß","Silber","Grau","Blau","Rot","Grün","Braun","Beige","Orange","Gelb","Sonstige"];
const DURATIONS = ["7 Tage","14 Tage","30 Tage"];

const PLATE_API_TOKEN = "a8f921f9a538ed3af6e796debf4e6a2e3059d080";

const initialForm = {
  brand:"", model:"", year:"", bodyType:"", price:"", mileage:"", fuel:"", gearbox:"",
  power:"", color:"", condition:"", description:"", seats:"", doors:"",
  firstRegistration:"", vin:"", images:[], duration:"30 Tage", name:"", phone:"", location:"", agreeTerms:false,
};

// ── Real license plate detection + blur via Platerecognizer ──────────────────
async function detectAndBlurPlates(dataUrl: string) {
  try {
    // Convert dataUrl to blob for API
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const formData = new FormData();
    formData.append("upload", blob, "car.jpg");
    formData.append("regions", "de"); // Prioritize German plates

    const apiRes = await fetch("https://api.platerecognizer.com/v1/plate-reader/", {
      method: "POST",
      headers: { Authorization: `Token ${PLATE_API_TOKEN}` },
      body: formData,
    });

    const data = await apiRes.json();

    // Draw blur on detected plate coordinates
    return await applyBlurFromCoords(dataUrl, data.results || []);
  } catch (err) {
    console.error("Plate API error:", err);
    // Fallback: blur bottom strip if API fails
    return await fallbackBlur(dataUrl);
  }
}

async function applyBlurFromCoords(dataUrl: string, results: any[]) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      if (results.length === 0) {
        // No plate detected — apply fallback bottom blur
        applyBottomBlur(ctx, img.width, img.height);
      } else {
        // Apply blur to each detected plate box
        results.forEach((result) => {
          const box = result.box; // { xmin, ymin, xmax, ymax }
          const pad = 10; // padding around plate
          const x = Math.max(0, box.xmin - pad);
          const y = Math.max(0, box.ymin - pad);
          const w = Math.min(img.width, box.xmax + pad) - x;
          const h = Math.min(img.height, box.ymax + pad) - y;

          // Apply strong pixelate + blur effect
          ctx.save();
          ctx.filter = "blur(10px)";
          // Draw the plate region blurred multiple times
          for (let i = 0; i < 4; i++) {
            ctx.drawImage(canvas, x, y, w, h, x, y, w, h);
          }
          ctx.restore();

          // Black overlay on exact plate area
          ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
          ctx.fillRect(x, y, w, h);

          // Small shield label
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.font = `bold ${Math.max(9, h * 0.45)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🛡️", x + w / 2, y + h / 2);
        });
      }

      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.crossOrigin = "anonymous";
    img.src = dataUrl;
  });
}

function applyBottomBlur(ctx: any, width: number, height: number) {
  // Fallback — blur bottom 20% where plate often is
  const blurY = Math.floor(height * 0.80);
  const blurH = height - blurY;
  ctx.fillStyle = "rgba(0,0,0,0.78)";
  ctx.fillRect(0, blurY, width, blurH);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `bold ${Math.max(10, width * 0.03)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("🛡️ KENNZEICHEN GESCHWÄRZT", width / 2, blurY + blurH / 2 + 4);
}

async function fallbackBlur(dataUrl: string) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      applyBottomBlur(ctx, img.width, img.height);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.src = dataUrl;
  });
}

// ── Styled primitives ─────────────────────────────────────────────────────────
const inputStyle = { width:"100%", padding:"13px 14px", borderRadius:10, border:"1.5px solid #DDE3EA", fontSize:15, color:"#1C3557", background:"#FAFBFD", outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box", transition:"border-color 0.2s,box-shadow 0.2s" };
const selectStyle = { ...inputStyle, appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238A9BAE' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", paddingRight:40 };

const Field = ({ label, required, children, hint }: any) => (
  <div style={{ marginBottom:18 }}>
    <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"#1C3557", marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>
      {label}{required && <span style={{ color:"#E63027", marginLeft:2 }}>*</span>}
    </label>
    {children}
    {hint && <p style={{ fontSize:11, color:"#8A9BAE", marginTop:4, fontFamily:"'DM Sans',sans-serif" }}>{hint}</p>}
  </div>
);

const useFocus = () => {
  const [f, setF] = useState(false);
  return [f, { onFocus:()=>setF(true), onBlur:()=>setF(false) }];
};
const fStyle = (f) => ({ borderColor:f?"#E63027":"#DDE3EA", boxShadow:f?"0 0 0 3px rgba(230,48,39,0.08)":"none" });

const Input = ({ value, onChange, placeholder, type="text", ...rest }: any) => {
  const [f, fp] = useFocus();
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ ...inputStyle, ...fStyle(f) }} {...fp} {...rest} />;
};
const Select = ({ value, onChange, children, disabled }: any) => {
  const [f, fp] = useFocus();
  return <select value={value} onChange={onChange} disabled={disabled} style={{ ...selectStyle, ...fStyle(f), opacity:disabled?0.5:1 }} {...fp}>{children}</select>;
};
const Row = ({ children }: any) => <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>{children}</div>;
const SectionTitle = ({ icon, title, subtitle }: any) => (
  <div style={{ marginBottom:24 }}>
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
      <span style={{ fontSize:22 }}>{icon}</span>
      <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:"#1C3557", fontFamily:"'DM Sans',sans-serif" }}>{title}</h2>
    </div>
    <p style={{ margin:0, fontSize:13, color:"#8A9BAE", fontFamily:"'DM Sans',sans-serif", paddingLeft:32 }}>{subtitle}</p>
  </div>
);

// ── Steps ─────────────────────────────────────────────────────────────────────
const StepFahrzeug = ({ form, update }: any) => (
  <div>
    <SectionTitle icon="🚗" title="Fahrzeugdaten" subtitle="Marke, Modell und Karosserie" />
    <Field label="Marke" required>
      <Select value={form.brand} onChange={e => update("brand", e.target.value)}>
        <option value="">Marke wählen</option>
        {BRANDS.map(b => <option key={b}>{b}</option>)}
      </Select>
    </Field>
    <Field label="Modell" required>
      <Select value={form.model} onChange={e => update("model", e.target.value)} disabled={!form.brand}>
        <option value="">Modell wählen</option>
        {(MODELS[form.brand] || []).map(m => <option key={m}>{m}</option>)}
      </Select>
    </Field>
    <Row>
      <Field label="Baujahr" required>
        <Select value={form.year} onChange={e => update("year", e.target.value)}>
          <option value="">Jahr</option>
          {Array.from({length:35},(_,i)=>2024-i).map(y => <option key={y}>{y}</option>)}
        </Select>
      </Field>
      <Field label="Karosserie">
        <Select value={form.bodyType} onChange={e => update("bodyType", e.target.value)}>
          <option value="">Typ</option>
          {BODY_TYPES.map(b => <option key={b}>{b}</option>)}
        </Select>
      </Field>
    </Row>
    <Field label="Preis (€)" required>
      <Input value={form.price} onChange={e => update("price", e.target.value)} placeholder="z.B. 12500" type="number" />
    </Field>
  </div>
);

const StepDetails = ({ form, update }: any) => (
  <div>
    <SectionTitle icon="⚙️" title="Technische Details" subtitle="Motor, Getriebe und Ausstattung" />
    <Field label="Kilometerstand" required>
      <Input value={form.mileage} onChange={e => update("mileage", e.target.value)} placeholder="z.B. 85000" type="number" />
    </Field>
    <Row>
      <Field label="Kraftstoff" required>
        <Select value={form.fuel} onChange={e => update("fuel", e.target.value)}>
          <option value="">Kraftstoff</option>
          {FUEL_TYPES.map(f => <option key={f}>{f}</option>)}
        </Select>
      </Field>
      <Field label="Getriebe">
        <Select value={form.gearbox} onChange={e => update("gearbox", e.target.value)}>
          <option value="">Getriebe</option>
          {GEARBOX.map(g => <option key={g}>{g}</option>)}
        </Select>
      </Field>
    </Row>
    <Row>
      <Field label="Leistung (PS)">
        <Input value={form.power} onChange={e => update("power", e.target.value)} placeholder="z.B. 150" type="number" />
      </Field>
      <Field label="Farbe">
        <Select value={form.color} onChange={e => update("color", e.target.value)}>
          <option value="">Farbe</option>
          {COLORS.map(c => <option key={c}>{c}</option>)}
        </Select>
      </Field>
    </Row>
    <Row>
      <Field label="Sitze">
        <Select value={form.seats} onChange={e => update("seats", e.target.value)}>
          <option value="">Sitze</option>
          {[2,3,4,5,6,7,8,9].map(n => <option key={n}>{n}</option>)}
        </Select>
      </Field>
      <Field label="Türen">
        <Select value={form.doors} onChange={e => update("doors", e.target.value)}>
          <option value="">Türen</option>
          {[2,3,4,5].map(n => <option key={n}>{n}</option>)}
        </Select>
      </Field>
    </Row>
    <Field label="Erstzulassung">
      <Input value={form.firstRegistration} onChange={e => update("firstRegistration", e.target.value)} type="month" />
    </Field>
  </div>
);

const StepZustand = ({ form, update }: any) => (
  <div>
    <SectionTitle icon="📋" title="Zustand & Beschreibung" subtitle="Zustand und weitere Informationen" />
    <Field label="Fahrzeugzustand" required>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {CONDITIONS.map(c => (
          <button key={c} onClick={() => update("condition", c)} style={{ padding:"10px 8px", borderRadius:10, border:"1.5px solid", borderColor:form.condition===c?"#E63027":"#DDE3EA", background:form.condition===c?"#FFF0F0":"#FAFBFD", color:form.condition===c?"#E63027":"#4A5D70", fontSize:13, fontWeight:form.condition===c?700:400, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s ease" }}>{c}</button>
        ))}
      </div>
    </Field>
    <Field label="Beschreibung" hint="Beschreiben Sie Ihr Fahrzeug so genau wie möglich">
      <textarea value={form.description} onChange={e => update("description", e.target.value)} placeholder="z.B. Gepflegt, Nichtraucher, Scheckheft gepflegt, frischer TÜV…" rows={5} style={{ ...inputStyle, resize:"vertical", lineHeight:1.6 }} />
    </Field>
    <Field label="FIN" hint="Optional — erhöht das Vertrauen">
      <Input value={form.vin} onChange={e => update("vin", e.target.value)} placeholder="WVW ZZZ 1K ZAP…" />
    </Field>
  </div>
);

// ── Photo step with real Platerecognizer ──────────────────────────────────────
const StepFotos = ({ form, update }: any) => {
  const fileRef = useRef();
  const [processing, setProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState("");
  const [plateFound, setPlateFound] = useState(null); // true/false/null

  const handleFiles = useCallback(async (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!valid.length) return;
    setProcessing(true);
    setPlateFound(null);

    for (const file of valid) {
      setProcessingMsg("Foto wird hochgeladen…");
      const dataUrl = await new Promise((res) => {
        const r = new FileReader();
        r.onload = e => res(e.target.result);
        r.readAsDataURL(file);
      });

      setProcessingMsg("🔍 Kennzeichen wird erkannt…");
      await new Promise(r => setTimeout(r, 400)); // small UX delay

      // Convert to blob and call Platerecognizer
      const blob = await (await fetch(dataUrl)).blob();
      const fd = new FormData();
      fd.append("upload", blob, "car.jpg");
      fd.append("regions", "de");

      let results = [];
      try {
        setProcessingMsg("🛡️ Kennzeichen wird geschwärzt…");
        const apiRes = await fetch("https://api.platerecognizer.com/v1/plate-reader/", {
          method: "POST",
          headers: { Authorization: `Token ${PLATE_API_TOKEN}` },
          body: fd,
        });
        const json = await apiRes.json();
        results = json.results || [];
        setPlateFound(results.length > 0);
      } catch {
        setPlateFound(false);
      }

      const blurred = await applyBlurFromCoords(dataUrl, results);
      update("images", prev => [...prev, { url: blurred, name: file.name, plateFound: results.length > 0 }]);
    }

    setProcessing(false);
    setProcessingMsg("");
  }, [update]);

  const removeImage = (idx) => update("images", prev => prev.filter((_,i) => i !== idx));

  return (
    <div>
      <SectionTitle icon="📸" title="Fahrzeugfotos" subtitle="Kennzeichen werden automatisch erkannt & geschwärzt" />

      <div
        onClick={() => !processing && fileRef.current?.click()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onDragOver={e => e.preventDefault()}
        style={{ border:"2px dashed #C8D5E0", borderRadius:14, padding:"28px 20px", textAlign:"center", background:processing?"#F0F4F8":"#F7F9FB", cursor:processing?"wait":"pointer", marginBottom:16, transition:"all 0.2s ease", minHeight:130, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        {processing ? (
          <>
            <div style={{ fontSize:32, marginBottom:10 }}>
              {processingMsg.includes("erkannt") ? "🔍" : processingMsg.includes("geschwärzt") ? "🛡️" : "📤"}
            </div>
            <p style={{ fontSize:15, fontWeight:700, color:"#1C3557", margin:"0 0 4px", fontFamily:"'DM Sans',sans-serif" }}>{processingMsg}</p>
            <div style={{ width:160, height:4, background:"#E0E8F0", borderRadius:4, marginTop:10, overflow:"hidden" }}>
              <div style={{ height:"100%", background:"#E63027", borderRadius:4, animation:"progress 1.5s ease-in-out infinite" }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize:36, marginBottom:8 }}>📷</div>
            <p style={{ fontSize:15, fontWeight:700, color:"#1C3557", margin:"0 0 4px", fontFamily:"'DM Sans',sans-serif" }}>Fotos hochladen</p>
            <p style={{ fontSize:12, color:"#8A9BAE", margin:0, fontFamily:"'DM Sans',sans-serif" }}>Tippen zum Aufnehmen · JPG, PNG</p>
          </>
        )}
        <input ref={fileRef} type="file" multiple accept="image/*" capture="environment" style={{ display:"none" }} onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Status banner */}
      {plateFound === true && (
        <div style={{ background:"#E8F5E9", border:"1px solid #A5D6A7", borderRadius:10, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:18 }}>✅</span>
          <p style={{ fontSize:13, color:"#2E7D32", margin:0, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>Kennzeichen erkannt und automatisch geschwärzt!</p>
        </div>
      )}
      {plateFound === false && (
        <div style={{ background:"#FFF8E1", border:"1px solid #FFD54F", borderRadius:10, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:18 }}>⚠️</span>
          <p style={{ fontSize:12, color:"#795548", margin:0, fontFamily:"'DM Sans',sans-serif" }}>Kein Kennzeichen erkannt — unterer Bildbereich wurde vorsorglich geschwärzt.</p>
        </div>
      )}

      <div style={{ background:"#EEF3F8", border:"1px solid #C8D5E0", borderRadius:10, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:16 }}>🛡️</span>
        <p style={{ fontSize:12, color:"#1C3557", margin:0, fontFamily:"'DM Sans',sans-serif" }}>
          <strong>KI-Kennzeichenerkennung:</strong> Kennzeichen werden automatisch erkannt und geschwärzt.
        </p>
      </div>

      {form.images.length > 0 && (
        <div>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"#1C3557", marginBottom:10, fontFamily:"'DM Sans',sans-serif" }}>
            {form.images.length} Foto{form.images.length!==1?"s":""} — Kennzeichen geschwärzt ✅
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {form.images.map((img, i) => (
              <div key={i} style={{ position:"relative", borderRadius:10, overflow:"hidden", aspectRatio:"4/3" }}>
                <img src={img.url} alt={img.name} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                {i === 0 && <div style={{ position:"absolute", top:6, left:6, background:"#1C3557", color:"#fff", fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:20, fontFamily:"'DM Sans',sans-serif" }}>TITELBILD</div>}
                <button onClick={(e) => { e.stopPropagation(); removeImage(i); }} style={{ position:"absolute", top:6, right:6, width:22, height:22, borderRadius:"50%", background:"rgba(0,0,0,0.6)", border:"none", color:"#fff", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StepVeroeffentlichen = ({ form, update }: any) => {
  const fmt = (n: any) => parseInt(n).toLocaleString("de-DE");
  return (
    <div>
      <SectionTitle icon="🚀" title="Veröffentlichen" subtitle="Fast geschafft — letzte Details" />
      <Field label="Laufzeit" required>
        <div style={{ display:"flex", gap:8 }}>
          {DURATIONS.map(d => (
            <button key={d} onClick={() => update("duration", d)} style={{ flex:1, padding:"10px 4px", borderRadius:10, border:"1.5px solid", borderColor:form.duration===d?"#E63027":"#DDE3EA", background:form.duration===d?"#FFF0F0":"#FAFBFD", color:form.duration===d?"#E63027":"#4A5D70", fontSize:13, fontWeight:form.duration===d?700:400, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s ease" }}>{d}</button>
          ))}
        </div>
      </Field>
      <Field label="Ihr Name" required><Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Max Mustermann" /></Field>
      <Field label="Telefonnummer" hint="Wird im Inserat angezeigt"><Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+49 170 1234567" type="tel" /></Field>
      <Field label="Standort" required><Input value={form.location} onChange={e => update("location", e.target.value)} placeholder="z.B. 80331 München" /></Field>
      <div style={{ background:"#F0F4F8", borderRadius:12, padding:16, marginBottom:18 }}>
        <p style={{ fontSize:12, fontWeight:700, color:"#1C3557", margin:"0 0 8px", fontFamily:"'DM Sans',sans-serif" }}>📋 Zusammenfassung</p>
        {[["Fahrzeug",[form.brand,form.model,form.year].filter(Boolean).join(" ")||"–"],["Preis",form.price?`${fmt(form.price)} €`:"–"],["Kilometerstand",form.mileage?`${fmt(form.mileage)} km`:"–"],["Kraftstoff",form.fuel||"–"],["Fotos",form.images.length>0?`${form.images.length} Foto(s) 🛡️`:"Keine"]].map(([l,v]) => (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #DDE3EA" }}>
            <span style={{ fontSize:12, color:"#8A9BAE", fontFamily:"'DM Sans',sans-serif" }}>{l}</span>
            <span style={{ fontSize:12, fontWeight:600, color:"#1C3557", fontFamily:"'DM Sans',sans-serif" }}>{v}</span>
          </div>
        ))}
      </div>
      <label style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" }}>
        <input type="checkbox" checked={form.agreeTerms} onChange={e => update("agreeTerms", e.target.checked)} style={{ width:18, height:18, marginTop:2, accentColor:"#E63027", flexShrink:0 }} />
        <span style={{ fontSize:12, color:"#4A5D70", lineHeight:1.5, fontFamily:"'DM Sans',sans-serif" }}>
          Ich stimme den <a href="#" style={{ color:"#E63027", textDecoration:"none", fontWeight:600 }}>Nutzungsbedingungen</a> und der <a href="#" style={{ color:"#E63027", textDecoration:"none", fontWeight:600 }}>Datenschutzerklärung</a> zu.
        </span>
      </label>
    </div>
  );
};

// ── Step indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ current, labels }: any) => (
  <div style={{ padding:"0 20px 20px" }}>
    <div style={{ display:"flex", alignItems:"center" }}>
      {labels.map((label, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", flex:i<labels.length-1?1:0 }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, background:i<current?"#1C3557":i===current?"#E63027":"#E8EDF2", color:i<=current?"#fff":"#8A9BAE", border:i===current?"2px solid #E63027":"2px solid transparent", transition:"all 0.3s ease", boxShadow:i===current?"0 0 0 3px rgba(230,48,39,0.15)":"none" }}>
              {i<current?"✓":i+1}
            </div>
            <span style={{ fontSize:9, fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase", color:i===current?"#E63027":i<current?"#1C3557":"#8A9BAE", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>{label}</span>
          </div>
          {i<labels.length-1&&<div style={{ flex:1, height:2, margin:"0 4px", marginBottom:20, background:i<current?"#1C3557":"#E8EDF2", transition:"background 0.3s ease" }} />}
        </div>
      ))}
    </div>
  </div>
);

// ── Success screen ────────────────────────────────────────────────────────────
const SuccessScreen = ({ form }: any) => (
  <div style={{ textAlign:"center", padding:"40px 24px" }}>
    <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#1C3557,#2A4F7C)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:36 }}>✅</div>
    <h2 style={{ fontSize:24, fontWeight:800, color:"#1C3557", margin:"0 0 8px", fontFamily:"'DM Sans',sans-serif" }}>Inserat veröffentlicht!</h2>
    <p style={{ fontSize:14, color:"#8A9BAE", margin:"0 0 6px", lineHeight:1.6, fontFamily:"'DM Sans',sans-serif" }}>Ihr Fahrzeug ist jetzt auf AutoMarket.de sichtbar.</p>
    <p style={{ fontSize:13, color:"#2E7D32", fontWeight:700, margin:"0 0 24px", fontFamily:"'DM Sans',sans-serif" }}>🛡️ Kennzeichen wurden automatisch erkannt & geschwärzt</p>
    {form.images.length > 0 && (
      <div style={{ marginBottom:24, borderRadius:12, overflow:"hidden", maxHeight:180 }}>
        <img src={form.images[0].url} alt="Ihr Fahrzeug" style={{ width:"100%", objectFit:"cover", maxHeight:180 }} />
      </div>
    )}
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <a href="/" style={{ display:"block", padding:"14px", borderRadius:12, background:"#1C3557", color:"#fff", fontSize:15, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>Mein Inserat ansehen →</a>
      <button onClick={() => window.location.reload()} style={{ padding:"14px", borderRadius:12, border:"1.5px solid #DDE3EA", background:"transparent", color:"#1C3557", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Weiteres Fahrzeug inserieren</button>
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CarPostingForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: typeof value==="function"?value(prev[field]):value }));

  const canAdvance = () => {
    if (step===0) return form.brand&&form.model&&form.year&&form.price;
    if (step===1) return form.mileage&&form.fuel;
    if (step===2) return form.condition;
    if (step===4) return form.name&&form.location&&form.agreeTerms;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    const newListing = {
      id: `user_${Date.now()}`,
      brand: form.brand, model: form.model, year: form.year,
      price: form.price, mileage: form.mileage, fuel: form.fuel,
      location: form.location, seller: "Privat",
      image: form.images.length>0 ? form.images[0].url : "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80",
      badge: null, isDemo: false,
    };
    try {
      const existing = JSON.parse(localStorage.getItem("automarket_listings")||"[]");
      localStorage.setItem("automarket_listings", JSON.stringify([newListing,...existing]));
      localStorage.setItem("automarket_new_listing", newListing.id);
    } catch {}
    setSubmitting(false);
    setSubmitted(true);
  };

  const steps = [
    <StepFahrzeug form={form} update={update} />,
    <StepDetails form={form} update={update} />,
    <StepZustand form={form} update={update} />,
    <StepFotos form={form} update={update} />,
    <StepVeroeffentlichen form={form} update={update} />,
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; } body { margin:0; background:#F0F4F8; }
        input:focus,select:focus,textarea:focus { outline:none; }
        button:active { transform:scale(0.98); }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes progress { 0%{width:0%;margin-left:0;}50%{width:60%;margin-left:20%;}100%{width:0%;margin-left:100%;} }
        .step-content { animation:fadeSlideIn 0.3s ease; }
      `}</style>
      <div style={{ minHeight:"100vh", background:"#F0F4F8", display:"flex", flexDirection:"column", alignItems:"center", padding:"0 0 40px" }}>
        <div style={{ width:"100%", background:"#1C3557", padding:"16px 20px", display:"flex", alignItems:"center", gap:12, boxShadow:"0 2px 12px rgba(28,53,87,0.3)" }}>
          <a href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
            <div style={{ width:36, height:36, borderRadius:8, background:"#E63027", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🚘</div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:"#fff", fontFamily:"'DM Sans',sans-serif" }}>automarket<span style={{ color:"#E63027" }}>.de</span></div>
              <div style={{ fontSize:11, color:"#8AA8C4", fontFamily:"'DM Sans',sans-serif" }}>Fahrzeug inserieren</div>
            </div>
          </a>
        </div>
        <div style={{ width:"100%", maxWidth:480, background:"#fff", borderRadius:submitted?"20px":"0 0 20px 20px", boxShadow:"0 4px 30px rgba(28,53,87,0.08)", overflow:"hidden" }}>
          {submitted ? <SuccessScreen form={form} /> : (
            <>
              <div style={{ padding:"20px 20px 0" }}><StepIndicator current={step} labels={STEPS} /></div>
              <div className="step-content" key={step} style={{ padding:"4px 20px 20px" }}>{steps[step]}</div>
              <div style={{ padding:"16px 20px", borderTop:"1px solid #F0F4F8", display:"flex", gap:10, position:"sticky", bottom:0, background:"#fff" }}>
                {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{ flex:1, padding:"14px", borderRadius:12, border:"1.5px solid #DDE3EA", background:"transparent", color:"#1C3557", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>← Zurück</button>}
                <button onClick={step<STEPS.length-1?()=>setStep(s=>s+1):handleSubmit} disabled={!canAdvance()||submitting}
                  style={{ flex:2, padding:"14px", borderRadius:12, border:"none", background:canAdvance()&&!submitting?"#E63027":"#C8D5E0", color:"#fff", fontSize:15, fontWeight:700, cursor:canAdvance()&&!submitting?"pointer":"not-allowed", fontFamily:"'DM Sans',sans-serif", transition:"background 0.2s ease", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {submitting?(<><span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />Wird veröffentlicht…</>):step<STEPS.length-1?"Weiter →":"🚀 Jetzt inserieren"}
                </button>
              </div>
            </>
          )}
        </div>
        {!submitted&&<div style={{ display:"flex", gap:16, marginTop:20 }}>{["🔒 SSL-verschlüsselt","🛡️ Datenschutz","✅ Kostenlos"].map(b=><div key={b} style={{ fontSize:11, color:"#8A9BAE", fontFamily:"'DM Sans',sans-serif" }}>{b}</div>)}</div>}
      </div>
    </>
  );
}
