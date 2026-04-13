"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const STEPS = ["Fahrzeug", "Fotos", "Kontakt"];
const BRANDS = ["Audi","BMW","Mercedes-Benz","Volkswagen","Ford","Opel","Toyota","Renault","Skoda","Seat","Hyundai","Kia","Nissan","Andere"];
const MODELS = {
  "Audi":["A1","A3","A4","A6","Q3","Q5","Q7"],
  "BMW":["1er","2er","3er","5er","X1","X3","X5"],
  "Mercedes-Benz":["A-Klasse","C-Klasse","E-Klasse","GLA","GLC"],
  "Volkswagen":["Golf","Polo","Passat","Tiguan","T-Roc","ID.4"],
  "Ford":["Fiesta","Focus","Puma","Kuga"],
  "Opel":["Corsa","Astra","Mokka"],
  "Toyota":["Yaris","Corolla","RAV4"],
  "Renault":["Clio","Megane","Captur"],
  "Andere":["Sonstiges"]
};
const FUEL_TYPES = ["Benzin","Diesel","Elektro","Hybrid","Plug-in-Hybrid","LPG"];
const CONDITIONS = ["Neu","Neuwertig","Gut","Gebraucht","Mit Mängeln"];

const initialForm = {
  brand:"", model:"", year:"", price:"", mileage:"",
  fuel:"", condition:"", description:"",
  name:"", phone:"", location:"",
  images:[], agreeTerms:false
};

// ── Clean filename — remove spaces and special chars ─────────────────────────
function cleanFilename(name) {
  return name
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();
}

// ── Apply blur using coordinates from API ────────────────────────────────────
async function applyBlurToImage(dataUrl, results) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      if (results && results.length > 0) {
        results.forEach(r => {
          const { xmin, ymin, xmax, ymax } = r.box;
          const pad = 14;
          const x = Math.max(0, xmin - pad);
          const y = Math.max(0, ymin - pad);
          const w = Math.min(img.width, xmax + pad) - x;
          const h = Math.min(img.height, ymax + pad) - y;

          // Strong blur passes
          ctx.save();
          ctx.filter = "blur(14px)";
          for (let i = 0; i < 5; i++) {
            ctx.drawImage(canvas, x, y, w, h, x, y, w, h);
          }
          ctx.restore();

          // Black box over plate
          ctx.fillStyle = "rgba(0,0,0,0.9)";
          ctx.fillRect(x, y, w, h);

          // Shield icon
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.font = `bold ${Math.max(10, h * 0.5)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🛡️", x + w / 2, y + h / 2);
        });
      } else {
        // Fallback — blur bottom 20%
        const blurY = Math.floor(img.height * 0.80);
        ctx.fillStyle = "rgba(0,0,0,0.82)";
        ctx.fillRect(0, blurY, img.width, img.height - blurY);
        ctx.fillStyle = "rgba(255,255,255,0.88)";
        ctx.font = `bold ${Math.max(11, img.width * 0.028)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🛡️ KENNZEICHEN GESCHWÄRZT", img.width / 2, blurY + (img.height - blurY) / 2);
      }

      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.src = dataUrl;
  });
}

// ── Call our own API route (server-side, no CORS) ────────────────────────────
async function detectPlateViaAPI(dataUrl) {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const fd = new FormData();
    fd.append("image", blob, "car.jpg");

    const res = await fetch("/api/blur-plate", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

// ── Upload image to Supabase Storage ────────────────────────────────────────
async function uploadImage(dataUrl, originalName) {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const clean = cleanFilename(originalName.replace(/\.[^.]+$/, ""));
    const path = `cars/${Date.now()}_${clean}.jpg`;

    const { error } = await supabase.storage
      .from("car-images")
      .upload(path, blob, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("Storage error:", error.message);
      return null;
    }

    const { data } = supabase.storage.from("car-images").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error("Upload error:", err);
    return null;
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────
const inputBase = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: "1.5px solid #D0DCF0", fontSize: 14, color: "#1A2B4B",
  background: "#F8FAFD", outline: "none", fontFamily: "'Outfit',sans-serif",
  boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s",
};
const focusedStyle = {
  borderColor: "#0052CC",
  boxShadow: "0 0 0 3px rgba(0,82,204,0.1)",
};

const FInput = ({ value, onChange, placeholder, type = "text", ...rest }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ ...inputBase, ...(focused ? focusedStyle : {}) }}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      {...rest}
    />
  );
};

const FSelect = ({ value, onChange, children, disabled }) => {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value} onChange={onChange} disabled={disabled}
      style={{
        ...inputBase,
        ...(focused ? focusedStyle : {}),
        opacity: disabled ? 0.5 : 1,
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7C93' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        paddingRight: 40,
      }}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    >
      {children}
    </select>
  );
};

const Field = ({ label, required, children, error, hint }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#1A2B4B", marginBottom: 5, fontFamily: "'Outfit',sans-serif" }}>
      {label}{required && <span style={{ color: "#0052CC", marginLeft: 2 }}>*</span>}
    </label>
    {children}
    {error && <p style={{ fontSize: 11, color: "#DC2626", marginTop: 4, fontFamily: "'Outfit',sans-serif" }}>⚠ {error}</p>}
    {hint && !error && <p style={{ fontSize: 11, color: "#6B7C93", marginTop: 4, fontFamily: "'Outfit',sans-serif" }}>{hint}</p>}
  </div>
);

const Row = ({ children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{children}</div>
);

const SectionHead = ({ icon, title, sub }) => (
  <div style={{ marginBottom: 22 }}>
    <h2 style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 800, color: "#1A2B4B", fontFamily: "'Outfit',sans-serif" }}>{icon} {title}</h2>
    <p style={{ margin: 0, fontSize: 12, color: "#6B7C93", fontFamily: "'Outfit',sans-serif" }}>{sub}</p>
  </div>
);

// ── Step 1: Vehicle details ───────────────────────────────────────────────────
const StepFahrzeug = ({ form, update, errors }) => (
  <div>
    <SectionHead icon="🚗" title="Fahrzeugdaten" sub="Grundlegende Fahrzeuginformationen" />

    <Field label="Marke" required error={errors.brand}>
      <FSelect value={form.brand} onChange={e => update("brand", e.target.value)}>
        <option value="">Marke wählen</option>
        {BRANDS.map(b => <option key={b}>{b}</option>)}
      </FSelect>
    </Field>

    <Field label="Modell" required error={errors.model}>
      <FSelect value={form.model} onChange={e => update("model", e.target.value)} disabled={!form.brand}>
        <option value="">Modell wählen</option>
        {(MODELS[form.brand] || []).map(m => <option key={m}>{m}</option>)}
      </FSelect>
    </Field>

    <Row>
      <Field label="Baujahr" required error={errors.year}>
        <FSelect value={form.year} onChange={e => update("year", e.target.value)}>
          <option value="">Jahr</option>
          {Array.from({ length: 30 }, (_, i) => 2024 - i).map(y => <option key={y}>{y}</option>)}
        </FSelect>
      </Field>
      <Field label="Kraftstoff" required error={errors.fuel}>
        <FSelect value={form.fuel} onChange={e => update("fuel", e.target.value)}>
          <option value="">Kraftstoff</option>
          {FUEL_TYPES.map(f => <option key={f}>{f}</option>)}
        </FSelect>
      </Field>
    </Row>

    <Row>
      <Field label="Preis (€)" required error={errors.price}>
        <FInput value={form.price} onChange={e => update("price", e.target.value)} placeholder="12500" type="number" min="0" />
      </Field>
      <Field label="Kilometerstand" required error={errors.mileage}>
        <FInput value={form.mileage} onChange={e => update("mileage", e.target.value)} placeholder="85000" type="number" min="0" />
      </Field>
    </Row>

    <Field label="Fahrzeugzustand" required>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {CONDITIONS.map(c => (
          <button key={c} onClick={() => update("condition", c)} style={{
            padding: "10px 8px", borderRadius: 10, border: "1.5px solid",
            borderColor: form.condition === c ? "#0052CC" : "#D0DCF0",
            background: form.condition === c ? "#EBF2FF" : "#F8FAFD",
            color: form.condition === c ? "#0052CC" : "#4A5D70",
            fontSize: 13, fontWeight: form.condition === c ? 700 : 400,
            cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.2s",
          }}>{c}</button>
        ))}
      </div>
    </Field>

    <Field label="Beschreibung" hint="Je mehr Details, desto mehr Vertrauen">
      <textarea
        value={form.description} onChange={e => update("description", e.target.value)}
        placeholder="z.B. Gepflegt, Nichtraucher, frischer TÜV, Scheckheft lückenlos…"
        rows={4} style={{ ...inputBase, resize: "vertical", lineHeight: 1.6 }}
      />
    </Field>
  </div>
);

// ── Step 2: Photos ────────────────────────────────────────────────────────────
const StepFotos = ({ form, update }) => {
  const fileRef = useRef();
  const [status, setStatus] = useState("idle"); // idle | processing | done
  const [statusMsg, setStatusMsg] = useState("");
  const [plateResult, setPlateResult] = useState(null); // true | false | null

  const handleFiles = useCallback(async (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!valid.length) return;

    setStatus("processing");
    setPlateResult(null);

    for (const file of valid) {
      // Read file
      setStatusMsg("📤 Foto wird geladen…");
      const dataUrl = await new Promise(res => {
        const reader = new FileReader();
        reader.onload = e => res(e.target.result);
        reader.readAsDataURL(file);
      });

      // Call server-side API route for plate detection
      setStatusMsg("🔍 Kennzeichen wird erkannt…");
      const results = await detectPlateViaAPI(dataUrl);
      setPlateResult(results.length > 0);

      // Apply blur
      setStatusMsg("🛡️ Kennzeichen wird geschwärzt…");
      const blurred = await applyBlurToImage(dataUrl, results);

      update("images", prev => [...prev, { url: blurred, name: file.name }]);
    }

    setStatus("done");
    setStatusMsg("");
  }, [update]);

  const remove = (idx) => update("images", prev => prev.filter((_, i) => i !== idx));

  return (
    <div>
      <SectionHead icon="📸" title="Fahrzeugfotos" sub="Kennzeichen werden automatisch erkannt und geschwärzt" />

      {/* Upload zone */}
      <div
        onClick={() => status !== "processing" && fileRef.current?.click()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onDragOver={e => e.preventDefault()}
        style={{
          border: "2px dashed #B8D0EE", borderRadius: 14, padding: "28px 20px",
          textAlign: "center", background: status === "processing" ? "#EBF2FF" : "#F8FAFD",
          cursor: status === "processing" ? "wait" : "pointer", marginBottom: 14,
          minHeight: 130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s",
        }}
      >
        {status === "processing" ? (
          <>
            <div style={{ fontSize: 30, marginBottom: 8 }}>
              {statusMsg.includes("erkannt") ? "🔍" : statusMsg.includes("geschwärzt") ? "🛡️" : "📤"}
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1A2B4B", margin: "0 0 10px", fontFamily: "'Outfit',sans-serif" }}>{statusMsg}</p>
            <div style={{ width: 160, height: 3, background: "#D0DCF0", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "#0052CC", borderRadius: 4, animation: "progress 1.5s ease-in-out infinite" }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1A2B4B", margin: "0 0 4px", fontFamily: "'Outfit',sans-serif" }}>
              {status === "done" ? "Weitere Fotos hinzufügen" : "Fotos hochladen"}
            </p>
            <p style={{ fontSize: 12, color: "#6B7C93", margin: 0, fontFamily: "'Outfit',sans-serif" }}>Tippen zum Aufnehmen · JPG, PNG</p>
          </>
        )}
        <input
          ref={fileRef} type="file" multiple accept="image/*" capture="environment"
          style={{ display: "none" }} onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Plate detection result */}
      {plateResult === true && (
        <div style={{ background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: 10, padding: "10px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <span>✅</span>
          <p style={{ fontSize: 13, color: "#2E7D32", margin: 0, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>Kennzeichen erkannt und präzise geschwärzt!</p>
        </div>
      )}
      {plateResult === false && (
        <div style={{ background: "#FFF8E1", border: "1px solid #FFD54F", borderRadius: 10, padding: "10px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <span>⚠️</span>
          <p style={{ fontSize: 12, color: "#795548", margin: 0, fontFamily: "'Outfit',sans-serif" }}>Kein Kennzeichen erkannt — unterer Bereich vorsorglich geschwärzt.</p>
        </div>
      )}

      {/* Info banner */}
      <div style={{ background: "#EBF2FF", border: "1px solid #B8D0EE", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <span>🛡️</span>
        <p style={{ fontSize: 12, color: "#003D99", margin: 0, fontFamily: "'Outfit',sans-serif" }}>
          <strong>KI-Kennzeichenerkennung:</strong> Automatisch erkannt und geschwärzt.
        </p>
      </div>

      {/* Photo grid */}
      {form.images.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#1A2B4B", marginBottom: 10, fontFamily: "'Outfit',sans-serif" }}>
            {form.images.length} Foto{form.images.length !== 1 ? "s" : ""} — Kennzeichen geschwärzt ✅
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {form.images.map((img, i) => (
              <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "4/3", background: "#EBF2FF" }}>
                <img src={img.url} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                {i === 0 && (
                  <div style={{ position: "absolute", top: 6, left: 6, background: "#0052CC", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>
                    TITELBILD
                  </div>
                )}
                <button onClick={e => { e.stopPropagation(); remove(i); }} style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.65)", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>×</button>
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
      <SectionHead icon="📞" title="Kontakt & Veröffentlichen" sub="Letzte Details — fast fertig!" />

      <Field label="Ihr Name" required error={errors.name}>
        <FInput value={form.name} onChange={e => update("name", e.target.value)} placeholder="Max Mustermann" />
      </Field>
      <Field label="Telefonnummer" hint="Wird im Inserat angezeigt">
        <FInput value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+49 170 1234567" type="tel" />
      </Field>
      <Field label="Standort (PLZ / Ort)" required error={errors.location}>
        <FInput value={form.location} onChange={e => update("location", e.target.value)} placeholder="z.B. 80331 München" />
      </Field>

      {/* Summary card */}
      <div style={{ background: "#F4F7FB", borderRadius: 12, padding: 14, marginBottom: 16, border: "1px solid #E0E8F4" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#1A2B4B", margin: "0 0 10px", fontFamily: "'Outfit',sans-serif" }}>📋 Zusammenfassung</p>
        {[
          ["Fahrzeug", [form.brand, form.model, form.year].filter(Boolean).join(" ") || "–"],
          ["Preis", form.price ? `${fmt(form.price)} €` : "–"],
          ["Kilometerstand", form.mileage ? `${fmt(form.mileage)} km` : "–"],
          ["Kraftstoff", form.fuel || "–"],
          ["Fotos", form.images.length > 0 ? `${form.images.length} Foto(s) 🛡️` : "Keine"],
        ].map(([l, v]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #E0E8F4" }}>
            <span style={{ fontSize: 12, color: "#6B7C93", fontFamily: "'Outfit',sans-serif" }}>{l}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1A2B4B", fontFamily: "'Outfit',sans-serif" }}>{v}</span>
          </div>
        ))}
      </div>

      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
        <input type="checkbox" checked={form.agreeTerms} onChange={e => update("agreeTerms", e.target.checked)}
          style={{ width: 18, height: 18, marginTop: 2, accentColor: "#0052CC", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "#4A5D70", lineHeight: 1.5, fontFamily: "'Outfit',sans-serif" }}>
          Ich stimme den <a href="#" style={{ color: "#0052CC", textDecoration: "none", fontWeight: 600 }}>Nutzungsbedingungen</a> und der <a href="#" style={{ color: "#0052CC", textDecoration: "none", fontWeight: 600 }}>Datenschutzerklärung</a> zu.
        </span>
      </label>
    </div>
  );
};

// ── Step indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ current, labels }) => (
  <div style={{ padding: "0 20px 20px" }}>
    <div style={{ display: "flex", alignItems: "center" }}>
      {labels.map((label, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < labels.length - 1 ? 1 : 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700,
              background: i <= current ? "#0052CC" : "#E0E8F4",
              color: i <= current ? "#fff" : "#6B7C93",
              transition: "all 0.3s",
              boxShadow: i === current ? "0 0 0 3px rgba(0,82,204,0.15)" : "none",
            }}>
              {i < current ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: i === current ? "#0052CC" : i < current ? "#003D99" : "#6B7C93", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap" }}>{label}</span>
          </div>
          {i < labels.length - 1 && (
            <div style={{ flex: 1, height: 2, margin: "0 6px", marginBottom: 20, background: i < current ? "#0052CC" : "#E0E8F4", transition: "background 0.3s" }} />
          )}
        </div>
      ))}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function CarPostingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const update = (field, value) =>
    setForm(prev => ({ ...prev, [field]: typeof value === "function" ? value(prev[field]) : value }));

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.brand) e.brand = "Bitte Marke wählen";
      if (!form.model) e.model = "Bitte Modell wählen";
      if (!form.year) e.year = "Bitte Jahr wählen";
      if (!form.price || parseInt(form.price) <= 0) e.price = "Gültigen Preis eingeben";
      if (!form.mileage || parseInt(form.mileage) < 0) e.mileage = "Kilometerstand eingeben";
      if (!form.fuel) e.fuel = "Kraftstoff wählen";
    }
    if (step === 2) {
      if (!form.name.trim()) e.name = "Name erforderlich";
      if (!form.location.trim()) e.location = "Standort erforderlich";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!form.agreeTerms) {
      setErrors({ agreeTerms: "Bitte zustimmen" });
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      // Build title from car data
      const title = [form.brand, form.model, form.year].filter(Boolean).join(" ");

      // Upload image to Supabase Storage
      let imageUrl = null;
      if (form.images.length > 0) {
        imageUrl = await uploadImage(form.images[0].url, form.images[0].name);
      }

      // Insert into Supabase listings table
      const { data, error } = await supabase
        .from("listings")
        .insert([{
          title: title,
          price: form.price.toString(),
          image_url: imageUrl,
        }])
        .select("id")
        .single();

      if (error) {
        console.error("Supabase insert error:", error.message, error.details);
        setSubmitError(`Fehler: ${error.message}`);
        setSubmitting(false);
        return;
      }

      // Mark new listing for homepage highlight
      if (data?.id) {
        localStorage.setItem("automarket_new_listing", data.id.toString());
      }

      // Redirect to homepage
      router.push("/");

    } catch (err) {
      console.error("Unexpected error:", err);
      setSubmitError("Unerwarteter Fehler. Bitte erneut versuchen.");
      setSubmitting(false);
    }
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
        * { box-sizing: border-box; }
        body { margin: 0; background: #F4F7FB; }
        input:focus, select:focus, textarea:focus { outline: none; }
        button:active { transform: scale(0.98); }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progress { 0%{width:0%;margin-left:0;} 50%{width:60%;margin-left:20%;} 100%{width:0%;margin-left:100%;} }
        .step-content { animation: fadeSlideIn 0.3s ease; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#F4F7FB", display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 40 }}>

        {/* Header */}
        <div style={{ width: "100%", background: "#0052CC", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px rgba(0,82,204,0.3)" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🚘</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "'Outfit',sans-serif" }}>automarket<span style={{ color: "#7EB8FF" }}>.de</span></div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", fontFamily: "'Outfit',sans-serif" }}>Fahrzeug inserieren</div>
            </div>
          </a>
        </div>

        {/* Progress bar */}
        <div style={{ width: "100%", height: 3, background: "#E0E8F4" }}>
          <div style={{ height: "100%", background: "#0052CC", width: `${((step + 1) / STEPS.length) * 100}%`, transition: "width 0.3s ease" }} />
        </div>

        {/* Form card */}
        <div style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: "0 0 20px 20px", boxShadow: "0 4px 24px rgba(0,82,204,0.08)", overflow: "hidden", border: "1px solid #E0E8F4" }}>
          <div style={{ padding: "20px 20px 0" }}>
            <StepIndicator current={step} labels={STEPS} />
          </div>

          <div className="step-content" key={step} style={{ padding: "4px 20px 20px" }}>
            {steps[step]}
          </div>

          {/* Error message */}
          {submitError && (
            <div style={{ margin: "0 20px 14px", padding: "12px 14px", background: "#FEE2E2", borderRadius: 10, border: "1px solid #FCA5A5" }}>
              <p style={{ fontSize: 13, color: "#DC2626", margin: 0, fontFamily: "'Outfit',sans-serif" }}>⚠ {submitError}</p>
            </div>
          )}

          {/* Navigation */}
          <div style={{ padding: "14px 20px", borderTop: "1px solid #F0F4FA", display: "flex", gap: 10, position: "sticky", bottom: 0, background: "#fff" }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: "13px", borderRadius: 12, border: "1.5px solid #D0DCF0", background: "transparent", color: "#1A2B4B", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                ← Zurück
              </button>
            )}
            <button
              onClick={step < STEPS.length - 1 ? handleNext : handleSubmit}
              disabled={submitting || (step === 2 && !form.agreeTerms)}
              style={{
                flex: 2, padding: "13px", borderRadius: 12, border: "none",
                background: submitting || (step === 2 && !form.agreeTerms) ? "#C8D5E0" : "#0052CC",
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: submitting ? "wait" : "pointer",
                fontFamily: "'Outfit',sans-serif", transition: "background 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {submitting ? (
                <>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  Wird gespeichert…
                </>
              ) : step < STEPS.length - 1 ? "Weiter →" : "🚀 Jetzt inserieren"}
            </button>
          </div>
        </div>

        {/* Trust badges */}
        <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
          {["🔒 SSL", "🛡️ Datenschutz", "✅ Kostenlos"].map(b => (
            <div key={b} style={{ fontSize: 11, color: "#6B7C93", fontFamily: "'Outfit',sans-serif" }}>{b}</div>
          ))}
        </div>
      </div>
    </>
  );
}
