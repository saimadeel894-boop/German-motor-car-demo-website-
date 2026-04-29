"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// --- Constants ---
const STEPS = ["Basisinfo", "Fotos", "Kontakt"];
const BRANDS = ["Audi", "BMW", "Mercedes-Benz", "Volkswagen", "Ford", "Opel", "Toyota", "Renault", "Skoda", "Seat", "Hyundai", "Kia", "Nissan", "Porsche", "Tesla", "Andere"];
const MODELS = {
  "Audi": ["A1", "A3", "A4", "A6", "Q3", "Q5", "Q7", "e-tron"],
  "BMW": ["1er", "2er", "3er", "5er", "X1", "X3", "X5", "i3", "i4"],
  "Mercedes-Benz": ["A-Klasse", "C-Klasse", "E-Klasse", "GLA", "GLC", "GLE", "EQS"],
  "Volkswagen": ["Golf", "Polo", "Passat", "Tiguan", "T-Roc", "ID.3", "ID.4"],
  "Ford": ["Fiesta", "Focus", "Puma", "Kuga", "Mustang Mach-E"],
  "Opel": ["Corsa", "Astra", "Mokka", "Grandland"],
  "Toyota": ["Yaris", "Corolla", "RAV4", "C-HR"],
  "Andere": ["Sonstiges"]
};
const FUEL_TYPES = ["Benzin", "Diesel", "Elektro", "Hybrid", "Plug-in-Hybrid"];
const CONDITIONS = ["Top Zustand", "Sehr gut", "Gebraucht", "Beschädigt"];

const initialForm = {
  brand: "", model: "", year: "", price: "", mileage: "",
  fuel: "", condition: "", description: "",
  name: "", phone: "", location: "",
  images: [], agreeTerms: false
};

// --- Helper Functions ---
function cleanFilename(name) {
  return name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase();
}

async function resizeImageFile(file, maxWidth = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let w = img.width;
      let h = img.height;
      if (w > maxWidth || h > maxWidth) {
        const ratio = Math.min(maxWidth / w, maxWidth / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });
}

// --- UI Components ---
const InputField = ({ label, required, error, children }) => (
  <div style={{ marginBottom: "20px" }}>
    <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "var(--secondary)", marginBottom: "8px" }}>
      {label} {required && <span style={{ color: "var(--error)" }}>*</span>}
    </label>
    {children}
    {error && <p style={{ fontSize: "12px", color: "var(--error)", marginTop: "4px" }}>{error}</p>}
  </div>
);

const StyledInput = ({ ...props }) => (
  <input
    {...props}
    style={{
      width: "100%",
      padding: "12px 16px",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border)",
      fontSize: "15px",
      color: "var(--text-main)",
      background: "var(--white)",
      transition: "border-color 0.2s",
      ...props.style
    }}
    onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
    onBlur={(e) => e.target.style.borderColor = "var(--border)"}
  />
);

const StyledSelect = ({ ...props }) => (
  <select
    {...props}
    style={{
      width: "100%",
      padding: "12px 16px",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border)",
      fontSize: "15px",
      color: "var(--text-main)",
      background: "var(--white)",
      appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7C93' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 16px center",
      ...props.style
    }}
  >
    {props.children}
  </select>
);

// --- Steps ---
const StepInfo = ({ form, update, errors }) => (
  <div style={{ animation: "fadeIn 0.4s ease" }}>
    <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "24px", color: "var(--primary)" }}>Fahrzeugdaten</h2>
    
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      <InputField label="Marke" required error={errors.brand}>
        <StyledSelect value={form.brand} onChange={e => { update("brand", e.target.value); update("model", ""); }}>
          <option value="">Wählen</option>
          {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
        </StyledSelect>
      </InputField>
      <InputField label="Modell" required error={errors.model}>
        <StyledSelect value={form.model} onChange={e => update("model", e.target.value)} disabled={!form.brand}>
          <option value="">Wählen</option>
          {(MODELS[form.brand] || []).map(m => <option key={m} value={m}>{m}</option>)}
        </StyledSelect>
      </InputField>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      <InputField label="Erstzulassung" required error={errors.year}>
        <StyledSelect value={form.year} onChange={e => update("year", e.target.value)}>
          <option value="">Jahr</option>
          {Array.from({ length: 30 }, (_, i) => 2024 - i).map(y => <option key={y} value={y}>{y}</option>)}
        </StyledSelect>
      </InputField>
      <InputField label="Kraftstoff" required error={errors.fuel}>
        <StyledSelect value={form.fuel} onChange={e => update("fuel", e.target.value)}>
          <option value="">Wählen</option>
          {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
        </StyledSelect>
      </InputField>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      <InputField label="Preis (€)" required error={errors.price}>
        <StyledInput type="number" value={form.price} onChange={e => update("price", e.target.value)} placeholder="z.B. 15000" />
      </InputField>
      <InputField label="Kilometer" required error={errors.mileage}>
        <StyledInput type="number" value={form.mileage} onChange={e => update("mileage", e.target.value)} placeholder="z.B. 80000" />
      </InputField>
    </div>

    <InputField label="Zustand" required>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {CONDITIONS.map(c => (
          <button
            key={c}
            onClick={() => update("condition", c)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "600",
              border: "1px solid",
              borderColor: form.condition === c ? "var(--primary)" : "var(--border)",
              background: form.condition === c ? "var(--primary-light)" : "var(--white)",
              color: form.condition === c ? "var(--primary)" : "var(--text-muted)",
              cursor: "pointer"
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </InputField>

    <InputField label="Beschreibung">
      <textarea
        value={form.description}
        onChange={e => update("description", e.target.value)}
        placeholder="Details zum Zustand, Ausstattung, etc..."
        rows={4}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          fontSize: "15px",
          fontFamily: "inherit",
          resize: "none"
        }}
      />
    </InputField>
  </div>
);

const StepPhotos = ({ form, update }) => {
  const fileRef = useRef();
  const [loading, setLoading] = useState(false);

  const handleFiles = async (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!valid.length) return;
    setLoading(true);
    for (const file of valid) {
      const resized = await resizeImageFile(file);
      update("images", prev => [...prev, { url: resized, name: file.name }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px", color: "var(--primary)" }}>Fotos hochladen</h2>
      <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px" }}>Gute Fotos erhöhen die Verkaufschancen deutlich.</p>
      
      <div
        onClick={() => !loading && fileRef.current?.click()}
        style={{
          border: "2px dashed var(--primary-light)",
          borderRadius: "var(--radius-lg)",
          padding: "40px 20px",
          textAlign: "center",
          background: "var(--white)",
          cursor: loading ? "wait" : "pointer",
          marginBottom: "20px",
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--primary-light)"}
      >
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>📸</div>
        <p style={{ fontWeight: "700", color: "var(--secondary)", marginBottom: "4px" }}>
          {loading ? "Verarbeitung..." : "Fotos auswählen oder hierher ziehen"}
        </p>
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Mindestens 1 Foto, JPG oder PNG</p>
        <input type="file" multiple accept="image/*" ref={fileRef} style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        {form.images.map((img, i) => (
          <div key={i} style={{ position: "relative", aspectRatio: "4/3", borderRadius: "var(--radius-md)", overflow: "hidden", background: "#eee" }}>
            <img src={img.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              onClick={() => update("images", prev => prev.filter((_, idx) => idx !== i))}
              style={{
                position: "absolute", top: "5px", right: "5px", width: "24px", height: "24px",
                borderRadius: "50%", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "14px"
              }}
            >
              ×
            </button>
            {i === 0 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--primary)", color: "#fff", fontSize: "10px", textAlign: "center", padding: "2px", fontWeight: "700" }}>TITELBILD</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

const StepContact = ({ form, update, errors }) => (
  <div style={{ animation: "fadeIn 0.4s ease" }}>
    <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "24px", color: "var(--primary)" }}>Kontaktdaten</h2>
    
    <InputField label="Name" required error={errors.name}>
      <StyledInput value={form.name} onChange={e => update("name", e.target.value)} placeholder="Max Mustermann" />
    </InputField>
    
    <InputField label="WhatsApp Nummer" required error={errors.phone}>
      <StyledInput value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+49 176 12345678" type="tel" />
    </InputField>
    
    <InputField label="Standort" required error={errors.location}>
      <StyledInput value={form.location} onChange={e => update("location", e.target.value)} placeholder="München, 80331" />
    </InputField>

    <div style={{ marginTop: "32px", padding: "16px", background: "var(--primary-light)", borderRadius: "var(--radius-md)", color: "var(--primary)" }}>
      <label style={{ display: "flex", gap: "12px", cursor: "pointer", alignItems: "flex-start" }}>
        <input type="checkbox" checked={form.agreeTerms} onChange={e => update("agreeTerms", e.target.checked)} style={{ marginTop: "4px", accentColor: "var(--primary)" }} />
        <span style={{ fontSize: "13px", lineHeight: "1.5" }}>
          Ich bestätige die Richtigkeit der Angaben und akzeptiere die <strong>Nutzungsbedingungen</strong> von automarket.de
        </span>
      </label>
    </div>
  </div>
);

// --- Main Page ---
export default function InseratNeu() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm(prev => ({
    ...prev,
    [field]: typeof value === "function" ? value(prev[field]) : value
  }));

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.brand) e.brand = "Marke wählen";
      if (!form.model) e.model = "Modell wählen";
      if (!form.year) e.year = "Jahr wählen";
      if (!form.price) e.price = "Preis angeben";
      if (!form.mileage) e.mileage = "Kilometer angeben";
      if (!form.fuel) e.fuel = "Kraftstoff wählen";
    } else if (step === 1) {
      if (form.images.length === 0) {
        alert("Bitte lade mindestens ein Foto hoch.");
        return false;
      }
    } else if (step === 2) {
      if (!form.name) e.name = "Name erforderlich";
      if (!form.phone) e.phone = "Telefonnummer erforderlich";
      if (!form.location) e.location = "Standort erforderlich";
      if (!form.agreeTerms) {
        alert("Bitte akzeptiere die Nutzungsbedingungen.");
        return false;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let imageUrl = null;
      if (form.images.length > 0) {
        const res = await fetch(form.images[0].url);
        const blob = await res.blob();
        const path = `car_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from("car-images").upload(path, blob);
        if (!uploadError) {
          const { data } = supabase.storage.from("car-images").getPublicUrl(path);
          imageUrl = data.publicUrl;
        }
      }

      const { data, error } = await supabase.from("listings").insert([{
        title: `${form.brand} ${form.model} (${form.year})`,
        brand: form.brand,
        model: form.model,
        year: form.year,
        price: form.price,
        mileage: form.mileage,
        fuel_type: form.fuel,
        condition: form.condition,
        description: form.description,
        seller_name: form.name,
        phone: form.phone,
        location: form.location,
        image_url: imageUrl,
        seller_id: localStorage.getItem("user_device_id") || "guest" // simple tracking
      }]).select().single();

      if (!error) {
        localStorage.setItem("automarket_new_listing", data.id);
        router.push("/");
      } else {
        alert("Fehler beim Speichern: " + error.message);
      }
    } catch (err) {
      alert("Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "20px 0" }}>
      {/* Header */}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "0 20px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontSize: "20px", fontWeight: "900", color: "var(--primary)" }}>Auto<span style={{ color: "var(--secondary)" }}>Market</span></a>
        <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-muted)" }}>Schritt {step + 1} von {STEPS.length}</div>
      </div>

      {/* Progress Bar */}
      <div style={{ maxWidth: "600px", margin: "0 auto 24px", height: "6px", background: "var(--white)", borderRadius: "3px", overflow: "hidden", marginInline: "20px" }}>
        <div style={{ width: `${((step + 1) / STEPS.length) * 100}%`, height: "100%", background: "var(--primary)", transition: "width 0.3s ease" }} />
      </div>

      {/* Main Card */}
      <main style={{ maxWidth: "600px", margin: "0 auto", padding: "0 20px" }}>
        <div className="card" style={{ padding: "32px" }}>
          {step === 0 && <StepInfo form={form} update={update} errors={errors} />}
          {step === 1 && <StepPhotos form={form} update={update} />}
          {step === 2 && <StepContact form={form} update={update} errors={errors} />}

          <div style={{ marginTop: "40px", display: "flex", gap: "12px" }}>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="btn-ghost"
                style={{ flex: 1 }}
              >
                Zurück
              </button>
            )}
            <button
              onClick={step === STEPS.length - 1 ? handleSubmit : handleNext}
              className="btn-primary"
              style={{ flex: 2 }}
              disabled={loading}
            >
              {loading ? "Wird verarbeitet..." : step === STEPS.length - 1 ? "Anzeige schalten" : "Weiter"}
            </button>
          </div>
        </div>
        
        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "24px" }}>
          Sicheres Inserieren · Über 50.000 monatliche Nutzer
        </p>
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
