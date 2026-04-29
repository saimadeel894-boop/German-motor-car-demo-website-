"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
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

    if (!error) setCar(data);
    setLoading(false);
  };

  const fmt = (n) => parseInt(n || 0).toLocaleString("de-DE");

  const handleShare = async () => {
    if (navigator.share) {
      navigator.share({ title: car.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link kopiert!");
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="skeleton" style={{ width: "100%", height: "300px" }} />
      <div style={{ padding: "20px" }}>
        <div className="skeleton" style={{ width: "80%", height: "30px", marginBottom: "10px" }} />
        <div className="skeleton" style={{ width: "40%", height: "40px", marginBottom: "20px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: "60px", borderRadius: "12px" }} />)}
        </div>
      </div>
    </div>
  );

  if (!car) return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>Inserat nicht gefunden</h2>
      <button onClick={() => router.push("/")} className="btn-primary" style={{ marginTop: "20px" }}>Zurück zur Übersicht</button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: "100px" }}>
      {/* Navbar Overlay */}
      <nav style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, padding: "16px 20px", display: "flex", justifyContent: "space-between" }}>
        <button onClick={() => router.back()} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-md)" }}>
          <span style={{ fontSize: "20px", fontWeight: "bold", color: "var(--primary)" }}>←</span>
        </button>
        <button onClick={handleShare} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-md)" }}>
          <span style={{ fontSize: "18px" }}>↗</span>
        </button>
      </nav>

      {/* Image Gallery */}
      <div style={{ width: "100%", height: "320px", background: "#000", position: "relative", overflow: "hidden" }}>
        {car.image_url ? (
          <img src={car.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={car.title} />
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--primary-light)", fontSize: "64px" }}>🚗</div>
        )}
        <div style={{ position: "absolute", bottom: "16px", right: "16px", background: "rgba(0,0,0,0.6)", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
          1 / 1
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: "600px", margin: "-20px auto 0", padding: "0 16px", position: "relative" }}>
        {/* Main Info Card */}
        <div className="card" style={{ padding: "24px", marginBottom: "20px" }}>
          <div style={{ display: "inline-block", background: "var(--primary-light)", color: "var(--primary)", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "20px", marginBottom: "12px" }}>
            {car.condition || "Top Angebot"}
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-main)", marginBottom: "8px", lineHeight: "1.2" }}>
            {car.title}
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "16px" }}>
            📍 {car.location || "Deutschland"}
          </p>
          <div style={{ fontSize: "32px", fontWeight: "900", color: "var(--primary)" }}>
            {fmt(car.price)} €
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Verhandlungsbasis</p>
        </div>

        {/* Specs Grid */}
        <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px" }}>Technische Daten</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Kilometer", value: `${fmt(car.mileage)} km`, icon: "🛣️" },
            { label: "Erstzulassung", value: car.year, icon: "📅" },
            { label: "Kraftstoff", value: car.fuel_type, icon: "⛽" },
            { label: "Modell", value: car.model, icon: "🚗" },
          ].map(spec => (
            <div key={spec.label} style={{ background: "var(--white)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>{spec.label}</span>
              <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-main)" }}>{spec.value}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px" }}>Beschreibung</h3>
        <div className="card" style={{ padding: "20px", marginBottom: "24px" }}>
          <p style={{ fontSize: "15px", lineHeight: "1.6", color: "var(--secondary)", whiteSpace: "pre-wrap" }}>
            {car.description || "Keine Beschreibung vorhanden."}
          </p>
        </div>

        {/* Seller Info */}
        <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>👤</div>
          <div>
            <div style={{ fontWeight: "800", color: "var(--text-main)" }}>{car.seller_name || "Privater Anbieter"}</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Aktiv seit 2024</div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--white)", padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: "12px", zIndex: 100, boxShadow: "0 -4px 10px rgba(0,0,0,0.05)" }}>
        <button onClick={handleShare} style={{ width: "52px", height: "52px", borderRadius: "12px", background: "var(--background)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "20px" }}>↗</span>
        </button>
        <a
          href={`https://wa.me/${(car.phone || "").replace(/\D/g, "")}?text=Hallo, ich interessiere mich für Ihr Inserat: ${car.title}`}
          target="_blank"
          style={{ flex: 1, background: "#25D366", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px", fontWeight: "800", fontSize: "16px", textDecoration: "none", gap: "8px" }}
        >
          <span>💬</span> WhatsApp
        </a>
      </div>
    </div>
  );
}
