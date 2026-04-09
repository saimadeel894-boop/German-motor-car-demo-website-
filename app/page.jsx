"use client";
import { useState, useEffect } from "react";

const BRANDS = ["Alle Marken","Audi","BMW","Mercedes-Benz","Volkswagen","Ford","Opel","Toyota","Renault"];
const MODELS = ["Alle Modelle","Golf","3er","A4","C-Klasse","Polo","Corsa","Yaris","Clio"];
const PRICES = ["Beliebig","bis 5.000 €","bis 10.000 €","bis 20.000 €","bis 35.000 €","bis 50.000 €"];

const SAMPLE_CARS = [
  { id:"s1", brand:"Volkswagen", model:"Golf GTI", year:2020, price:24900, mileage:42000, fuel:"Benzin", location:"München", image:"https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=90", badge:null, seller:"Privat", isDemo:true },
  { id:"s2", brand:"BMW", model:"320d xDrive", year:2019, price:28500, mileage:68000, fuel:"Diesel", location:"Berlin", image:"https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=90", badge:"DEAL", seller:"Händler", isDemo:true },
  { id:"s3", brand:"Audi", model:"A4 Avant", year:2021, price:33800, mileage:29000, fuel:"Diesel", location:"Hamburg", image:"https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=90", badge:null, seller:"Händler", isDemo:true },
  { id:"s4", brand:"Mercedes-Benz", model:"C 200", year:2018, price:22400, mileage:91000, fuel:"Benzin", location:"Frankfurt", image:"https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=90", badge:null, seller:"Privat", isDemo:true },
];

const BRAND_LOGOS = [
  { name:"VW", bg:"#001E50", color:"#fff" },
  { name:"BMW", bg:"#0066CC", color:"#fff" },
  { name:"Audi", bg:"#BB0A21", color:"#fff" },
  { name:"Mercedes", bg:"#222", color:"#fff" },
  { name:"Ford", bg:"#003476", color:"#fff" },
  { name:"Opel", bg:"#FFCB00", color:"#222" },
];

export default function HomePage() {
  const [brand, setBrand] = useState("Alle Marken");
  const [model, setModel] = useState("Alle Modelle");
  const [price, setPrice] = useState("Beliebig");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [userCars, setUserCars] = useState([]);
  const [newCarId, setNewCarId] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("automarket_listings") || "[]");
      setUserCars(stored);
      const latest = localStorage.getItem("automarket_new_listing");
      if (latest) {
        setNewCarId(latest);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
        setTimeout(() => { setNewCarId(null); localStorage.removeItem("automarket_new_listing"); }, 6000);
      }
      const savedUser = localStorage.getItem("automarket_user");
      if (savedUser) { setLoggedIn(true); setUserName(savedUser); }
    } catch {}
  }, []);

  const handleGoogleLogin = () => {
    const name = "Toni M.";
    localStorage.setItem("automarket_user", name);
    setLoggedIn(true);
    setUserName(name);
    setShowLogin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("automarket_user");
    setLoggedIn(false);
    setUserName("");
  };

  const allCars = [...userCars, ...SAMPLE_CARS];
  const fmt = (n) => parseInt(n).toLocaleString("de-DE");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Inter',sans-serif; background:#F4F7FB; }
        a { text-decoration:none; color:inherit; }
        button { cursor:pointer; font-family:'Inter',sans-serif; }
        select { font-family:'Inter',sans-serif; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-20px);}to{opacity:1;transform:translateY(0);} }
        @keyframes fadeIn { from{opacity:0;}to{opacity:1;} }
        @keyframes pulseBlue { 0%,100%{box-shadow:0 2px 12px rgba(0,82,204,0.1);}50%{box-shadow:0 0 0 4px rgba(0,82,204,0.2);} }
        .car-card { animation:fadeUp 0.4s ease both; transition:transform 0.2s ease,box-shadow 0.2s ease; }
        .car-card:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,82,204,0.12) !important; }
        .new-card { animation:pulseBlue 1s ease 4 !important; border:2px solid #0052CC !important; }
        .brand-chip:hover { background:#0052CC !important; color:#fff !important; }
        .brand-chip { transition:all 0.18s ease; }
        .toast { animation:slideDown 0.3s ease; }
        .modal-bg { animation:fadeIn 0.2s ease; }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#F4F7FB" }}>

        {/* NAV */}
        <nav style={{ background:"#fff", borderBottom:"1.5px solid #E0E8F4", padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between", height:58, position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 8px rgba(0,82,204,0.07)" }}>
          <a href="/" style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:"#0052CC", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>🚘</div>
            <span style={{ fontSize:16, fontWeight:800, color:"#0052CC", letterSpacing:"-0.02em" }}>
              automarket<span style={{ color:"#003D99" }}>.de</span>
            </span>
          </a>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {loggedIn ? (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:"#0052CC", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:13, fontWeight:700 }}>
                  {userName.charAt(0)}
                </div>
                <button onClick={handleLogout} style={{ fontSize:12, color:"#6B7C93", background:"none", border:"none", fontWeight:600 }}>Abmelden</button>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} style={{ fontSize:13, fontWeight:600, color:"#0052CC", background:"#EBF2FF", border:"none", padding:"8px 14px", borderRadius:8 }}>
                Anmelden
              </button>
            )}
            <a href="/inserate/neu" style={{ background:"#0052CC", color:"#fff", fontSize:13, fontWeight:700, padding:"8px 14px", borderRadius:8 }}>+ Inserieren</a>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background:"transparent", border:"none", color:"#6B7C93", fontSize:20, padding:"4px" }}>☰</button>
          </div>
        </nav>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div style={{ position:"fixed", top:58, left:0, right:0, bottom:0, background:"#fff", zIndex:99, padding:24, display:"flex", flexDirection:"column", gap:4, borderTop:"1.5px solid #E0E8F4" }}>
            {["🏠 Startseite","🔍 Alle Fahrzeuge","📝 Inserat aufgeben","🏢 Händlerbereich"].map(item => (
              <a key={item} href={item.includes("Inserat")?"/inserate/neu":"#"} onClick={()=>setMenuOpen(false)}
                style={{ color:"#1A2B4B", fontSize:16, fontWeight:600, padding:"14px 0", borderBottom:"1px solid #F0F4FA" }}>{item}</a>
            ))}
            {!loggedIn && (
              <button onClick={()=>{setMenuOpen(false);setShowLogin(true);}} style={{ marginTop:16, padding:"13px", borderRadius:10, border:"none", background:"#0052CC", color:"#fff", fontSize:15, fontWeight:700 }}>
                🔐 Mit Google anmelden
              </button>
            )}
          </div>
        )}

        {/* GOOGLE LOGIN MODAL */}
        {showLogin && (
          <div className="modal-bg" onClick={()=>setShowLogin(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:20, padding:28, width:"100%", maxWidth:360, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
              <div style={{ textAlign:"center", marginBottom:20 }}>
                <div style={{ fontSize:36, marginBottom:8 }}>🚘</div>
                <h2 style={{ fontSize:20, fontWeight:800, color:"#1A2B4B", margin:"0 0 4px" }}>Willkommen zurück</h2>
                <p style={{ fontSize:13, color:"#6B7C93" }}>Melde dich an um Fahrzeuge zu inserieren</p>
              </div>
              <button onClick={handleGoogleLogin} style={{ width:"100%", padding:"13px", borderRadius:12, border:"1.5px solid #E0E8F4", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontSize:14, fontWeight:700, color:"#1A2B4B", marginBottom:12, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                <span style={{ fontSize:18 }}>G</span> Mit Google anmelden
              </button>
              <div style={{ textAlign:"center", color:"#6B7C93", fontSize:12, marginBottom:12 }}>oder</div>
              <button style={{ width:"100%", padding:"13px", borderRadius:12, border:"none", background:"#0052CC", color:"#fff", fontSize:14, fontWeight:700 }}>
                Mit E-Mail anmelden
              </button>
              <p style={{ fontSize:11, color:"#6B7C93", textAlign:"center", marginTop:14 }}>
                Noch kein Konto? <a href="#" style={{ color:"#0052CC", fontWeight:600 }}>Registrieren</a>
              </p>
            </div>
          </div>
        )}

        {/* TOAST */}
        {showToast && (
          <div className="toast" style={{ position:"fixed", top:68, left:16, right:16, zIndex:199, background:"#0052CC", borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, boxShadow:"0 8px 30px rgba(0,82,204,0.3)" }}>
            <span style={{ fontSize:22 }}>✅</span>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:"#fff", margin:0 }}>Inserat veröffentlicht!</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.7)", margin:0 }}>Ihr Fahrzeug ist jetzt sichtbar — siehe unten</p>
            </div>
          </div>
        )}

        {/* HERO */}
        <div style={{ background:"linear-gradient(135deg,#0052CC 0%,#003D99 100%)", padding:"32px 20px 44px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-80, right:-80, width:260, height:260, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
          <div style={{ position:"absolute", bottom:-40, left:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
          <div style={{ maxWidth:480, margin:"0 auto", position:"relative" }}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:"rgba(255,255,255,0.7)", textTransform:"uppercase", marginBottom:8 }}>🇩🇪 Deutschlands neue Autoplatform</p>
            <h1 style={{ fontSize:26, fontWeight:800, color:"#fff", lineHeight:1.25, marginBottom:6, letterSpacing:"-0.02em" }}>
              Finde dein<br /><span style={{ color:"#7EB8FF" }}>Traumauto.</span>
            </h1>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.65)", marginBottom:22, lineHeight:1.5 }}>
              {allCars.length} Fahrzeuge von Privat und Händlern
            </p>

            {/* Search box */}
            <div style={{ background:"#fff", borderRadius:16, padding:16, boxShadow:"0 12px 40px rgba(0,0,0,0.2)" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                {[["Marke", BRANDS, brand, setBrand],["Modell", MODELS, model, setModel]].map(([label,opts,val,set]) => (
                  <div key={label}>
                    <label style={{ fontSize:10, fontWeight:700, color:"#6B7C93", letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:4 }}>{label}</label>
                    <select value={val} onChange={e=>set(e.target.value)} style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:"1.5px solid #E0E8F4", fontSize:13, color:"#1A2B4B", fontWeight:600, background:"#F8FAFD", appearance:"none" }}>
                      {opts.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:10, fontWeight:700, color:"#6B7C93", letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:4 }}>Max. Preis</label>
                <select value={price} onChange={e=>setPrice(e.target.value)} style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:"1.5px solid #E0E8F4", fontSize:13, color:"#1A2B4B", fontWeight:600, background:"#F8FAFD", appearance:"none" }}>
                  {PRICES.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <button style={{ width:"100%", padding:"13px", borderRadius:10, border:"none", background:"#0052CC", color:"#fff", fontSize:15, fontWeight:700 }}>
                🔍 Fahrzeuge suchen
              </button>
            </div>
          </div>
        </div>

        {/* BRANDS */}
        <div style={{ padding:"20px 20px 0", maxWidth:480, margin:"0 auto" }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#6B7C93", marginBottom:10 }}>Beliebte Marken</p>
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none" }}>
            {BRAND_LOGOS.map(b => (
              <button key={b.name} className="brand-chip" style={{ flexShrink:0, padding:"7px 14px", borderRadius:20, border:"1.5px solid #E0E8F4", background:"#fff", fontSize:12, fontWeight:700, color:"#1A2B4B", display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:b.bg }} />
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* LISTINGS */}
        <div style={{ padding:"20px 20px 24px", maxWidth:480, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#6B7C93" }}>
              Aktuelle Inserate ({allCars.length})
            </p>
            <a href="#" style={{ fontSize:12, fontWeight:700, color:"#0052CC" }}>Alle ansehen →</a>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {allCars.map((car, i) => (
              <div key={car.id} className={`car-card${car.id===newCarId?" new-card":""}`}
                style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,82,204,0.07)", display:"flex", height:120, animationDelay:`${i*0.05}s`, border:"1.5px solid #E8F0FB" }}>

                {/* Image — fixed crop */}
                <div style={{ width:140, flexShrink:0, position:"relative", overflow:"hidden", background:"#F0F4FA" }}>
                  <img src={car.image} alt={`${car.brand} ${car.model}`}
                    style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center" }} />
                  {car.id===newCarId && (
                    <div style={{ position:"absolute", top:8, left:8, background:"#0052CC", color:"#fff", fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:20 }}>NEU ✨</div>
                  )}
                  {car.badge&&car.id!==newCarId && (
                    <div style={{ position:"absolute", top:8, left:8, background:"#0052CC", color:"#fff", fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:20 }}>{car.badge}</div>
                  )}
                  {!car.isDemo && (
                    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:24, background:"rgba(0,30,80,0.75)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontSize:8, color:"rgba(255,255,255,0.9)", fontWeight:700, letterSpacing:"0.04em" }}>🛡️ KENNZEICHEN GESCHWÄRZT</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding:"12px 14px", flex:1, display:"flex", flexDirection:"column", justifyContent:"space-between", minWidth:0 }}>
                  <div>
                    <p style={{ fontSize:14, fontWeight:800, color:"#1A2B4B", marginBottom:3, lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {car.brand} {car.model}
                    </p>
                    <p style={{ fontSize:11, color:"#6B7C93", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {car.year} · {fmt(car.mileage)} km · {car.fuel}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize:19, fontWeight:800, color:"#0052CC", marginBottom:4 }}>
                      {fmt(car.price)} €
                    </p>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:20, background:car.seller==="Händler"?"#EBF2FF":"#F0F7FF", color:"#0052CC" }}>
                        {car.seller||"Privat"}
                      </span>
                      <span style={{ fontSize:11, color:"#6B7C93" }}>📍 {car.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <a href="#" style={{ display:"block", textAlign:"center", padding:"13px", border:"1.5px solid #E0E8F4", borderRadius:12, marginTop:12, fontSize:14, fontWeight:700, color:"#0052CC", background:"#fff" }}>
            Alle Fahrzeuge anzeigen →
          </a>
        </div>

        {/* CTA */}
        <div style={{ padding:"0 20px 32px", maxWidth:480, margin:"0 auto" }}>
          <div style={{ background:"linear-gradient(135deg,#0052CC,#003D99)", borderRadius:16, padding:"24px 20px", textAlign:"center", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
            <p style={{ fontSize:22, marginBottom:6 }}>🚗</p>
            <h3 style={{ fontSize:18, fontWeight:800, color:"#fff", marginBottom:6 }}>Fahrzeug verkaufen?</h3>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginBottom:18, lineHeight:1.5 }}>
              Inserat in 3 Minuten aufgeben — kostenlos für Privatanbieter.
            </p>
            <a href="/inserate/neu" style={{ display:"inline-block", padding:"12px 28px", background:"#fff", color:"#0052CC", fontSize:14, fontWeight:800, borderRadius:10 }}>
              + Jetzt inserieren
            </a>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ background:"#1A2B4B", padding:"24px 20px", textAlign:"center" }}>
          <div style={{ fontSize:16, fontWeight:800, color:"#fff", marginBottom:4 }}>
            automarket<span style={{ color:"#7EB8FF" }}>.de</span>
          </div>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:16 }}>Die moderne Fahrzeugplattform für Deutschland</p>
          <div style={{ display:"flex", justifyContent:"center", gap:16, flexWrap:"wrap" }}>
            {["Impressum","Datenschutz","AGB","Kontakt"].map(item=>(
              <a key={item} href="#" style={{ fontSize:11, color:"rgba(255,255,255,0.45)", fontWeight:600 }}>{item}</a>
            ))}
          </div>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:16 }}>© 2025 AutoMarket.de</p>
        </div>
      </div>
    </>
  );
}
