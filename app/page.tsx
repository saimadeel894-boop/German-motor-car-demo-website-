"use client";
import { useState, useEffect } from "react";

const BRANDS = ["Alle Marken", "Audi", "BMW", "Mercedes-Benz", "Volkswagen", "Ford", "Opel", "Toyota", "Renault"];
const MODELS = ["Alle Modelle", "Golf", "3er", "A4", "C-Klasse", "Polo", "Corsa", "Yaris", "Clio"];
const PRICES = ["Beliebig", "bis 5.000 €", "bis 10.000 €", "bis 20.000 €", "bis 35.000 €", "bis 50.000 €"];

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel: string;
  location: string;
  image: string;
  badge: string | null;
  seller: string;
  isDemo: boolean;
}

const SAMPLE_CARS: Car[] = [
  { id: "s1", brand: "Volkswagen", model: "Golf GTI", year: 2020, price: 24900, mileage: 42000, fuel: "Benzin", location: "München", image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80", badge: null, seller: "Privat", isDemo: true },
  { id: "s2", brand: "BMW", model: "320d xDrive", year: 2019, price: 28500, mileage: 68000, fuel: "Diesel", location: "Berlin", image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80", badge: "DEAL", seller: "Händler", isDemo: true },
  { id: "s3", brand: "Audi", model: "A4 Avant", year: 2021, price: 33800, mileage: 29000, fuel: "Diesel", location: "Hamburg", image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80", badge: null, seller: "Händler", isDemo: true },
];

const BRANDS_LOGOS = [
  { name: "VW", emoji: "🔵" }, { name: "BMW", emoji: "🔵" },
  { name: "Audi", emoji: "⭕" }, { name: "Mercedes", emoji: "⭐" },
  { name: "Ford", emoji: "🔷" }, { name: "Opel", emoji: "⚡" },
];

export default function HomePage() {
  const [brand, setBrand] = useState("Alle Marken");
  const [model, setModel] = useState("Alle Modelle");
  const [price, setPrice] = useState("Beliebig");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userCars, setUserCars] = useState<Car[]>([]);
  const [newCarId, setNewCarId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("automarket_listings") || "[]");
      setUserCars(stored);
      const latest = localStorage.getItem("automarket_new_listing");
      if (latest) {
        setNewCarId(latest);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        setTimeout(() => {
          setNewCarId(null);
          localStorage.removeItem("automarket_new_listing");
        }, 5000);
      }
    } catch {}
  }, []);

  const allCars = [...userCars, ...SAMPLE_CARS];
  const fmt = (n: number | string) => {
    const val = typeof n === "string" ? parseInt(n) : n;
    return val.toLocaleString("de-DE");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F0F4F8; }
        a { text-decoration: none; color: inherit; }
        button { cursor: pointer; font-family: 'DM Sans', sans-serif; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseRed {
          0%,100% { box-shadow: 0 2px 16px rgba(28,53,87,0.07); }
          50% { box-shadow: 0 0 0 4px rgba(230,48,39,0.25); }
        }
        .card { animation: fadeUp 0.4s ease both; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(28,53,87,0.13) !important; }
        .new-card { animation: pulseRed 1s ease 4 !important; border: 2px solid #E63027 !important; }
        .brand-pill { transition: all 0.18s ease; }
        .brand-pill:hover { background: #1C3557!important; color:#fff!important; }
        .toast { animation: slideDown 0.3s ease; }
      `}</style>

      <div style={{ minHeight: "100vh" }}>

        {/* NAV */}
        <nav style={{ background:"#1C3557", padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between", height:56, position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 16px rgba(28,53,87,0.35)" } as any}>
          <a href="/" style={{ display:"flex", alignItems:"center", gap:8 } as any}>
            <div style={{ width:32, height:32, borderRadius:7, background:"#E63027", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 } as any}>🚘</div>
            <span style={{ fontSize:16, fontWeight:800, color:"#fff", letterSpacing:"-0.01em" } as any}>automarket<span style={{ color:"#E63027" } as any}>.de</span></span>
          </a>
          <div style={{ display:"flex", alignItems:"center", gap:6 } as any}>
            <a href="/inserate/neu" style={{ background:"#E63027", color:"#fff", fontSize:13, fontWeight:700, padding:"8px 14px", borderRadius:8 } as any}>+ Inserieren</a>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background:"transparent", border:"none", color:"#8AA8C4", fontSize:20, padding:"4px 8px" } as any}>☰</button>
          </div>
        </nav>

        {menuOpen && (
          <div style={{ position:"fixed", top:56, left:0, right:0, bottom:0, background:"#1C3557", zIndex:99, padding:24, display:"flex", flexDirection:"column", gap:4 } as any}>
            {["🏠 Startseite", "🔍 Alle Fahrzeuge", "📝 Inserat aufgeben", "🏢 Händlerbereich"].map(item => (
              <a key={item} href={item.includes("Inserat") ? "/inserate/neu" : "#"} onClick={() => setMenuOpen(false)}
                style={{ color:"#fff", fontSize:17, fontWeight:600, padding:"14px 0", borderBottom:"1px solid rgba(255,255,255,0.08)" } as any}>{item}</a>
            ))}
          </div>
        )}

        {/* TOAST */}
        {showToast && (
          <div className="toast" style={{ position:"fixed", top:66, left:16, right:16, zIndex:200, background:"#1C3557", borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, boxShadow:"0 8px 30px rgba(28,53,87,0.3)" } as any}>
            <span style={{ fontSize:22 }}>✅</span>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:"#fff", margin:0 }}>Inserat veröffentlicht!</p>
              <p style={{ fontSize:11, color:"#8AA8C4", margin:0 }}>Ihr Fahrzeug ist jetzt sichtbar — siehe unten</p>
            </div>
          </div>
        )}

        {/* HERO */}
        <div style={{ background:"linear-gradient(160deg,#1C3557 0%,#2A4F7C 60%,#1a3a5c 100%)", padding:"36px 20px 48px", position:"relative", overflow:"hidden" } as any}>
          <div style={{ position:"absolute", top:-60, right:-60, width:220, height:220, borderRadius:"50%", background:"rgba(230,48,39,0.08)", pointerEvents:"none" } as any} />
          <div style={{ maxWidth:480, margin:"0 auto", position:"relative" } as any}>
            <p style={{ fontSize:12, fontWeight:700, letterSpacing:"0.12em", color:"#E63027", textTransform:"uppercase", marginBottom:8 } as any}>🇩🇪 Deutschlands neue Autoplatform</p>
            <h1 style={{ fontSize:28, fontWeight:800, color:"#fff", lineHeight:1.2, marginBottom:8, letterSpacing:"-0.02em" } as any}>
              Finde dein<br /><span style={{ color:"#E63027" } as any}>Traumauto.</span>
            </h1>
            <p style={{ fontSize:14, color:"#8AA8C4", marginBottom:24, lineHeight:1.5 } as any}>
              {allCars.length.toLocaleString("de-DE")} Fahrzeuge von Privat und Händlern
            </p>
            <div style={{ background:"#fff", borderRadius:16, padding:16, boxShadow:"0 8px 40px rgba(0,0,0,0.25)" } as any}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 } as any}>
                {[["Marke", BRANDS, brand, setBrand], ["Modell", MODELS, model, setModel]].map(([label, opts, val, set]: any) => (
                  <div key={label}>
                    <label style={{ fontSize:10, fontWeight:700, color:"#8A9BAE", letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:4 } as any}>{label}</label>
                    <select value={val} onChange={(e: any) => set(e.target.value)} style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:"1.5px solid #E0E8F0", fontSize:13, color:"#1C3557", fontWeight:600, background:"#F7F9FB", appearance:"none" } as any}>
                      {opts.map((o: any) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:10 } as any}>
                <label style={{ fontSize:10, fontWeight:700, color:"#8A9BAE", letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:4 } as any}>Max. Preis</label>
                <select value={price} onChange={(e: any) => setPrice(e.target.value)} style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:"1.5px solid #E0E8F0", fontSize:13, color:"#1C3557", fontWeight:600, background:"#F7F9FB", appearance:"none" } as any}>
                  {PRICES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <button style={{ width:"100%", padding:"13px", borderRadius:10, border:"none", background:"#E63027", color:"#fff", fontSize:15, fontWeight:700 } as any}>🔍 Fahrzeuge suchen</button>
            </div>
          </div>
        </div>

        {/* BRANDS */}
        <div style={{ padding:"24px 20px 0", maxWidth:480, margin:"0 auto" } as any}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#8A9BAE", marginBottom:12 } as any}>Beliebte Marken</p>
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none" } as any}>
            {BRANDS_LOGOS.map(b => (
              <button key={b.name} className="brand-pill" style={{ flexShrink:0, padding:"7px 14px", borderRadius:20, border:"1.5px solid #DDE3EA", background:"#fff", fontSize:12, fontWeight:700, color:"#1C3557", display:"flex", alignItems:"center", gap:6 } as any}>
                <span style={{ fontSize:14 }}>{b.emoji}</span>{b.name}
              </button>
            ))}
          </div>
        </div>

        {/* LISTINGS */}
        <div style={{ padding:"24px 20px", maxWidth:480, margin:"0 auto" } as any}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 } as any}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#8A9BAE" } as any}>
              Aktuelle Inserate ({allCars.length})
            </p>
            <a href="#" style={{ fontSize:12, fontWeight:700, color:"#E63027" } as any}>Alle ansehen →</a>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 } as any}>
            {allCars.map((car, i) => (
              <div key={car.id} className={`card${car.id === newCarId ? " new-card" : ""}`}
                style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 16px rgba(28,53,87,0.07)", display:"flex", height:110, animationDelay:`${i*0.05}s`, border:"2px solid transparent" } as any}>
                <div style={{ width:130, flexShrink:0, position:"relative" } as any}>
                  <img src={car.image} alt={car.model} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" } as any} />
                  {car.id === newCarId && (
                    <div style={{ position:"absolute", top:8, left:8, background:"#E63027", color:"#fff", fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:20 } as any}>NEU ✨</div>
                  )}
                  {car.badge && car.id !== newCarId && (
                    <div style={{ position:"absolute", top:8, left:8, background:"#E63027", color:"#fff", fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:20 } as any}>{car.badge}</div>
                  )}
                  {/* Plate blur strip for user-posted cars */}
                  {!car.isDemo && (
                    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:26, backdropFilter:"blur(10px)", background:"rgba(0,0,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center" } as any}>
                      <span style={{ fontSize:8, color:"rgba(255,255,255,0.8)", fontWeight:700, letterSpacing:"0.05em" } as any}>🛡️ KENNZEICHEN GESCHWÄRZT</span>
                    </div>
                  )}
                </div>
                <div style={{ padding:"12px 14px", flex:1, display:"flex", flexDirection:"column", justifyContent:"space-between" } as any}>
                  <div style={{}}>
                    <p style={{ fontSize:15, fontWeight:800, color:"#1C3557", marginBottom:2, lineHeight:1.2 } as any}>{car.brand} {car.model}</p>
                    <p style={{ fontSize:11, color:"#8A9BAE" } as any}>{car.year} · {fmt(car.mileage)} km · {car.fuel}</p>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" } as any}>
                    <p style={{ fontSize:18, fontWeight:800, color:"#E63027" } as any}>{fmt(car.price)} €</p>
                    <div style={{ display:"flex", alignItems:"center", gap:6 } as any}>
                      <span style={{ fontSize:9, fontWeight:700, padding:"3px 7px", borderRadius:20, background: car.seller === "Händler" ? "#EEF3F8" : "#FFF0F0", color: car.seller === "Händler" ? "#1C3557" : "#E63027" } as any}>{car.seller || "Privat"}</span>
                      <span style={{ fontSize:11, color:"#8A9BAE" } as any}>📍 {car.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding:"0 20px 32px", maxWidth:480, margin:"0 auto" } as any}>
          <div style={{ background:"linear-gradient(135deg,#1C3557,#2A4F7C)", borderRadius:16, padding:"24px 20px", textAlign:"center" } as any}>
            <p style={{ fontSize:22, marginBottom:6 } as any}>🚗</p>
            <h3 style={{ fontSize:18, fontWeight:800, color:"#fff", marginBottom:6 } as any}>Fahrzeug verkaufen?</h3>
            <p style={{ fontSize:13, color:"#8AA8C4", marginBottom:18, lineHeight:1.5 } as any}>Inserat in 3 Minuten aufgeben — kostenlos für Privatanbieter.</p>
            <a href="/inserate/neu" style={{ display:"inline-block", padding:"12px 28px", background:"#E63027", color:"#fff", fontSize:14, fontWeight:700, borderRadius:10 } as any}>+ Jetzt inserieren</a>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ background:"#1C3557", padding:"24px 20px", textAlign:"center" } as any}>
          <div style={{ fontSize:16, fontWeight:800, color:"#fff", marginBottom:4 } as any}>automarket<span style={{ color:"#E63027" } as any}>.de</span></div>
          <p style={{ fontSize:12, color:"#8AA8C4", marginBottom:16 } as any}>Die moderne Fahrzeugplattform für Deutschland</p>
          <div style={{ display:"flex", justifyContent:"center", gap:16, flexWrap:"wrap" } as any}>
            {["Impressum","Datenschutz","AGB","Kontakt"].map(item => (
              <a key={item} href="#" style={{ fontSize:11, color:"#8AA8C4", fontWeight:600 } as any}>{item}</a>
            ))}
          </div>
          <p style={{ fontSize:11, color:"#4A6380", marginTop:16 } as any}>© 2025 AutoMarket.de</p>
        </div>
      </div>
    </>
  );
}
