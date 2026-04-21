"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function CarDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchCar();
  }, [id]);

  const fetchCar = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
    } else {
      setCar(data);
    }
    setLoading(false);
  };

  const fmt = (n) => parseInt(n || 0).toLocaleString("de-DE");

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:"#F4F7FB", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ animation:"shimmer 1.5s infinite", fontSize:32 }}>⏳</div>
      </div>
    );
  }

  if (!car) {
    return (
      <div style={{ minHeight:"100vh", background:"#F4F7FB", padding:20, textAlign:"center" }}>
        <h2>Inserat nicht gefunden</h2>
        <Link href="/" style={{ color:"#0052CC", fontWeight:600 }}>Zurück zur Übersicht</Link>
      </div>
    );
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: car.title,
          text: `Schau dir dieses Auto an: ${car.title} für ${fmt(car.price)} €`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link in die Zwischenablage kopiert!");
      }
    } catch (err) {
      console.error("Share failed", err);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Outfit',sans-serif; background:#F4F7FB; padding-bottom: 80px; }
        a { text-decoration:none; color:inherit; }
        button { cursor:pointer; font-family:'Outfit',sans-serif; }
        .spec-item { background: #fff; padding: 12px; border-radius: 12px; border: 1.5px solid #E8F0FB; display: flex; flex-direction: column; gap: 4px; }
        .spec-label { font-size: 11px; color: #6B7C93; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .spec-val { font-size: 14px; font-weight: 700; color: #1A2B4B; }
      `}</style>
      
      {/* NAV */}
      <nav style={{ background:"transparent", padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"absolute", top:0, left:0, right:0, zIndex:10 }}>
        <button onClick={() => router.back()} style={{ width:40, height:40, borderRadius:20, background:"rgba(255,255,255,0.9)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(0,0,0,0.1)" }}>
          <span style={{ fontSize:20 }}>←</span>
        </button>
        <button onClick={handleShare} style={{ width:40, height:40, borderRadius:20, background:"rgba(255,255,255,0.9)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(0,0,0,0.1)" }}>
          <span style={{ fontSize:20 }}>↗</span>
        </button>
      </nav>

      {/* LARGE PHOTO */}
      <div style={{ width:"100%", height:300, background:"#EBF2FF", position:"relative" }}>
        {car.image_url ? (
          <img src={car.image_url} alt={car.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        ) : (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:64 }}>🚗</div>
        )}
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"20px", marginTop:"-24px", position:"relative", zIndex:2 }}>
        {/* HEADER & PRICE */}
        <div style={{ background:"#fff", borderRadius:16, padding:"20px", boxShadow:"0 8px 30px rgba(0,82,204,0.08)", marginBottom:20 }}>
          <div style={{ display:"inline-block", background:"#EBF2FF", color:"#0052CC", fontSize:11, fontWeight:800, padding:"4px 10px", borderRadius:20, marginBottom:10 }}>
            {car.seller_type || "Privatverkauf"}
          </div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"#1A2B4B", lineHeight:1.2, marginBottom:12 }}>
            {car.title}
          </h1>
          <div style={{ fontSize:28, fontWeight:800, color:"#0052CC" }}>
            {fmt(car.price)} €
          </div>
          <p style={{ fontSize:12, color:"#6B7C93", marginTop:4 }}>Verhandlungsbasis</p>
        </div>

        {/* SPECS GRID */}
        <h3 style={{ fontSize:16, fontWeight:800, color:"#1A2B4B", marginBottom:12 }}>Fahrzeugdaten</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
          <div className="spec-item">
             <span className="spec-label">Kilometer</span>
             <span className="spec-val">{fmt(car.mileage)} km</span>
          </div>
          <div className="spec-item">
             <span className="spec-label">Erstzulassung</span>
             <span className="spec-val">{car.year || "-"}</span>
          </div>
          <div className="spec-item">
             <span className="spec-label">Kraftstoff</span>
             <span className="spec-val">{car.fuel_type || "-"}</span>
          </div>
          <div className="spec-item">
             <span className="spec-label">Getriebe</span>
             <span className="spec-val">{car.transmission || "-"}</span>
          </div>
        </div>

        {/* HIGHLIGHTS */}
        <h3 style={{ fontSize:16, fontWeight:800, color:"#1A2B4B", marginBottom:12 }}>Highlights</h3>
        <div style={{ background:"#fff", borderRadius:16, padding:"16px", border:"1.5px solid #E8F0FB", marginBottom:24 }}>
          <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:10 }}>
            <li style={{ display:"flex", gap:10, alignItems:"center", fontSize:14, fontWeight:600, color:"#1A2B4B" }}>
              <span style={{ color:"#0052CC" }}>✓</span> TÜV neu
            </li>
            <li style={{ display:"flex", gap:10, alignItems:"center", fontSize:14, fontWeight:600, color:"#1A2B4B" }}>
              <span style={{ color:"#0052CC" }}>✓</span> Scheckheftgepflegt
            </li>
            <li style={{ display:"flex", gap:10, alignItems:"center", fontSize:14, fontWeight:600, color:"#1A2B4B" }}>
              <span style={{ color:"#0052CC" }}>✓</span> Unfallfrei
            </li>
          </ul>
        </div>

        {/* DESCRIPTION */}
        <h3 style={{ fontSize:16, fontWeight:800, color:"#1A2B4B", marginBottom:12 }}>Beschreibung</h3>
        <div style={{ background:"#fff", borderRadius:16, padding:"20px", border:"1.5px solid #E8F0FB", marginBottom:24 }}>
          <p style={{ fontSize:14, color:"#4A5B73", lineHeight:1.6, whiteSpace:"pre-wrap" }}>
            {car.description || "Keine Beschreibung angegeben."}
          </p>
        </div>

        {/* SELLER INFO */}
        <h3 style={{ fontSize:16, fontWeight:800, color:"#1A2B4B", marginBottom:12 }}>Anbieter</h3>
        {/* We use WhatsApp formatting matching Toni's Facebook style */}
        <div style={{ background:"#fff", borderRadius:16, padding:"20px", border:"1.5px solid #E8F0FB", display:"flex", alignItems:"center", gap:16, marginBottom:24 }}>
          <div style={{ width:48, height:48, borderRadius:"50%", background:"#EBF2FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>
            👤
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:"#1A2B4B", marginBottom:2 }}>
              {car.seller_name || "Privater Verkäufer"}
            </div>
            <div style={{ fontSize:12, color:"#6B7C93" }}>Aktiv auf automarket.de</div>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM BAR */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#fff", padding:"12px 20px", display:"flex", gap:12, borderTop:"1px solid #E0E8F4", zIndex:100, boxShadow:"0 -4px 12px rgba(0,0,0,0.05)" }}>
        <button onClick={handleShare} style={{ flexShrink:0, width:52, height:52, borderRadius:12, background:"#F0F4FA", border:"none", display:"flex", alignItems:"center", justifyContent:"center", color:"#0052CC" }}>
          <span style={{ fontSize:22 }}>↗</span>
        </button>
        <a 
          href={`https://wa.me/?text=Hallo, ich interessiere mich für dein Inserat ${car.title} auf automarket.de`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ flex:1, height:52, borderRadius:12, background:"#25D366", color:"#fff", fontSize:16, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
        >
          <span>💬</span> WhatsApp
        </a>
      </div>
    </>
  );
}
