"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const STEPS = ["Fahrzeug","Fotos","Kontakt"];
const BRANDS = ["Audi","BMW","Mercedes-Benz","Volkswagen","Ford","Opel","Toyota","Renault","Skoda","Seat","Hyundai","Kia","Nissan","Andere"];
const MODELS = { "Audi":["A1","A3","A4","A6","Q3","Q5","Q7"], "BMW":["1er","2er","3er","5er","X1","X3","X5"], "Mercedes-Benz":["A-Klasse","C-Klasse","E-Klasse","GLA","GLC"], "Volkswagen":["Golf","Polo","Passat","Tiguan","T-Roc","ID.4"], "Ford":["Fiesta","Focus","Puma","Kuga"], "Opel":["Corsa","Astra","Mokka"], "Toyota":["Yaris","Corolla","RAV4"], "Renault":["Clio","Megane","Captur"], "Andere":["Sonstiges"] };
const FUEL_TYPES = ["Benzin","Diesel","Elektro","Hybrid","Plug-in-Hybrid","LPG"];
const CONDITIONS = ["Neu","Neuwertig","Gut","Gebraucht","Mit Mängeln"];
const PLATE_API_TOKEN = "a8f921f9a538ed3af6e796debf4e6a2e3059d080";

const initialForm = { brand:"", model:"", year:"", price:"", mileage:"", fuel:"", condition:"", description:"", name:"", phone:"", location:"", images:[], agreeTerms:false };

// ── Plate blur via Platerecognizer ────────────────────────────────────────────
async function applyPlateBlur(dataUrl) {
  const blob = await (await fetch(dataUrl)).blob();
  const fd = new FormData();
  fd.append("upload", blob, "car.jpg");
  fd.append("regions", "de");

  let results = [];
  try {
    const res = await fetch("https://api.platerecognizer.com/v1/plate-reader/", {
      method: "POST",
      headers: { Authorization: `Token ${PLATE_API_TOKEN}` },
      body: fd,
    });
    const json = await res.json();
    results = json.results || [];
  } catch {}

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      if (results.length > 0) {
        results.forEach(r => {
          const { xmin, ymin, xmax, ymax } = r.box;
          const pad = 14;
          const x = Math.max(0, xmin - pad), y = Math.max(0, ymin - pad);
          const w = Math.min(img.width, xmax + pad) - x;
          const h = Math.min(img.height, ymax + pad) - y;
          ctx.save(); ctx.filter = "blur(14px)";
          for (let i = 0; i < 5; i++) ctx.drawImage(canvas, x, y, w, h, x, y, w, h);
          ctx.restore();
          ctx.fillStyle = "rgba(0,0,0,0.88)";
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.font = `bold ${Math.max(9, h * 0.4)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🛡️", x + w / 2, y + h / 2);
        });
      } else {
        // Fallback bottom blur
        const y = Math.floor(img.height * 0.8);
        ctx.fillStyle = "rgba(0,0,0,0.82)";
        ctx.fillRect(0, y, img.width, img.height - y);
        ctx.fillStyle = "rgba(255,255,255,0.88)";
        ctx.font = `bold ${Math.max(10, img.width * 0.028)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("🛡️ KENNZEICHEN GESCHWÄRZT", img.width / 2, y + (img.height - y) / 2);
      }
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.src = dataUrl;
  });
}

// ── Upload image to Supabase Storage ─────────────────────────────────────────
async function uploadImageToSupabase(dataUrl, fileName) {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const path = `cars/${Date.now()}_${fileName}`;
    const { error } = await supabase.storage.from("car-images").upload(path, blob, { contentType: "image/jpeg", upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("car-images").getPublicUrl(path);
    return data.publicUrl;
  } catch {
    // Return dataUrl as fallback if storage not set up
    return dataUrl;
  }
}

// ── Styled primitives ─────────────────────────────────────────────────────────
const inputStyle = { width:"100%", padding:"12px 14px", borderRadius:10, border:"1.5px solid #D0DCF0", fontSize:14, color:"#1A2B4B", background:"#F8FAFD", outline:"none", fontFamily:"'Outfit',sans-serif", boxSizing:"border-box", transition:"border-color 0.2s,box-shadow 0.2s" };
const selectStyle = { ...inputStyle, appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7C93' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", paddingRight:40 };

const useFocus = () => { const [f,setF] = useState(false); return [f,{onFocus:()=>setF(true),onBlur:()=>setF(false)}]; };
const fStyle = (f) => ({ borderColor:f?"#0052CC":"#D0DCF0", boxShadow:f?"0 0 0 3px rgba(0,82,204,0.1)":"none" });

const Field = ({ label, required, children, hint, error }) => (
  <div style={{ marginBottom:16 }}>
    <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", color:"#1A2B4B", marginBottom:5, fontFamily:"'Outfit',sans-serif" }}>
      {label}{required && <span style={{ color:"#0052CC", marginLeft:2 }}>*</span>}
    </label>
    {children}
    {error && <p style={{ fontSize:11, color:"#DC2626", marginTop:4, fontFamily:"'Outfit',sans-serif" }}>⚠ {error}</p>}
    {hint && !error && <p style={{ fontSize:11, color:"#6B7C93", marginTop:4, fontFamily:"'Outfit',sans-serif" }}>{hint}</p>}
  </div>
);

const Input = ({ value, onChange, placeholder, type="text", ...rest }) => {
  const [f,fp] = useFocus();
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ ...inputStyle, ...fStyle(f) }} {...fp} {...rest} />;
};
const Select = ({ value, onChange, children, disabled }) => {
  const [f,fp] = useFocus();
  return <select value={value} onChange={onChange} disabled={disabled} style={{ ...selectStyle, ...fStyle(f), opacity:disabled?0.5:1 }} {...fp}>{children}</select>;
};
const Row = ({ children }) => <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>{children}</div>;

// ── Step 1: Vehicle ───────────────────────────────────────────────────────────
const StepFahrzeug = ({ form, update, errors }) => (
  <div>
    <div style={{ marginBottom:22 }}>
      <h2 style={{ margin:"0 0 4px", fontSize:19, fontWeight:800, color:"#1A2B4B", fontFamily:"'Outfit',sans-serif" }}>🚗 Fahrzeugdaten</h2>
      <p style={{ margin:0, fontSize:12, color:"#6B7C93", fontFamily:"'Outfit',sans-serif" }}>Grundlegende Fahrzeuginformationen</p>
    </div>

    <Field label="Marke" required error={errors.brand}>
      <Select value={form.brand} onChange={e => update("brand", e.target.value)}>
        <option value="">Marke wählen</option>
        {BRANDS.map(b => <option key={b}>{b}</option>)}
      </Select>
    </Field>

    <Field label="Modell" required error={errors.model}>
      <Select value={form.model} onChange={e => update("model", e.target.value)} disabled={!form.brand}>
        <option value="">Modell wählen</option>
        {(MODELS[form.brand] || []).map(m => <option key={m}>{m}</option>)}
      </Select>
    </Field>

    <Row>
      <Field label="Baujahr" required error={errors.year}>
        <Select value={form.year} onChange={e => update("year", e.target.value)}>
          <option value="">Jahr</option>
          {Array.from({length:30},(_,i)=>2024-i).map(y => <option key={y}>{y}</option>)}
        </Select>
      </Field>
      <Field label="Kraftstoff" required error={errors.fuel}>
        <Select value={form.fuel} onChange={e => update("fuel", e.target.value)}>
          <option value="">Kraftstoff</option>
          {FUEL_TYPES.map(f => <option key={f}>{f}</option>)}
        </Select>
      </Field>
    </Row>

    <Row>
      <Field label="Preis (€)" required error={errors.price}>
        <Input value={form.price} onChange={e => update("price", e.target.value)} placeholder="12500" type="number" min="0" />
      </Field>
      <Field label="Kilometerstand" required error={errors.mileage}>
        <Input value={form.mileage} onChange={e => update("mileage", e.target.value)} placeholder="85000" type="number" min="0" />
      </Field>
    </Row>

    <Field label="Fahrzeugzustand" required>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {CONDITIONS.map(c => (
          <button key={c} onClick={() => update("condition", c)} style={{ padding:"10px 8px", borderRadius:10, border:"1.5px solid", borderColor:form.condition===c?"#0052CC":"#D0DCF0", background:form.condition===c?"#EBF2FF":"#F8FAFD", color:form.condition===c?"#0052CC":"#4A5D70", fontSize:13, fontWeight:form.condition===c?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"all 0.2s" }}>
            {c}
          </button>
        ))}
      </div>
    </Field>

    <Field label="Beschreibung" hint="Je mehr Details, desto mehr Vertrauen">
      <textarea value={form.description} onChange={e => update("description", e.target.value)}
        placeholder="z.B. Gepflegt, Nichtraucher, frischer TÜV, Scheckheft lückenlos…"
        rows={4} style={{ ...inputStyle, resize:"vertical", lineHeight:1.6 }} />
    </Field>
  </div>
);

// ── Step 2: Photos ────────────────────────────────────────────────────────────
const StepFotos = ({ form, update }) => {
  const fileRef = useRef();
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState("");
  const [plateFound, setPlateFound] = useState(null);

  const handleFiles = useCallback(async (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!valid.length) return;
    setProcessing(true); setPlateFound(null);

    for (const file of valid) {
      setMsg("📤 Foto wird verarbeitet…");
      const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file); });
      setMsg("🔍 Kennzeichen wird erkannt…");
      await new Promise(r => setTimeout(r, 400));

      const blob = await (await fetch(dataUrl)).blob();
      const fd = new FormData();
      fd.append("upload", blob, "car.jpg");
      fd.append("regions", "de");

      let results = [];
      try {
        setMsg("🛡️ Kennzeichen wird geschwärzt…");
        const res = await fetch("https://api.platerecognizer.com/v1/plate-reader/", { method:"POST", headers:{ Authorization:`Token ${PLATE_API_TOKEN}` }, body:fd });
        const json = await res.json();
        results = json.results || [];
        setPlateFound(results.length > 0);
      } catch { setPlateFound(false); }

      const blurred = await applyPlateBlur(dataUrl);
      update("images", prev => [...prev, { url: blurred, name: file.name }]);
    }
    setProcessing(false); setMsg("");
  }, [update]);

  const remove = (idx) => update("images", prev => prev.filter((_,i) => i !== idx));

  return (
    <div>
      <div style={{ marginBottom:22 }}>
        <h2 style={{ margin:"0 0 4px", fontSize:19, fontWeight:800, color:"#1A2B4B", fontFamily:"'Outfit',sans-serif" }}>📸 Fahrzeugfotos</h2>
        <p style={{ margin:0, fontSize:12, color:"#6B7C93", fontFamily:"'Outfit',sans-serif" }}>Kennzeichen werden automatisch geschwärzt</p>
      </div>

      <div onClick={() => !processing && fileRef.current?.click()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onDragOver={e => e.preventDefault()}
        style={{ border:"2px dashed #B8D0EE", borderRadius:14, padding:"28px 20px", textAlign:"center", background:processing?"#EBF2FF":"#F8FAFD", cursor:processing?"wait":"pointer", marginBottom:14, minHeight:130, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        {processing ? (
          <>
            <div style={{ fontSize:28, marginBottom:8 }}>{msg.includes("erkannt")?"🔍":msg.includes("geschwärzt")?"🛡️":"📤"}</div>
            <p style={{ fontSize:14, fontWeight:700, color:"#1A2B4B", margin:"0 0 10px", fontFamily:"'Outfit',sans-serif" }}>{msg}</p>
            <div style={{ width:160, height:3, background:"#D0DCF0", borderRadius:4, overflow:"hidden" }}>
              <div style={{ height:"100%", background:"#0052CC", borderRadius:4, animation:"progress 1.5s ease-in-out infinite" }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize:32, marginBottom:8 }}>📷</div>
            <p style={{ fontSize:14, fontWeight:700, color:"#1A2B4B", margin:"0 0 4px", fontFamily:"'Outfit',sans-serif" }}>Fotos hochladen</p>
            <p style={{ fontSize:12, color:"#6B7C93", margin:0, fontFamily:"'Outfit',sans-serif" }}>Tippen oder hierher ziehen · JPG, PNG</p>
          </>
        )}
        <input ref={fileRef} type="file" multiple accept="image/*" capture="environment" style={{ display:"none" }} onChange={e => handleFiles(e.target.files)} />
      </div>

      {plateFound === true && (
        <div style={{ background:"#E8F5E9", border:"1px solid #A5D6A7", borderRadius:10, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
          <span>✅</span>
          <p style={{ fontSize:13, color:"#2E7D32", margin:0, fontWeight:700, fontFamily:"'Outfit',sans-serif" }}>Kennzeichen erkannt und geschwärzt!</p>
        </div>
      )}
      {plateFound === false && (
        <div style={{ background:"#FFF8E1", border:"1px solid #FFD54F", borderRadius:10, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
          <span>⚠️</span>
          <p style={{ fontSize:12, color:"#795548", margin:0, fontFamily:"'Outfit',sans-serif" }}>Kein Kennzeichen erkannt — unterer Bereich geschwärzt.</p>
        </div>
      )}

      <div style={{ background:"#EBF2FF", border:"1px solid #B8D0EE", borderRadius:10, padding:"10px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
        <span>🛡️</span>
        <p style={{ fontSize:12, color:"#003D99", margin:0, fontFamily:"'Outfit',sans-serif" }}><strong>KI-Erkennung:</strong> Kennzeichen werden automatisch geschwärzt.</p>
      </div>

      {form.images.length > 0 && (
        <div>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", color:"#1A2B4B", marginBottom:10, fontFamily:"'Outfit',sans-serif" }}>
            {form.images.length} Foto{form.images.length !== 1 ? "s" : ""} ✅
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {form.images.map((img, i) => (
              <div key={i} style={{ position:"relative", borderRadius:10, overflow:"hidden", aspectRatio:"4/3", background:"#EBF2FF" }}>
                <img src={img.url} alt="" style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", objectFit:"cover" }} />
                {i === 0 && <div style={{ position:"absolute", top:6, left:6, background:"#0052CC", color:"#fff", fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:20 }}>TITELBILD</div>}
                <button onClick={e => { e.stopPropagation(); remove(i); }} style={{ position:"absolute", top:6, right:6, width:22, height:22, borderRadius:"50%", background:"rgba(0,0,0,0.6)", border:"none", color:"#fff", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Step 3: Contact + submit ──────────────────────────────────────────────────
const StepKontakt = ({ form, update, errors }) => {
  const fmt = (n) => parseInt(n || 0).toLocaleString("de-DE");
  return (
    <div>
      <div style={{ marginBottom:22 }}>
        <h2 style={{ margin:"0 0 4px", fontSize:19, fontWeight:800, color:"#1A2B4B", fontFamily:"'Outfit',sans-serif" }}>📞 Kontakt & Veröffentlichen</h2>
        <p style={{ margin:0, fontSize:12, color:"#6B7C93", fontFamily:"'Outfit',sans-serif" }}>Letzte Details — fast fertig!</p>
      </div>

      <Field label="Ihr Name" required error={errors.name}>
        <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Max Mustermann" />
      </Field>
      <Field label="Telefonnummer" hint="Wird im Inserat angezeigt">
        <Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+49 170 1234567" type="tel" />
      </Field>
      <Field label="Standort (PLZ / Ort)" required error={errors.location}>
        <Input value={form.location} onChange={e => update("location", e.target.value)} placeholder="z.B. 80331 München" />
      </Field>

      {/* Summary */}
      <div style={{ background:"#F4F7FB", borderRadius:12, padding:14, marginBottom:16, border:"1px solid #E0E8F4" }}>
        <p style={{ fontSize:12, fontWeight:700, color:"#1A2B4B", margin:"0 0 10px", fontFamily:"'Outfit',sans-serif" }}>📋 Zusammenfassung</p>
        {[
          ["Fahrzeug", [form.brand, form.model, form.year].filter(Boolean).join(" ") || "–"],
          ["Preis", form.price ? `${fmt(form.price)} €` : "–"],
          ["Kilometerstand", form.mileage ? `${fmt(form.mileage)} km` : "–"],
          ["Kraftstoff", form.fuel || "–"],
          ["Standort", form.location || "–"],
          ["Fotos", form.images.length > 0 ? `${form.images.length} Foto(s) 🛡️` : "Keine"],
        ].map(([l,v]) => (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #E0E8F4" }}>
            <span style={{ fontSize:12, color:"#6B7C93", fontFamily:"'Outfit',sans-serif" }}>{l}</span>
            <span style={{ fontSize:12, fontWeight:600, color:"#1A2B4B", fontFamily:"'Outfit',sans-serif" }}>{v}</span>
          </div>
        ))}
      </div>

      <label style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" }}>
        <input type="checkbox" checked={form.agreeTerms} onChange={e => update("agreeTerms", e.target.checked)}
          style={{ width:18, height:18, marginTop:2, accentColor:"#0052CC", flexShrink:0 }} />
        <span style={{ fontSize:12, color:"#4A5D70", lineHeight:1.5, fontFamily:"'Outfit',sans-serif" }}>
          Ich stimme den <a href="#" style={{ color:"#0052CC", textDecoration:"none", fontWeight:600 }}>Nutzungsbedingungen</a> und der <a href="#" style={{ color:"#0052CC", textDecoration:"none", fontWeight:600 }}>Datenschutzerklärung</a> zu.
        </span>
      </label>
    </div>
  );
};

// ── Step indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ current, labels }) => (
  <div style={{ padding:"0 20px 20px" }}>
    <div style={{ display:"flex", alignItems:"center" }}>
      {labels.map((label, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", flex:i < labels.length-1 ? 1 : 0 }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, background:i<=current?"#0052CC":"#E0E8F4", color:i<=current?"#fff":"#6B7C93", transition:"all 0.3s", boxShadow:i===current?"0 0 0 3px rgba(0,82,204,0.15)":"none" }}>
              {i < current ? "✓" : i+1}
            </div>
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.04em", textTransform:"uppercase", color:i===current?"#0052CC":i<current?"#003D99":"#6B7C93", fontFamily:"'Outfit',sans-serif", whiteSpace:"nowrap" }}>{label}</span>
          </div>
          {i < labels.length-1 && <div style={{ flex:1, height:2, margin:"0 6px", marginBottom:20, background:i<current?"#0052CC":"#E0E8F4", transition:"background 0.3s" }} />}
        </div>
      ))}
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CarPostingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: typeof value === "function" ? value(prev[field]) : value }));

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.brand) e.brand = "Bitte Marke wählen";
      if (!form.model) e.model = "Bitte Modell wählen";
      if (!form.year) e.year = "Bitte Jahr wählen";
      if (!form.price || parseInt(form.price) <= 0) e.price = "Bitte gültigen Preis eingeben";
      if (!form.mileage || parseInt(form.mileage) < 0) e.mileage = "Bitte Kilometerstand eingeben";
      if (!form.fuel) e.fuel = "Bitte Kraftstoff wählen";
    }
    if (step === 2) {
      if (!form.name) e.name = "Name erforderlich";
      if (!form.location) e.location = "Standort erforderlich";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!form.agreeTerms) { setErrors({ agreeTerms: "Bitte zustimmen" }); return; }
    setSubmitting(true);
    setSubmitError("");

    try {
      // Build title
      const title = [form.brand, form.model, form.year].filter(Boolean).join(" ");

      // Upload first image to Supabase Storage if available
      let imageUrl = null;
      if (form.images.length > 0) {
        imageUrl = await uploadImageToSupabase(form.images[0].url, form.images[0].name);
      }

      // Save to Supabase listings table
      const { data, error } = await supabase.from("listings").insert([{
        title,
        price: parseInt(form.price) || 0,
        image_url: imageUrl,
      }]).select().single();

      if (error) throw error;

      // Mark new listing for homepage highlight
      localStorage.setItem("automarket_new_listing", data.id);

      // Redirect to homepage
      router.push("/");
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError("Fehler beim Speichern. Bitte erneut versuchen.");
    }
    setSubmitting(false);
  };

  const canAdvance = () => {
    if (step === 2) return form.agreeTerms;
    return true;
  };

  const steps = [
    <StepFahrzeug form={form} update={update} errors={errors} />,
    <StepFotos form={form} update={update} />,
    <StepKontakt form={form} update={update} errors={errors} />,
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; } body { margin:0; background:#F4F7FB; }
        input:focus,select:focus,textarea:focus { outline:none; }
        button:active { transform:scale(0.98); }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes progress { 0%{width:0%;margin-left:0;}50%{width:60%;margin-left:20%;}100%{width:0%;margin-left:100%;} }
        .step-content { animation:fadeSlideIn 0.3s ease; }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#F4F7FB", display:"flex", flexDirection:"column", alignItems:"center", padding:"0 0 40px" }}>

        {/* Header */}
        <div style={{ width:"100%", background:"#0052CC", padding:"14px 20px", display:"flex", alignItems:"center", gap:12, boxShadow:"0 2px 12px rgba(0,82,204,0.3)" }}>
          <a href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
            <div style={{ width:34, height:34, borderRadius:8, background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>🚘</div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:"#fff", fontFamily:"'Outfit',sans-serif" }}>automarket<span style={{ color:"#7EB8FF" }}>.de</span></div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.65)", fontFamily:"'Outfit',sans-serif" }}>Fahrzeug inserieren</div>
            </div>
          </a>
        </div>

        {/* Progress bar */}
        <div style={{ width:"100%", height:3, background:"#E0E8F4" }}>
          <div style={{ height:"100%", background:"#0052CC", width:`${((step+1)/STEPS.length)*100}%`, transition:"width 0.3s ease" }} />
        </div>

        {/* Card */}
        <div style={{ width:"100%", maxWidth:480, background:"#fff", borderRadius:"0 0 20px 20px", boxShadow:"0 4px 24px rgba(0,82,204,0.08)", overflow:"hidden", border:"1px solid #E0E8F4" }}>
          <div style={{ padding:"20px 20px 0" }}>
            <StepIndicator current={step} labels={STEPS} />
          </div>
          <div className="step-content" key={step} style={{ padding:"4px 20px 20px" }}>
            {steps[step]}
          </div>

          {submitError && (
            <div style={{ margin:"0 20px 16px", padding:"12px 14px", background:"#FEE2E2", borderRadius:10, border:"1px solid #FCA5A5" }}>
              <p style={{ fontSize:13, color:"#DC2626", margin:0, fontFamily:"'Outfit',sans-serif" }}>⚠ {submitError}</p>
            </div>
          )}

          {/* Navigation */}
          <div style={{ padding:"14px 20px", borderTop:"1px solid #F0F4FA", display:"flex", gap:10, position:"sticky", bottom:0, background:"#fff" }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s-1)} style={{ flex:1, padding:"13px", borderRadius:12, border:"1.5px solid #D0DCF0", background:"transparent", color:"#1A2B4B", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                ← Zurück
              </button>
            )}
            <button
              onClick={step < STEPS.length-1 ? handleNext : handleSubmit}
              disabled={submitting || (step === 2 && !form.agreeTerms)}
              style={{ flex:2, padding:"13px", borderRadius:12, border:"none", background:submitting||( step===2&&!form.agreeTerms)?"#C8D5E0":"#0052CC", color:"#fff", fontSize:14, fontWeight:700, cursor:submitting?"wait":"pointer", fontFamily:"'Outfit',sans-serif", transition:"background 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              {submitting ? (
                <><span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />Wird gespeichert…</>
              ) : step < STEPS.length-1 ? "Weiter →" : "🚀 Jetzt inserieren"}
            </button>
          </div>
        </div>

        {/* Trust badges */}
        <div style={{ display:"flex", gap:16, marginTop:16 }}>
          {["🔒 SSL","🛡️ Datenschutz","✅ Kostenlos"].map(b => (
            <div key={b} style={{ fontSize:11, color:"#6B7C93", fontFamily:"'Outfit',sans-serif" }}>{b}</div>
          ))}
        </div>
      </div>
    </>
  );
}
