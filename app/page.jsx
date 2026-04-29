"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

const BRANDS = ["Alle Marken", "Audi", "BMW", "Mercedes-Benz", "Volkswagen", "Ford", "Opel", "Toyota", "Porsche", "Tesla"];

export default function HomePage() {
  const [brand, setBrand] = useState("Alle Marken");
  const [listings, setListings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetchListings();
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let r = [...listings];
    if (brand !== "Alle Marken") {
      r = r.filter(c => c.brand === brand || (c.title || "").includes(brand));
    }
    setFiltered(r);
  }, [brand, listings]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        setListings(data);
        setFiltered(data);
      }
    } catch (e) {}
    setLoading(false);
  };

  const fmt = (n) => parseInt(n || 0).toLocaleString("de-DE");

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Navigation */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 20px", height: "64px",
        background: scrolled ? "rgba(255,255,255,0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "none",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all 0.3s ease"
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px" }}>🚗</div>
          <span style={{ fontSize: "20px", fontWeight: "900", color: "var(--primary)" }}>Auto<span style={{ color: "var(--secondary)" }}>Market</span></span>
        </Link>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/dashboard" className="btn-ghost" style={{ padding: "8px 16px", fontSize: "13px" }}>Mein Konto</Link>
          <Link href="/inserate/neu" className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>Inserieren</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        padding: "120px 20px 60px", 
        background: "linear-gradient(135deg, var(--white) 0%, var(--primary-light) 100%)",
        textAlign: "center"
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(32px, 8vw, 48px)", fontWeight: "900", color: "var(--secondary)", marginBottom: "16px", lineHeight: "1.1" }}>
            Finde dein nächstes <span style={{ color: "var(--primary)" }}>Traumauto</span>.
          </h1>
          <p style={{ fontSize: "16px", color: "var(--text-muted)", marginBottom: "40px", maxWidth: "500px", margin: "0 auto 40px" }}>
            Über {listings.length}+ geprüfte Fahrzeuge von privaten Verkäufern und Händlern in deiner Nähe.
          </p>

          {/* Search Bar */}
          <div className="card" style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", maxWidth: "500px", margin: "0 auto" }}>
            <select 
              value={brand} 
              onChange={e => setBrand(e.target.value)}
              style={{ padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--background)", fontSize: "14px", fontWeight: "600" }}
            >
              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <button className="btn-primary" style={{ padding: "0 24px" }}>Suchen</button>
          </div>
        </div>
      </section>

      {/* Brand Filter */}
      <section style={{ padding: "40px 20px", background: "var(--white)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none", maxWidth: "800px", margin: "0 auto" }}>
          {BRANDS.slice(1).map(b => (
            <button
              key={b}
              onClick={() => setBrand(b)}
              style={{
                flexShrink: 0, padding: "8px 20px", borderRadius: "20px", fontSize: "13px", fontWeight: "700",
                background: brand === b ? "var(--primary)" : "var(--background)",
                color: brand === b ? "#fff" : "var(--text-muted)",
                transition: "all 0.2s"
              }}
            >
              {b}
            </button>
          ))}
        </div>
      </section>

      {/* Listings */}
      <main style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "800" }}>Aktuelle Inserate</h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>{filtered.length} Fahrzeuge gefunden</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: "16px" }}>
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="card" style={{ height: "140px", display: "flex" }}>
                <div className="skeleton" style={{ width: "200px", height: "100%" }} />
                <div style={{ padding: "20px", flex: 1 }}>
                  <div className="skeleton" style={{ width: "70%", height: "24px", marginBottom: "10px" }} />
                  <div className="skeleton" style={{ width: "40%", height: "30px" }} />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ fontSize: "48px" }}>🔍</p>
              <h3 style={{ fontWeight: "800", marginTop: "12px" }}>Keine Fahrzeuge gefunden</h3>
              <button onClick={() => setBrand("Alle Marken")} style={{ color: "var(--primary)", fontWeight: "700", background: "none", marginTop: "8px" }}>Alle anzeigen</button>
            </div>
          ) : (
            filtered.map(car => (
              <Link key={car.id} href={`/inserate/${car.id}`} className="card" style={{ display: "flex", overflow: "hidden", textDecoration: "none", color: "inherit", transition: "transform 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={{ width: "160px", flexShrink: 0, position: "relative", background: "var(--primary-light)" }}>
                  {car.image_url ? (
                    <img src={car.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={car.title} />
                  ) : (
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>🚗</div>
                  )}
                </div>
                <div style={{ padding: "16px 20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "4px", color: "var(--secondary)" }}>{car.title}</h3>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{car.year}</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>•</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{fmt(car.mileage)} km</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>•</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{car.fuel_type}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                    <div style={{ fontSize: "20px", fontWeight: "900", color: "var(--primary)" }}>{fmt(car.price)} €</div>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>{car.location || "DE"}</div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: "var(--secondary)", color: "#fff", padding: "40px 20px", textAlign: "center" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "900", marginBottom: "8px" }}>AutoMarket</h2>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", marginBottom: "20px" }}>Der modernste Marktplatz für Autos in Europa.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", fontSize: "12px" }}>
          <span>© 2025 AutoMarket GmbH</span>
          <a href="#">Impressum</a>
          <a href="#">Datenschutz</a>
        </div>
      </footer>
    </div>
  );
}
