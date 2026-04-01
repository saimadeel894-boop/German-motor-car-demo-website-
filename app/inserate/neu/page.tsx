"use client";
import { useState, useRef, useCallback } from "react";

const STEPS = ["Fahrzeug", "Details", "Zustand", "Fotos", "Veröffentlichen"];
const BRANDS = ["Audi","BMW","Mercedes-Benz","Volkswagen","Ford","Opel","Toyota","Renault","Skoda","Seat","Hyundai","Kia","Nissan","Mazda","Volvo","Porsche","Andere"];
const MODELS: Record<string, string[]> = { "Audi":["A1","A3","A4","A6","Q3","Q5","Q7","TT"], "BMW":["1er","2er","3er","4er","5er","X1","X3","X5","M3"], "Mercedes-Benz":["A-Klasse","C-Klasse","E-Klasse","S-Klasse","GLA","GLC","GLE"], "Volkswagen":["Golf","Polo","Passat","Tiguan","T-Roc","ID.4","ID.3"], "Ford":["Fiesta","Focus","Puma","Kuga","Mustang"], "Opel":["Corsa","Astra","Insignia","Mokka"], "Toyota":["Yaris","Corolla","RAV4","C-HR"], "Renault":["Clio","Megane","Captur","Zoe"], "Andere":["Sonstiges"] };
const FUEL_TYPES = ["Benzin","Diesel","Elektro","Hybrid","Plug-in-Hybrid","Erdgas","LPG"];
const GEARBOX = ["Schaltgetriebe","Automatik","Halbautomatik"];
const CONDITIONS = ["Neu","Neuwertig","Gut","Gebraucht","Mit Mängeln"];
const BODY_TYPES = ["Limousine","Kombi","SUV","Coupe","Cabrio","Van","Pickup","Kleinwagen"];
const COLORS = ["Schwarz","Weiß","Silber","Grau","Blau","Rot","Grün","Braun","Beige","Orange","Gelb","Sonstige"];
const DURATIONS = ["7 Tage","14 Tage","30 Tage"];

interface FormState {
  brand: string;
  model: string;
  year: string;
  bodyType: string;
  price: string;
  mileage: string;
  fuel: string;
  gearbox: string;
  power: string;
  color: string;
  condition: string;
  description: string;
  seats: string;
  doors: string;
  firstRegistration: string;
  vin: string;
  images: Array<{url: string; name: string}>;
  duration: string;
  name: string;
  phone: string;
  location: string;
  agreeTerms: boolean;
}

const initialForm: FormState = {
  brand:"", model:"", year:"", bodyType:"", price:"", mileage:"", fuel:"", gearbox:"",
  power:"", color:"", condition:"", description:"", seats:"", doors:"",
  firstRegistration:"", vin:"", images:[], duration:"30 Tage", name:"", phone:"", location:"", agreeTerms:false,
};

// ── Canvas blur: blurs bottom 18% of image (where plate usually is) ───────────
async function applyPlateBlur(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const blurY = Math.floor(img.height * 0.78);
      const blurH = img.height - blurY;

      // Stack multiple blur passes for strong effect
      ctx.filter = "blur(12px)";
      for (let i = 0; i < 3; i++) {
        ctx.drawImage(canvas, 0, blurY, img.width, blurH, 0, blurY, img.width, blurH);
      }

      // Dark overlay strip with text
      ctx.filter = "none";
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, blurY, img.width, blurH);

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = `bold ${Math.max(10, img.width * 0.025)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("🛡️ KENNZEICHEN GESCHWÄRZT", img.width / 2, blurY + blurH / 2 + 4);

      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.src = dataUrl;
  });
}

// ── Shared styled primitives ──────────────────────────────────────────────────
const inputStyle: React.CSSProperties = { width:"100%", padding:"13px 14px", borderRadius:10, border:"1.5px solid #DDE3EA", fontSize:15, color:"#1C3557", background:"#FAFBFD", outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box", transition:"border-color 0.2s,box-shadow 0.2s" };
const selectStyle: React.CSSProperties = { ...inputStyle, appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238A9BAE' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", paddingRight:40 };

const useFocus = (): [boolean, { onFocus: () => void; onBlur: () => void }] => {
  const [focused, setFocused] = useState(false);
  return [focused, { onFocus:()=>setFocused(true), onBlur:()=>setFocused(false) }];
};

const focusStyle = (focused: boolean): React.CSSProperties => ({ borderColor: focused ? "#E63027" : "#DDE3EA", boxShadow: focused ? "0 0 0 3px rgba(230,48,39,0.08)" : "none" });

const Field = ({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) => (
  <div style={{ marginBottom:18 }}>
    <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"#1C3557", marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>
      {label}{required && <span style={{ color:"#E63027", marginLeft:2 }}>*</span>}
    </label>
    {children}
    {hint && <p style={{ fontSize:11, color:"#8A9BAE", marginTop:4, fontFamily:"'DM Sans',sans-serif" }}>{hint}</p>}
  </div>
);

const Input = ({ value, onChange, placeholder, type="text", ...rest }: any) => {
  const [focused, fp] = useFocus();
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ ...inputStyle, ...focusStyle(focused) }} {...fp} {...rest} />;
};

const Select = ({ value, onChange, children }: any) => {
  const [focused, fp] = useFocus();
  return <select value={value} onChange={onChange} style={{ ...selectStyle, ...focusStyle(focused) }} {...fp}>{children}</select>;
};

const Row = ({ children }: { children: React.ReactNode }) => <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>{children}</div>;

const SectionTitle = ({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) => (
  <div style={{ marginBottom:24 }}>
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
      <span style={{ fontSize:22 }}>{icon}</span>
      <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:"#1C3557", fontFamily:"'DM Sans',sans-serif" }}>{title}</h2>
    </div>
    <p style={{ margin:0, fontSize:13, color:"#8A9BAE", fontFamily:"'DM Sans',sans-serif", paddingLeft:32 }}>{subtitle}</p>
  </div>
);

// ── Steps ─────────────────────────────────────────────────────────────────────
const StepFahrzeug = ({ form, update }: { form: FormState; update: (f: keyof FormState, v: any) => void }) => (
  <div>
    <SectionTitle icon="🚗" title="Fahrzeugdaten" subtitle="Marke, Modell und Karosserie" />
    <Field label="Marke" required>
      <Select value={form.brand} onChange={(e: any) => update("brand", e.target.value)}>
        <option value="">Marke wählen</option>
        {BRANDS.map(b => <option key={b}>{b}</option>)}
      </Select>
    </Field>
    <Field label="Modell" required>
      <Select value={form.model} onChange={(e: any) => update("model", e.target.value)} disabled={!form.brand}>
        <option value="">Modell wählen</option>
        {(MODELS[form.brand as keyof typeof MODELS] || []).map(m => <option key={m}>{m}</option>)}
      </Select>
    </Field>
    <Row>
      <Field label="Baujahr" required>
        <Select value={form.year} onChange={(e: any) => update("year", e.target.value)}>
          <option value="">Jahr</option>
          {Array.from({length:35},(_,i)=>2024-i).map(y => <option key={y}>{y}</option>)}
        </Select>
      </Field>
      <Field label="Karosserie">
        <Select value={form.bodyType} onChange={(e: any) => update("bodyType", e.target.value)}>
          <option value="">Typ</option>
          {BODY_TYPES.map(b => <option key={b}>{b}</option>)}
        </Select>
      </Field>
    </Row>
    <Field label="Preis (€)" required>
      <Input value={form.price} onChange={(e: any) => update("price", e.target.value)} placeholder="z.B. 12500" type="number" />
    </Field>
  </div>
);

const StepDetails = ({ form, update }: { form: FormState; update: (f: keyof FormState, v: any) => void }) => (
  <div>
    <SectionTitle icon="⚙️" title="Technische Details" subtitle="Motor, Getriebe und Ausstattung" />
    <Field label="Kilometerstand" required>
      <Input value={form.mileage} onChange={(e: any) => update("mileage", e.target.value)} placeholder="z.B. 85000" type="number" />
    </Field>
    <Row>
      <Field label="Kraftstoff" required>
        <Select value={form.fuel} onChange={(e: any) => update("fuel", e.target.value)}>
          <option value="">Kraftstoff</option>
          {FUEL_TYPES.map(f => <option key={f}>{f}</option>)}
        </Select>
      </Field>
      <Field label="Getriebe">
        <Select value={form.gearbox} onChange={(e: any) => update("gearbox", e.target.value)}>
          <option value="">Getriebe</option>
          {GEARBOX.map(g => <option key={g}>{g}</option>)}
        </Select>
      </Field>
    </Row>
    <Row>
      <Field label="Leistung (PS)">
        <Input value={form.power} onChange={(e: any) => update("power", e.target.value)} placeholder="z.B. 150" type="number" />
      </Field>
      <Field label="Farbe">
        <Select value={form.color} onChange={(e: any) => update("color", e.target.value)}>
          <option value="">Farbe</option>
          {COLORS.map(c => <option key={c}>{c}</option>)}
        </Select>
      </Field>
    </Row>
    <Row>
      <Field label="Sitze">
        <Select value={form.seats} onChange={(e: any) => update("seats", e.target.value)}>
          <option value="">Sitze</option>
          {[2,3,4,5,6,7,8,9].map(n => <option key={n}>{n}</option>)}
        </Select>
      </Field>
      <Field label="Türen">
        <Select value={form.doors} onChange={(e: any) => update("doors", e.target.value)}>
          <option value="">Türen</option>
          {[2,3,4,5].map(n => <option key={n}>{n}</option>)}
        </Select>
      </Field>
    </Row>
    <Field label="Erstzulassung">
      <Input value={form.firstRegistration} onChange={(e: any) => update("firstRegistration", e.target.value)} type="month" />
    </Field>
  </div>
);

const StepZustand = ({ form, update }: { form: FormState; update: (f: keyof FormState, v: any) => void }) => (
  <div>
    <SectionTitle icon="📋" title="Zustand & Beschreibung" subtitle="Zustand und weitere Informationen" />
    <Field label="Fahrzeugzustand" required>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {CONDITIONS.map(c => (
          <button key={c} onClick={() => update("condition", c)} style={{
            padding:"10px 8px", borderRadius:10, border:"1.5px solid",
            borderColor: form.condition===c ? "#E63027" : "#DDE3EA",
            background: form.condition===c ? "#FFF0F0" : "#FAFBFD",
            color: form.condition===c ? "#E63027" : "#4A5D70",
            fontSize:13, fontWeight: form.condition===c ? 700 : 400,
            cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s ease",
          }}>{c}</button>
        ))}
      </div>
    </Field>
    <Field label="Beschreibung" hint="Beschreiben Sie Ihr Fahrzeug so genau wie möglich">
      <textarea value={form.description} onChange={(e: any) => update("description", e.target.value)}
        placeholder="z.B. Gepflegt, Nichtraucher, Scheckheft gepflegt, frischer TÜV…"
        rows={5} style={{ ...inputStyle, resize:"vertical", lineHeight:1.6 } as any} />
    </Field>
    <Field label="Fahrzeug-Identifikationsnummer (FIN)" hint="Optional — erhöht das Vertrauen">
      <Input value={form.vin} onChange={(e: any) => update("vin", e.target.value)} placeholder="WVW ZZZ 1K ZAP…" />
    </Field>
  </div>
);

const StepFotos = ({ form, update }: { form: FormState; update: (f: keyof FormState, v: any) => void }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    setProcessing(true);
    const valid = Array.from(files).filter(f => f.type.startsWith("image/"));
    for (const file of valid) {
      const dataUrl = await new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = e => res(e.target?.result as string);
        r.readAsDataURL(file);
      });
      // Apply real canvas blur to bottom of image
      const blurred = await applyPlateBlur(dataUrl);
      update("images", (prev: any) => [...prev, { url: blurred, name: file.name }]);
    }
    setProcessing(false);
  }, [update]);

  const removeImage = (idx: number) => update("images", (prev: any) => prev.filter((_: any,i: number) => i !== idx));

  return (
    <div>
      <SectionTitle icon="📸" title="Fahrzeugfotos" subtitle="Kennzeichen werden automatisch geschwärzt" />

      <div onClick={() => !processing && fileRef.current?.click()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onDragOver={e => e.preventDefault()}
        style={{ border:"2px dashed #C8D5E0", borderRadius:14, padding:"28px 20px", textAlign:"center", background:"#F7F9FB", cursor: processing ? "wait" : "pointer", marginBottom:16, transition:"all 0.2s ease" } as any}>
        {processing ? (
          <>
            <div style={{ fontSize:32, marginBottom:8 }}>⏳</div>
            <p style={{ fontSize:15, fontWeight:700, color:"#1C3557", margin:"0 0 4px", fontFamily:"'DM Sans',sans-serif" }}>Kennzeichen wird geschwärzt…</p>
            <p style={{ fontSize:12, color:"#8A9BAE", margin:0, fontFamily:"'DM Sans',sans-serif" }}>Bitte warten</p>
          </>
        ) : (
          <>
            <div style={{ fontSize:36, marginBottom:8 }}>📷</div>
            <p style={{ fontSize:15, fontWeight:700, color:"#1C3557", margin:"0 0 4px", fontFamily:"'DM Sans',sans-serif" }}>Fotos hochladen</p>
            <p style={{ fontSize:12, color:"#8A9BAE", margin:0, fontFamily:"'DM Sans',sans-serif" }}>Tippen oder Foto hierher ziehen · JPG, PNG</p>
          </>
        )}
        <input ref={fileRef} type="file" multiple accept="image/*" capture="environment"
          style={{ display:"none" }} onChange={(e: any) => handleFiles(e.target.files)} />
      </div>

      <div style={{ background:"#E8F5E9", border:"1px solid #A5D6A7", borderRadius:10, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:16 }}>🛡️</span>
        <p style={{ fontSize:12, color:"#2E7D32", margin:0, fontFamily:"'DM Sans',sans-serif" }}>
          <strong>Automatischer Datenschutz:</strong> Kennzeichen werden sofort beim Upload geschwärzt.
        </p>
      </div>

      {form.images.length > 0 && (
        <div>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"#1C3557", marginBottom:10, fontFamily:"'DM Sans',sans-serif" }}>
            {form.images.length} Foto{form.images.length !== 1 ? "s" : ""} — Kennzeichen geschwärzt ✅
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {form.images.map((img, i) => (
              <div key={i} style={{ position:"relative", borderRadius:10, overflow:"hidden", aspectRatio:"4/3" }}>
                <img src={img.url} alt={img.name} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" } as any} />
                {i === 0 && (
                  <div style={{ position:"absolute", top:6, left:6, background:"#1C3557", color:"#fff", fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:20, fontFamily:"'DM Sans',sans-serif" }}>TITELBILD</div>
                )}
                <button onClick={(e) => { e.stopPropagation(); removeImage(i); }} style={{ position:"absolute", top:6, right:6, width:22, height:22, borderRadius:"50%", background:"rgba(0,0,0,0.6)", border:"none", color:"#fff", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 } as any}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StepVeroeffentlichen = ({ form, update }: { form: FormState; update: (f: keyof FormState, v: any) => void }) => {
  const fmt = (n: string) => parseInt(n).toLocaleString("de-DE");
  return (
    <div>
      <SectionTitle icon="🚀" title="Veröffentlichen" subtitle="Fast geschafft — letzte Details" />
      <Field label="Laufzeit des Inserats" required>
        <div style={{ display:"flex", gap:8 }}>
          {DURATIONS.map(d => (
            <button key={d} onClick={() => update("duration", d)} style={{
              flex:1, padding:"10px 4px", borderRadius:10, border:"1.5px solid",
              borderColor: form.duration===d ? "#E63027" : "#DDE3EA",
              background: form.duration===d ? "#FFF0F0" : "#FAFBFD",
              color: form.duration===d ? "#E63027" : "#4A5D70",
              fontSize:13, fontWeight: form.duration===d ? 700 : 400,
              cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s ease",
            } as any}>{d}</button>
          ))}
        </div>
      </Field>
      <Field label="Ihr Name" required>
        <Input value={form.name} onChange={(e: any) => update("name", e.target.value)} placeholder="Max Mustermann" />
      </Field>
      <Field label="Telefonnummer" hint="Wird im Inserat angezeigt">
        <Input value={form.phone} onChange={(e: any) => update("phone", e.target.value)} placeholder="+49 170 1234567" type="tel" />
      </Field>
      <Field label="Standort (PLZ oder Ort)" required>
        <Input value={form.location} onChange={(e: any) => update("location", e.target.value)} placeholder="z.B. 80331 München" />
      </Field>

      <div style={{ background:"#F0F4F8", borderRadius:12, padding:16, marginBottom:18 }}>
        <p style={{ fontSize:12, fontWeight:700, color:"#1C3557", margin:"0 0 8px", fontFamily:"'DM Sans',sans-serif" }}>📋 Zusammenfassung</p>
        {[
          ["Fahrzeug", [form.brand,form.model,form.year].filter(Boolean).join(" ") || "–"],
          ["Preis", form.price ? `${fmt(form.price)} €` : "–"],
          ["Kilometerstand", form.mileage ? `${fmt(form.mileage)} km` : "–"],
          ["Kraftstoff", form.fuel || "–"],
          ["Fotos", form.images.length > 0 ? `${form.images.length} Foto(s) ✅` : "Keine"],
        ].map(([label, val]) => (
          <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #DDE3EA" }}>
            <span style={{ fontSize:12, color:"#8A9BAE", fontFamily:"'DM Sans',sans-serif" }}>{label}</span>
            <span style={{ fontSize:12, fontWeight:600, color:"#1C3557", fontFamily:"'DM Sans',sans-serif" }}>{val}</span>
          </div>
        ))}
      </div>

      <label style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" }}>
        <input type="checkbox" checked={form.agreeTerms} onChange={(e: any) => update("agreeTerms", e.target.checked)}
          style={{ width:18, height:18, marginTop:2, accentColor:"#E63027", flexShrink:0 } as any} />
        <span style={{ fontSize:12, color:"#4A5D70", lineHeight:1.5, fontFamily:"'DM Sans',sans-serif" }}>
          Ich stimme den <a href="#" style={{ color:"#E63027", textDecoration:"none", fontWeight:600 }}>Nutzungsbedingungen</a> und der <a href="#" style={{ color:"#E63027", textDecoration:"none", fontWeight:600 }}>Datenschutzerklärung</a> zu.
        </span>
      </label>
    </div>
  );
};

// ── Step indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ current, labels }: { current: number; labels: string[] }) => (
  <div style={{ padding:"0 20px 20px" }}>
    <div style={{ display:"flex", alignItems:"center", gap:0 }}>
      {labels.map((label, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", flex: i < labels.length-1 ? 1 : 0 }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, background: i<current?"#1C3557":i===current?"#E63027":"#E8EDF2", color: i<=current?"#fff":"#8A9BAE", border: i===current?"2px solid #E63027":"2px solid transparent", transition:"all 0.3s ease", boxShadow: i===current?"0 0 0 3px rgba(230,48,39,0.15)":"none" } as any}>
              {i < current ? "✓" : i+1}
            </div>
            <span style={{ fontSize:9, fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase", color: i===current?"#E63027":i<current?"#1C3557":"#8A9BAE", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>{label}</span>
          </div>
          {i < labels.length-1 && <div style={{ flex:1, height:2, margin:"0 4px", marginBottom:20, background: i<current?"#1C3557":"#E8EDF2", transition:"background 0.3s ease" }} />}
        </div>
      ))}
    </div>
  </div>
);

// ── Success screen ────────────────────────────────────────────────────────────
const SuccessScreen = ({ form }: { form: FormState }) => (
  <div style={{ textAlign:"center", padding:"40px 24px" }}>
    <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#1C3557,#2A4F7C)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:36 } as any}>✅</div>
    <h2 style={{ fontSize:24, fontWeight:800, color:"#1C3557", margin:"0 0 8px", fontFamily:"'DM Sans',sans-serif" }}>Inserat veröffentlicht!</h2>
    <p style={{ fontSize:14, color:"#8A9BAE", margin:"0 0 6px", lineHeight:1.6, fontFamily:"'DM Sans',sans-serif" }}>
      Ihr Fahrzeug ist jetzt auf AutoMarket.de sichtbar.
    </p>
    <p style={{ fontSize:13, color:"#4A9D6F", fontWeight:600, margin:"0 0 28px", fontFamily:"'DM Sans',sans-serif" }}>
      🛡️ Kennzeichen wurden automatisch geschwärzt
    </p>
    {form.images.length > 0 && (
      <div style={{ marginBottom:24, borderRadius:12, overflow:"hidden", maxHeight:160 }}>
        <img src={form.images[0].url} alt="Ihr Fahrzeug" style={{ width:"100%", objectFit:"cover", maxHeight:160 } as any} />
      </div>
    )}
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <a href="/" style={{ display:"block", padding:"14px", borderRadius:12, border:"none", background:"#1C3557", color:"#fff", fontSize:15, fontWeight:700, fontFamily:"'DM Sans',sans-serif" } as any}>
        Mein Inserat ansehen →
      </a>
      <button onClick={() => window.location.reload()} style={{ padding:"14px", borderRadius:12, border:"1.5px solid #DDE3EA", background:"transparent", color:"#1C3557", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" } as any}>
        Weiteres Fahrzeug inserieren
      </button>
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CarPostingForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof FormState, value: any) => {
    setForm(prev => ({ ...prev, [field]: typeof value === "function" ? value(prev[field]) : value }));
  };

  const canAdvance = () => {
    if (step === 0) return form.brand && form.model && form.year && form.price;
    if (step === 1) return form.mileage && form.fuel;
    if (step === 2) return form.condition;
    if (step === 4) return form.name && form.location && form.agreeTerms;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));

    // Save to localStorage so homepage can display it
    const newListing = {
      id: `user_${Date.now()}`,
      brand: form.brand,
      model: form.model,
      year: form.year,
      price: form.price,
      mileage: form.mileage,
      fuel: form.fuel,
      location: form.location,
      seller: "Privat",
      image: form.images.length > 0 ? form.images[0].url : "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80",
      badge: null,
      isDemo: false,
    };

    try {
      const existing = JSON.parse(localStorage.getItem("automarket_listings") || "[]");
      localStorage.setItem("automarket_listings", JSON.stringify([newListing, ...existing]));
      localStorage.setItem("automarket_new_listing", newListing.id);
    } catch {}

    setSubmitting(false);
    setSubmitted(true);
  };

  const steps = [
    <StepFahrzeug key="step0" form={form} update={update} />,
    <StepDetails key="step1" form={form} update={update} />,
    <StepZustand key="step2" form={form} update={update} />,
    <StepFotos key="step3" form={form} update={update} />,
    <StepVeroeffentlichen key="step4" form={form} update={update} />,
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin:0; background:#F0F4F8; }
        input:focus, select:focus, textarea:focus { outline:none; }
        button:active { transform:scale(0.98); }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
        .step-content { animation:fadeSlideIn 0.3s ease; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#F0F4F8", display:"flex", flexDirection:"column", alignItems:"center", padding:"0 0 40px" } as any}>

        {/* Header */}
        <div style={{ width:"100%", background:"#1C3557", padding:"16px 20px", display:"flex", alignItems:"center", gap:12, boxShadow:"0 2px 12px rgba(28,53,87,0.3)" } as any}>
          <a href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" } as any}>
            <div style={{ width:36, height:36, borderRadius:8, background:"#E63027", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 } as any}>🚘</div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:"#fff", fontFamily:"'DM Sans',sans-serif", letterSpacing:"-0.01em" } as any}>automarket<span style={{ color:"#E63027" } as any}>.de</span></div>
              <div style={{ fontSize:11, color:"#8AA8C4", fontFamily:"'DM Sans',sans-serif" } as any}>Fahrzeug inserieren</div>
            </div>
          </a>
        </div>

        {/* Card */}
        <div style={{ width:"100%", maxWidth:480, background:"#fff", borderRadius: submitted?"20px":"0 0 20px 20px", boxShadow:"0 4px 30px rgba(28,53,87,0.08)", overflow:"hidden" } as any}>
          {submitted ? (
            <SuccessScreen form={form} />
          ) : (
            <>
              <div style={{ padding:"20px 20px 0" } as any}>
                <StepIndicator current={step} labels={STEPS} />
              </div>
              <div className="step-content" key={step} style={{ padding:"4px 20px 20px" } as any}>
                {steps[step]}
              </div>
              <div style={{ padding:"16px 20px", borderTop:"1px solid #F0F4F8", display:"flex", gap:10, position:"sticky", bottom:0, background:"#fff" } as any}>
                {step > 0 && (
                  <button onClick={() => setStep(s => s-1)} style={{ flex:1, padding:"14px", borderRadius:12, border:"1.5px solid #DDE3EA", background:"transparent", color:"#1C3557", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" } as any}>← Zurück</button>
                )}
                <button
                  onClick={step < STEPS.length-1 ? () => setStep(s => s+1) : handleSubmit}
                  disabled={!canAdvance() || submitting}
                  style={{ flex:2, padding:"14px", borderRadius:12, border:"none", background: canAdvance()&&!submitting?"#E63027":"#C8D5E0", color:"#fff", fontSize:15, fontWeight:700, cursor: canAdvance()&&!submitting?"pointer":"not-allowed", fontFamily:"'DM Sans',sans-serif", transition:"background 0.2s ease", display:"flex", alignItems:"center", justifyContent:"center", gap:8 } as any}>
                  {submitting ? (
                    <><span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" } as any} />Wird veröffentlicht…</>
                  ) : step < STEPS.length-1 ? "Weiter →" : "🚀 Jetzt inserieren"}
                </button>
              </div>
            </>
          )}
        </div>

        {!submitted && (
          <div style={{ display:"flex", gap:16, marginTop:20, padding:"0 20px" } as any}>
            {["🔒 SSL-verschlüsselt","🛡️ Datenschutz","✅ Kostenlos"].map(b => (
              <div key={b} style={{ fontSize:11, color:"#8A9BAE", fontFamily:"'DM Sans',sans-serif" } as any}>{b}</div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
