"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

const BRANDS = ["Alle Marken","Audi","BMW","Mercedes-Benz","Volkswagen","Ford","Opel","Toyota","Renault"];
const MODELS = ["Alle Modelle","Golf","3er","A4","C-Klasse","Polo","Corsa","Yaris","Clio"];
const PRICES = ["Beliebig","bis 5.000 €","bis 10.000 €","bis 20.000 €","bis 35.000 €","bis 50.000 €"];

const BRAND_LOGOS = [
  { name:"VW", bg:"#001E50", match:"Volkswagen" },
  { name:"BMW", bg:"#0066CC", match:"BMW" },
  { name:"Audi", bg:"#BB0A21", match:"Audi" },
  { name:"Mercedes", bg:"#222", match:"Mercedes-Benz" },
  { name:"Ford", bg:"#003476", match:"Ford" },
  { name:"Opel", bg:"#FFCB00", match:"Opel" },
];

// Skeleton card component
const SkeletonCard = () => (
  <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", display:"flex", height:120, border:"1.5px solid #E8F0FB" }}>
    <div style={{ width:140, background:"#E8F0FB", flexShrink:0, animation:"shimmer 1.5s ease-in-out infinite" }} />
    <div style={{ padding:"14px 16px", flex:1, display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
      <div>
        <div style={{ height:14, background:"#E8F0FB", borderRadius:6, marginBottom:8, width:"70%", animation:"shimmer 1.5s ease-in-out infinite" }} />
        <div style={{ height:11, background:"#E8F0FB", borderRadius:6, width:"50%", animation:"shimmer 1.5s ease-in-out infinite" }} />
      </div>
      <div>
        <div style={{ height:18, background:"#E8F0FB", borderRadius:6, width:"40%", marginBottom:6, animation:"shimmer 1.5s ease-in-out infinite" }} />
        <div style={{ height:10, background:"#E8F0FB", borderRadius:6, width:"60%", animation:"shimmer 1.5s ease-in-out infinite" }} />
      </div>
    </div>
  </div>
);

export default function HomePage() {
  const [brand, setBrand] = useState("Alle Marken");
  const [model, setModel] = useState("Alle Modelle");
  const [price, setPrice] = useState("Beliebig");
  const [menuOpen, setMenuOpen] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newId, setNewId] = useState(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchListings();
    // Check if redirected from posting form
    const n = localStorage.getItem("automarket_new_listing");
    if (n) {
      setNewId(n);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      setTimeout(() => { setNewId(null); localStorage.removeItem("automarket_new_listing"); }, 6000);
    }
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Supabase error:", error.message);
        setListings([]);
      } else {
        setListings(data || []);
      }
    } catch (err) {
      console.error("Network error:", err);
      setListings([]);
    }
    setLoading(false);
  };

  const fmt = (n) => parseInt(n || 0).toLocaleString("de-DE");

  const filteredListings = listings.filter(car => {
    let matchBrand = brand === "Alle Marken" || (car.brand === brand) || (car.title && car.title.toLowerCase().includes(brand.toLowerCase())) || (car.brand && car.brand.toLowerCase() === brand.toLowerCase());
    let matchPrice = true;
    if (price !== "Beliebig") {
      const maxPriceText = price.replace(/\D/g, "");
      if (maxPriceText) {
         const maxPrice = parseInt(maxPriceText, 10);
         if (car.price > maxPrice) matchPrice = false;
      }
    }
    return matchBrand && matchPrice;
  });

  const resetFilters = () => {
    setBrand("Alle Marken");
    setModel("Alle Modelle");
    setPrice("Beliebig");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Outfit',sans-serif; background:#F4F7FB; }
        a { text-decoration:none; color:inherit; }
        button { cursor:pointer; font-family:'Outfit',sans-serif; }
        select { font-family:'Outfit',sans-serif; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-20px);}to{opacity:1;transform:translateY(0);} }
        @keyframes shimmer { 0%{opacity:1;}50%{opacity:0.4;}100%{opacity:1;} }
        @keyframes pulseBlue { 0%,100%{box-shadow:0 2px 12px rgba(0,82,204,0.1);}50%{box-shadow:0 0 0 4px rgba(0,82,204,0.25);} }
        .card { animation:fadeUp 0.4s ease both; transition:transform 0.2s,box-shadow 0.2s; }
        .card:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,82,204,0.13) !important; }
        .new-card { border:2px solid #0052CC !important; animation:pulseBlue 1s ease 4 !important; }
        .chip.active { background:#0052CC !important; color:#fff !important; border-color:#0052CC !important; }
        .chip:hover { background:#EBF2FF; color:#0052CC; }
        .chip { transition:all 0.18s; }
        .toast { animation:slideDown 0.3s ease; }
        .tag { padding: 3px 6px; background: #F0F4FA; color: #6B7C93; border-radius: 4px; font-size: 10px; font-weight: 600; display: inline-block; margin-right: 4px; margin-bottom: 4px; }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#F4F7FB" }}>

        {/* NAV */}
        <nav style={{ background:"#fff", borderBottom:"1.5px solid #E0E8F4", padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between", height:58, position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 8px rgba(0,82,204,0.06)" }}>
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:"#0052CC", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🚘</div>
            <span style={{ fontSize:16, fontWeight:800, color:"#0052CC", letterSpacing:"-0.02em" }}>
              automarket<span style={{ color:"#003D99" }}>.de</span>
            </span>
          </Link>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Link href="/inserate/neu" style={{ background:"#0052CC", color:"#fff", fontSize:13, fontWeight:700, padding:"8px 14px", borderRadius:8 }}>+ Inserieren</Link>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background:"transparent", border:"none", color:"#6B7C93", fontSize:20, padding:"4px" }}>☰</button>
          </div>
        </nav>

        {menuOpen && (
          <div style={{ position:"fixed", top:58, left:0, right:0, bottom:0, background:"#fff", zIndex:99, padding:24, display:"flex", flexDirection:"column", gap:4 }}>
            {["🏠 Startseite","🔍 Alle Fahrzeuge","📝 Inserat aufgeben"].map(item => (
              <Link key={item} href={item.includes("Inserat")?"/inserate/neu":"/"} onClick={()=>setMenuOpen(false)}
                style={{ color:"#1A2B4B", fontSize:16, fontWeight:600, padding:"14px 0", borderBottom:"1px solid #F0F4FA" }}>{item}</Link>
            ))}
          </div>
        )}

        {/* TOAST */}
        {showToast && (
          <div className="toast" style={{ position:"fixed", top:68, left:16, right:16, zIndex:200, background:"#0052CC", borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, boxShadow:"0 8px 30px rgba(0,82,204,0.3)" }}>
            <span style={{ fontSize:22 }}>✅</span>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:"#fff", margin:0 }}>Inserat veröffentlicht!</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.75)", margin:0 }}>Ihr Fahrzeug ist jetzt für alle sichtbar</p>
            </div>
          </div>
        )}

        {/* HERO */}
        <div style={{ background:"linear-gradient(135deg,#0052CC 0%,#003D99 100%)", padding:"32px 20px 44px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-60, right:-60, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
          <div style={{ position:"absolute", bottom:-40, left:-40, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
          <div style={{ maxWidth:480, margin:"0 auto", position:"relative" }}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:"rgba(255,255,255,0.65)", textTransform:"uppercase", marginBottom:8 }}>🇩🇪 Deutschlands neue Autoplatform</p>
            <h1 style={{ fontSize:26, fontWeight:800, color:"#fff", lineHeight:1.25, marginBottom:6, letterSpacing:"-0.02em" }}>
              Finde dein<br /><span style={{ color:"#7EB8FF" }}>Traumauto.</span>
            </h1>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.65)", marginBottom:22 }}>
              {loading ? "Wird geladen…" : `${listings.length} Fahrzeuge von Privat und Händlern`}
            </p>
            <div style={{ background:"#fff", borderRadius:16, padding:16, boxShadow:"0 12px 40px rgba(0,0,0,0.2)" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                {[["Marke",BRANDS,brand,setBrand],["Modell",MODELS,model,setModel]].map(([label,opts,val,set]) => (
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
            </div>
          </div>
        </div>

        {/* BRANDS */}
        <div style={{ padding:"20px 20px 0", maxWidth:480, margin:"0 auto" }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#6B7C93", marginBottom:10 }}>Beliebte Marken</p>
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none" }}>
            <button className={`chip ${brand === "Alle Marken" ? "active" : ""}`} onClick={() => setBrand("Alle Marken")} style={{ flexShrink:0, padding:"7px 14px", borderRadius:20, border:"1.5px solid #E0E8F4", background:"#fff", fontSize:12, fontWeight:700, color:"#1A2B4B" }}>
              Alle
            </button>
            {BRAND_LOGOS.map(b => (
              <button key={b.name} onClick={() => setBrand(b.match)} className={`chip ${brand === b.match ? "active" : ""}`} style={{ flexShrink:0, padding:"7px 14px", borderRadius:20, border:"1.5px solid #E0E8F4", background:"#fff", fontSize:12, fontWeight:700, color:"#1A2B4B", display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:b.bg, flexShrink:0 }} />
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* LISTINGS */}
        <div style={{ padding:"20px 20px 24px", maxWidth:480, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#6B7C93" }}>
              {loading ? "Wird geladen…" : `Aktuelle Inserate (${filteredListings.length})`}
            </p>
            {(!loading && (brand !== "Alle Marken" || price !== "Beliebig")) && (
              <button onClick={resetFilters} style={{ fontSize:10, fontWeight:700, color:"#0052CC", background:"#EBF2FF", border:"none", padding:"4px 8px", borderRadius:12 }}>
                Filter zurücksetzen
              </button>
            )}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {loading ? (
              // Skeleton cards
              [1,2,3].map(i => <SkeletonCard key={i} />)
            ) : filteredListings.length === 0 ? (
              // Empty state
              <div style={{ textAlign:"center", padding:"40px 20px", background:"#fff", borderRadius:14, border:"1.5px solid #E8F0FB" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
                <p style={{ fontSize:16, fontWeight:700, color:"#1A2B4B", marginBottom:6 }}>Keine Treffer gefunden</p>
                <p style={{ fontSize:13, color:"#6B7C93", marginBottom:16 }}>Es gibt kein Fahrzeug, das deinen aktuellen Filtern entspricht.</p>
                <button onClick={resetFilters} style={{ display:"inline-block", padding:"11px 24px", background:"#F0F4FA", color:"#0052CC", border:"none", fontSize:14, fontWeight:700, borderRadius:10 }}>Filter zurücksetzen</button>
              </div>
            ) : (
              filteredListings.map((car, i) => (
                <Link href={`/inserate/${car.id}`} key={car.id} className={`card${car.id === newId ? " new-card" : ""}`}
                  style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,82,204,0.07)", display:"flex", height:120, animationDelay:`${i*0.05}s`, border:"1.5px solid #E8F0FB" }}>
                  {/* Image */}
                  <div style={{ width:140, flexShrink:0, position:"relative", overflow:"hidden", background:"#EBF2FF" }}>
                    {car.image_url ? (
                      <img
                        src={car.image_url}
                        alt=""
                        style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center" }}
                        onError={e => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div style={{ position:"absolute", inset:0, display: car.image_url ? "none" : "flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>🚗</div>
                    {car.id === newId && (
                      <div style={{ position:"absolute", top:8, left:8, background:"#0052CC", color:"#fff", fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:20 }}>NEU ✨</div>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ padding:"10px 12px", flex:1, display:"flex", flexDirection:"column", justifyContent:"space-between", minWidth:0 }}>
                    <div>
                      <p style={{ fontSize:14, fontWeight:800, color:"#1A2B4B", marginBottom:4, lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {car.title || "Fahrzeug"}
                      </p>
                      <div style={{ display:"flex", flexWrap:"wrap", marginBottom:6 }}>
                        {car.year && <span className="tag">{car.year}</span>}
                        {car.mileage && <span className="tag">{fmt(car.mileage)} km</span>}
                        {car.fuel_type && <span className="tag">{car.fuel_type}</span>}
                        {car.transmission && <span className="tag">{car.transmission}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <p style={{ fontSize:18, fontWeight:800, color:"#0052CC", margin: 0 }}>
                          {fmt(car.price)} €
                        </p>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const phone = (car.phone || "4917657775736").replace(/\D/g, "");
                            const msg = encodeURIComponent(`Hallo, ich interessiere mich für Ihr Inserat "${car.title}" auf automarket.de`);
                            window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
                          }}
                          style={{ 
                            background: "#25D366", 
                            color: "#fff", 
                            border: "none", 
                            borderRadius: 8, 
                            padding: "6px 10px", 
                            fontSize: 11, 
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 4
                          }}
                        >
                          💬 WhatsApp
                        </button>
                      </div>
                      <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20, background:"#EBF2FF", color:"#0052CC" }}>
                        {car.seller_type || "Privat"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding:"0 20px 32px", maxWidth:480, margin:"0 auto" }}>
          <div style={{ background:"linear-gradient(135deg,#0052CC,#003D99)", borderRadius:16, padding:"24px 20px", textAlign:"center", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
            <p style={{ fontSize:22, marginBottom:6 }}>🚗</p>
            <h3 style={{ fontSize:18, fontWeight:800, color:"#fff", marginBottom:6 }}>Fahrzeug verkaufen?</h3>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginBottom:18, lineHeight:1.5 }}>Kostenlos inserieren — in 3 Minuten online.</p>
            <Link href="/inserate/neu" style={{ display:"inline-block", padding:"12px 28px", background:"#fff", color:"#0052CC", fontSize:14, fontWeight:800, borderRadius:10 }}>+ Jetzt inserieren</Link>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ background:"#1A2B4B", padding:"24px 20px", textAlign:"center" }}>
          <div style={{ fontSize:16, fontWeight:800, color:"#fff", marginBottom:4 }}>automarket<span style={{ color:"#7EB8FF" }}>.de</span></div>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginBottom:14 }}>Die moderne Fahrzeugplattform für Deutschland</p>
          <div style={{ display:"flex", justifyContent:"center", gap:16, flexWrap:"wrap" }}>
            {["Impressum","Datenschutz","AGB"].map(item=>(
              <a key={item} href="#" style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:600 }}>{item}</a>
            ))}
            <a href="https://wa.me/4917657775736" target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:600 }}>Kontakt</a>
          </div>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.2)", marginTop:14 }}>© 2025 AutoMarket.de</p>
        </div>
      </div>
    </>
  );
}
