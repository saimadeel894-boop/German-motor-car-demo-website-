// @ts-nocheck
"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

const BRANDS = ["Alle Marken","Audi","BMW","Mercedes-Benz","Volkswagen","Ford","Opel","Toyota","Porsche","Ferrari"];
const PRICES = ["Beliebig","bis 10.000 €","bis 25.000 €","bis 50.000 €","bis 100.000 €","über 100.000 €"];
const PRICE_MAP = { "Beliebig":9999999,"bis 10.000 €":10000,"bis 25.000 €":25000,"bis 50.000 €":50000,"bis 100.000 €":100000,"über 100.000 €":9999999 };

const STATS = [
  { value:"50K+", label:"Fahrzeuge" },
  { value:"12K+", label:"Käufer" },
  { value:"98%", label:"Zufriedenheit" },
  { value:"4.9★", label:"Bewertung" },
];

const FEATURED_BRANDS = [
  { name:"BMW", letter:"B", color:"#0066CC" },
  { name:"Mercedes", letter:"M", color:"#888" },
  { name:"Audi", letter:"A", color:"#BB0A21" },
  { name:"Porsche", letter:"P", color:"#C0922C" },
  { name:"VW", letter:"V", color:"#001E50" },
  { name:"Ferrari", letter:"F", color:"#DC143C" },
];

export default function PremiumHomePage() {
  const [brand, setBrand] = useState("Alle Marken");
  const [price, setPrice] = useState("Beliebig");
  const [listings, setListings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [newId, setNewId] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    fetchListings();
    const n = localStorage.getItem("automarket_new_listing");
    if (n) { setNewId(n); setShowToast(true); setTimeout(() => setShowToast(false), 5000); setTimeout(() => { setNewId(null); localStorage.removeItem("automarket_new_listing"); }, 6000); }
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let r = [...listings];
    if (brand !== "Alle Marken") r = r.filter(c => c.brand === brand || (c.title||"").includes(brand));
    const max = PRICE_MAP[price];
    if (price !== "Beliebig" && price !== "über 100.000 €") r = r.filter(c => parseInt(c.price||0) <= max);
    setFiltered(r);
  }, [brand, price, listings]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
      if (!error && data) { setListings(data); setFiltered(data); }
    } catch {}
    setLoading(false);
  };

  const fmt = (n) => parseInt(n||0).toLocaleString("de-DE");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        :root {
          --navy: #0A0F1E;
          --navy-2: #111827;
          --navy-3: #1a2235;
          --gold: #C0922C;
          --gold-light: #E8B84B;
          --gold-pale: rgba(192,146,44,0.12);
          --white: #FFFFFF;
          --white-70: rgba(255,255,255,0.7);
          --white-40: rgba(255,255,255,0.4);
          --white-10: rgba(255,255,255,0.08);
          --blue: #1D4ED8;
          --border: rgba(255,255,255,0.08);
        }

        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'DM Sans',sans-serif; background:var(--navy); color:var(--white); }
        a { text-decoration:none; color:inherit; }
        button { cursor:pointer; font-family:'DM Sans',sans-serif; }
        select { font-family:'DM Sans',sans-serif; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);} }
        @keyframes fadeIn { from{opacity:0;}to{opacity:1;} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-20px);}to{opacity:1;transform:translateY(0);} }
        @keyframes shimmer { 0%,100%{opacity:0.3;}50%{opacity:0.6;} }
        @keyframes goldPulse { 0%,100%{box-shadow:0 0 0 0 rgba(192,146,44,0.4);}50%{box-shadow:0 0 0 8px rgba(192,146,44,0);} }
        @keyframes float { 0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);} }
        @keyframes grain { 0%,100%{transform:translate(0,0);}10%{transform:translate(-2%,-3%);}20%{transform:translate(2%,2%);}30%{transform:translate(-1%,3%);}40%{transform:translate(3%,-1%);}50%{transform:translate(-3%,2%);}60%{transform:translate(2%,-3%);}70%{transform:translate(-2%,1%);}80%{transform:translate(1%,3%);}90%{transform:translate(-1%,-2%);} }

        .fade-up { animation:fadeUp 0.6s ease both; }
        .fade-up-1 { animation:fadeUp 0.6s ease 0.1s both; }
        .fade-up-2 { animation:fadeUp 0.6s ease 0.2s both; }
        .fade-up-3 { animation:fadeUp 0.6s ease 0.3s both; }
        .fade-up-4 { animation:fadeUp 0.6s ease 0.4s both; }

        .card-hover { transition:transform 0.3s ease,box-shadow 0.3s ease; }
        .card-hover:hover { transform:translateY(-4px); box-shadow:0 20px 60px rgba(0,0,0,0.4),0 0 0 1px rgba(192,146,44,0.2) !important; }

        .gold-btn { background:linear-gradient(135deg,var(--gold),var(--gold-light)); color:#000; font-weight:700; border:none; transition:all 0.2s ease; }
        .gold-btn:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(192,146,44,0.4); }

        .ghost-btn { background:transparent; color:var(--white); border:1px solid var(--border); transition:all 0.2s ease; }
        .ghost-btn:hover { border-color:var(--gold); color:var(--gold); }

        .brand-chip { transition:all 0.2s ease; border:1px solid var(--border); background:var(--white-10); }
        .brand-chip:hover { border-color:var(--gold); background:var(--gold-pale); color:var(--gold-light); }

        .select-dark { background:var(--navy-3); color:var(--white); border:1px solid var(--border); appearance:none; }
        .select-dark:focus { outline:none; border-color:var(--gold); box-shadow:0 0 0 3px rgba(192,146,44,0.15); }

        .toast { animation:slideDown 0.3s ease; }

        .grain-overlay::after {
          content:'';
          position:absolute; inset:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events:none; z-index:1;
          animation:grain 8s steps(10) infinite;
        }

        .listing-img { transition:transform 0.4s ease; }
        .card-hover:hover .listing-img { transform:scale(1.05); }

        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:var(--navy); }
        ::-webkit-scrollbar-thumb { background:var(--gold); border-radius:3px; }
      `}</style>

      <div style={{ minHeight:"100vh", background:"var(--navy)" }}>

        {/* ── NAV ── */}
        <nav style={{
          position:"fixed", top:0, left:0, right:0, zIndex:200,
          padding:"0 24px",
          background: scrolled ? "rgba(10,15,30,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border)" : "none",
          transition:"all 0.3s ease",
          display:"flex", alignItems:"center", justifyContent:"space-between", height:64,
        }}>
          <a href="/" style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:"linear-gradient(135deg,var(--gold),var(--gold-light))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🚘</div>
            <div>
              <span style={{ fontSize:17, fontWeight:800, color:"var(--white)", fontFamily:"'Playfair Display',serif", letterSpacing:"-0.02em" }}>
                Auto<span style={{ color:"var(--gold)" }}>Market</span>
              </span>
              <span style={{ fontSize:11, color:"var(--gold)", fontWeight:700, display:"block", letterSpacing:"0.15em", lineHeight:1, textTransform:"uppercase" }}>.de</span>
            </div>
          </a>

          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <a href="/inserate/neu" className="gold-btn" style={{ fontSize:13, fontWeight:700, padding:"9px 18px", borderRadius:8, display:"none" }}>
              + Inserieren
            </a>
            <a href="/inserate/neu" className="gold-btn" style={{ fontSize:13, fontWeight:700, padding:"9px 18px", borderRadius:8 }}>
              + Inserieren
            </a>
            <button onClick={() => setMenuOpen(!menuOpen)} className="ghost-btn" style={{ width:40, height:40, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div style={{ position:"fixed", inset:0, background:"rgba(10,15,30,0.98)", zIndex:190, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
            {["🏠 Startseite","🔍 Alle Fahrzeuge","📝 Inserat aufgeben","🏢 Händlerbereich","ℹ️ Über uns"].map(item => (
              <a key={item} href={item.includes("Inserat")?"/inserate/neu":"#"} onClick={()=>setMenuOpen(false)}
                style={{ color:"var(--white)", fontSize:22, fontWeight:600, padding:"14px 40px", fontFamily:"'Playfair Display',serif", letterSpacing:"-0.01em", transition:"color 0.2s" }}
                onMouseEnter={e => e.target.style.color="var(--gold-light)"}
                onMouseLeave={e => e.target.style.color="var(--white)"}
              >{item}</a>
            ))}
          </div>
        )}

        {/* TOAST */}
        {showToast && (
          <div className="toast" style={{ position:"fixed", top:76, left:16, right:16, zIndex:300, background:"linear-gradient(135deg,var(--gold),var(--gold-light))", borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, boxShadow:"0 8px 30px rgba(192,146,44,0.4)", maxWidth:480, margin:"0 auto" }}>
            <span style={{ fontSize:22 }}>✅</span>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:"#000", margin:0 }}>Inserat veröffentlicht!</p>
              <p style={{ fontSize:11, color:"rgba(0,0,0,0.65)", margin:0 }}>Ihr Fahrzeug ist jetzt sichtbar</p>
            </div>
          </div>
        )}

        {/* ── HERO ── */}
        <div ref={heroRef} className="grain-overlay" style={{ position:"relative", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", overflow:"hidden", padding:"80px 24px 60px" }}>

          {/* Background layers */}
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 60% at 50% 0%, rgba(192,146,44,0.15) 0%, transparent 60%)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 80% at 80% 100%, rgba(29,78,216,0.12) 0%, transparent 50%)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", top:"20%", left:"-10%", width:"40%", height:"40%", borderRadius:"50%", background:"radial-gradient(circle, rgba(192,146,44,0.06) 0%, transparent 70%)", pointerEvents:"none" }} />

          {/* Decorative lines */}
          <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:1, height:"30%", background:"linear-gradient(to bottom, transparent, rgba(192,146,44,0.4), transparent)", pointerEvents:"none" }} />

          <div style={{ position:"relative", zIndex:2, maxWidth:600, width:"100%", textAlign:"center" }}>

            {/* Badge */}
            <div className="fade-up" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"var(--gold-pale)", border:"1px solid rgba(192,146,44,0.3)", borderRadius:40, padding:"6px 16px", marginBottom:28 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--gold)", display:"inline-block", animation:"goldPulse 2s ease infinite" }} />
              <span style={{ fontSize:11, fontWeight:700, color:"var(--gold-light)", letterSpacing:"0.12em", textTransform:"uppercase" }}>Deutschlands Premium Autoplatform</span>
            </div>

            {/* Headline */}
            <h1 className="fade-up-1" style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(36px,8vw,64px)", fontWeight:900, lineHeight:1.1, marginBottom:20, letterSpacing:"-0.02em" }}>
              Finde dein<br />
              <span style={{ background:"linear-gradient(135deg,var(--gold),var(--gold-light))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", display:"block" }}>
                Traumfahrzeug.
              </span>
            </h1>

            <p className="fade-up-2" style={{ fontSize:16, color:"var(--white-70)", marginBottom:40, lineHeight:1.7, maxWidth:420, margin:"0 auto 40px" }}>
              {loading ? "Wird geladen…" : `${listings.length.toLocaleString("de-DE")} Fahrzeuge von Privat und Händlern — kuratiert, geprüft, sicher.`}
            </p>

            {/* Search card */}
            <div className="fade-up-3" style={{ background:"rgba(255,255,255,0.04)", backdropFilter:"blur(20px)", border:"1px solid var(--border)", borderRadius:20, padding:20, boxShadow:"0 32px 80px rgba(0,0,0,0.4)", marginBottom:32 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, color:"var(--gold)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Marke</label>
                  <select value={brand} onChange={e=>setBrand(e.target.value)} className="select-dark" style={{ width:"100%", padding:"11px 14px", borderRadius:10, fontSize:14, fontWeight:500, transition:"all 0.2s" }}>
                    {BRANDS.map(b=><option key={b} style={{ background:"#111827" }}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, color:"var(--gold)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Max. Preis</label>
                  <select value={price} onChange={e=>setPrice(e.target.value)} className="select-dark" style={{ width:"100%", padding:"11px 14px", borderRadius:10, fontSize:14, fontWeight:500, transition:"all 0.2s" }}>
                    {PRICES.map(p=><option key={p} style={{ background:"#111827" }}>{p}</option>)}
                  </select>
                </div>
              </div>
              <button className="gold-btn" style={{ width:"100%", padding:"14px", borderRadius:12, fontSize:15, letterSpacing:"0.02em" }}>
                🔍 {filtered.length} Fahrzeuge suchen
              </button>
            </div>

            {/* Stats */}
            <div className="fade-up-4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:0 }}>
              {STATS.map((s, i) => (
                <div key={i} style={{ padding:"12px 8px", borderLeft: i>0 ? "1px solid var(--border)" : "none", textAlign:"center" }}>
                  <p style={{ fontSize:20, fontWeight:800, color:"var(--gold-light)", margin:"0 0 2px", fontFamily:"'Playfair Display',serif" }}>{s.value}</p>
                  <p style={{ fontSize:10, color:"var(--white-40)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", margin:0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div style={{ position:"absolute", bottom:32, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:6, animation:"float 2s ease-in-out infinite" }}>
            <span style={{ fontSize:10, color:"var(--white-40)", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase" }}>Scrollen</span>
            <div style={{ width:1, height:40, background:"linear-gradient(to bottom, var(--gold), transparent)" }} />
          </div>
        </div>

        {/* ── BRANDS ── */}
        <div style={{ padding:"60px 24px", background:"var(--navy-2)", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)" }}>
          <div style={{ maxWidth:600, margin:"0 auto" }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--gold)", textAlign:"center", marginBottom:24 }}>Premium Marken</p>
            <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none", justifyContent:"center", flexWrap:"wrap" }}>
              {FEATURED_BRANDS.map(b => (
                <button key={b.name} className="brand-chip" onClick={()=>setBrand(b.name==="Mercedes"?"Mercedes-Benz":b.name==="VW"?"Volkswagen":b.name)}
                  style={{ flexShrink:0, padding:"10px 18px", borderRadius:40, fontSize:13, fontWeight:700, color:"var(--white-70)", display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap" }}>
                  <div style={{ width:22, height:22, borderRadius:"50%", background:b.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:"#fff" }}>{b.letter}</div>
                  {b.name}
                </button>
              ))}
              {brand !== "Alle Marken" && (
                <button onClick={()=>setBrand("Alle Marken")} style={{ flexShrink:0, padding:"10px 18px", borderRadius:40, fontSize:13, fontWeight:700, color:"var(--gold)", background:"var(--gold-pale)", border:"1px solid rgba(192,146,44,0.3)", cursor:"pointer" }}>
                  ✕ Filter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── LISTINGS ── */}
        <div style={{ padding:"60px 24px", maxWidth:600, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:32 }}>
            <div>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--gold)", marginBottom:8 }}>Aktuelle Inserate</p>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:800, color:"var(--white)", letterSpacing:"-0.02em" }}>
                {loading ? "Wird geladen…" : `${filtered.length} Fahrzeuge`}
              </h2>
            </div>
            <button onClick={()=>{setBrand("Alle Marken");setPrice("Beliebig");}} style={{ fontSize:13, fontWeight:600, color:"var(--gold)", background:"none", border:"none", cursor:"pointer", letterSpacing:"0.02em" }}>
              Alle ansehen →
            </button>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {loading ? (
              [1,2,3].map(i => (
                <div key={i} style={{ background:"var(--navy-2)", borderRadius:16, height:140, border:"1px solid var(--border)", animation:"shimmer 1.5s ease-in-out infinite" }} />
              ))
            ) : filtered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px", background:"var(--navy-2)", borderRadius:20, border:"1px solid var(--border)" }}>
                <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:"var(--white)", marginBottom:8 }}>Keine Fahrzeuge gefunden</p>
                <p style={{ fontSize:14, color:"var(--white-40)", marginBottom:24 }}>Versuche andere Filter</p>
                <button onClick={()=>{setBrand("Alle Marken");setPrice("Beliebig");}} className="gold-btn" style={{ padding:"12px 28px", borderRadius:10, fontSize:14 }}>
                  Filter zurücksetzen
                </button>
              </div>
            ) : (
              filtered.map((car, i) => (
                <a key={car.id} href={`/inserate/${car.id}`} className="card-hover"
                  style={{ background:"var(--navy-2)", borderRadius:16, overflow:"hidden", border:"1px solid var(--border)", display:"flex", minHeight:140, animationDelay:`${i*0.06}s`, textDecoration:"none", position:"relative" }}>

                  {/* Image */}
                  <div style={{ width:150, flexShrink:0, position:"relative", overflow:"hidden", background:"var(--navy-3)" }}>
                    {car.image_url ? (
                      <img src={car.image_url} alt={car.title} className="listing-img"
                        style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center" }} />
                    ) : (
                      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>🚗</div>
                    )}
                    {/* Gold overlay on hover handled by parent */}
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, transparent 60%, var(--navy-2))", pointerEvents:"none" }} />
                    {car.id?.toString() === newId && (
                      <div style={{ position:"absolute", top:10, left:10, background:"linear-gradient(135deg,var(--gold),var(--gold-light))", color:"#000", fontSize:9, fontWeight:800, padding:"3px 9px", borderRadius:20, letterSpacing:"0.06em" }}>NEU ✨</div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding:"16px 18px", flex:1, display:"flex", flexDirection:"column", justifyContent:"space-between", minWidth:0 }}>
                    <div>
                      <p style={{ fontSize:15, fontWeight:800, color:"var(--white)", marginBottom:6, lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontFamily:"'DM Sans',sans-serif" }}>
                        {car.title || `${car.brand||""} ${car.model||""}`.trim() || "Fahrzeug"}
                      </p>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {car.year && <span style={{ fontSize:11, color:"var(--white-70)", background:"var(--white-10)", padding:"3px 8px", borderRadius:6 }}>{car.year}</span>}
                        {car.mileage && <span style={{ fontSize:11, color:"var(--white-70)", background:"var(--white-10)", padding:"3px 8px", borderRadius:6 }}>{parseInt(car.mileage).toLocaleString("de-DE")} km</span>}
                        {car.fuel && <span style={{ fontSize:11, color:"var(--white-70)", background:"var(--white-10)", padding:"3px 8px", borderRadius:6 }}>{car.fuel}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <p style={{ fontSize:20, fontWeight:800, background:"linear-gradient(135deg,var(--gold),var(--gold-light))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontFamily:"'Playfair Display',serif" }}>
                        {fmt(car.price)} €
                      </p>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        {car.location && <span style={{ fontSize:11, color:"var(--white-40)" }}>📍 {car.location}</span>}
                        <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, background:"var(--gold-pale)", color:"var(--gold-light)", border:"1px solid rgba(192,146,44,0.2)" }}>Privat</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>

        {/* ── CTA ── */}
        <div style={{ padding:"0 24px 60px", maxWidth:600, margin:"0 auto" }}>
          <div style={{ position:"relative", background:"linear-gradient(135deg,var(--navy-3),var(--navy-2))", border:"1px solid var(--border)", borderRadius:24, padding:"40px 28px", textAlign:"center", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-60, right:-60, width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle, rgba(192,146,44,0.12) 0%, transparent 70%)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", bottom:-40, left:-40, width:150, height:150, borderRadius:"50%", background:"radial-gradient(circle, rgba(29,78,216,0.1) 0%, transparent 70%)", pointerEvents:"none" }} />
            <p style={{ fontSize:36, marginBottom:12 }}>🚗</p>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:800, color:"var(--white)", marginBottom:10, letterSpacing:"-0.02em" }}>Fahrzeug verkaufen?</h3>
            <p style={{ fontSize:14, color:"var(--white-40)", marginBottom:28, lineHeight:1.6 }}>
              Kostenlos inserieren — Ihre Anzeige in 3 Minuten live.
            </p>
            <a href="/inserate/neu" className="gold-btn" style={{ display:"inline-block", padding:"14px 36px", borderRadius:12, fontSize:15, letterSpacing:"0.02em" }}>
              + Jetzt inserieren
            </a>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ background:"var(--navy-2)", borderTop:"1px solid var(--border)", padding:"32px 24px", textAlign:"center" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:800, color:"var(--white)", marginBottom:4 }}>
            Auto<span style={{ color:"var(--gold)" }}>Market</span><span style={{ color:"var(--gold-light)", fontSize:14 }}>.de</span>
          </div>
          <p style={{ fontSize:12, color:"var(--white-40)", marginBottom:18 }}>Die moderne Fahrzeugplattform für Deutschland</p>
          <div style={{ display:"flex", justifyContent:"center", gap:20, flexWrap:"wrap", marginBottom:16 }}>
            {["Impressum","Datenschutz","AGB","Kontakt"].map(item=>(
              <a key={item} href="#" style={{ fontSize:11, color:"var(--white-40)", fontWeight:600, transition:"color 0.2s" }}
                onMouseEnter={e=>e.target.style.color="var(--gold)"}
                onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.4)"}
              >{item}</a>
            ))}
          </div>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.15)" }}>© 2025 AutoMarket.de — Alle Rechte vorbehalten</p>
        </div>
      </div>
    </>
  );
}
