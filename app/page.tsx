"use client";
import { useState } from "react";

const BRANDS = ["Alle Marken", "Audi", "BMW", "Mercedes-Benz", "Volkswagen", "Ford", "Opel", "Toyota", "Renault"];
const MODELS = ["Alle Modelle", "Golf", "3er", "A4", "C-Klasse", "Polo", "Corsa", "Yaris", "Clio"];
const PRICES = ["Beliebig", "bis 5.000 €", "bis 10.000 €", "bis 20.000 €", "bis 35.000 €", "bis 50.000 €"];

const CARS = [
  { id: 1, brand: "Volkswagen", model: "Golf GTI", year: 2020, price: 24900, mileage: 42000, fuel: "Benzin", location: "München", image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80", badge: null, seller: "Privat" },
  { id: 2, brand: "BMW", model: "320d xDrive", year: 2019, price: 28500, mileage: 68000, fuel: "Diesel", location: "Berlin", image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80", badge: "DEAL", seller: "Händler" },
  { id: 3, brand: "Audi", model: "A4 Avant", year: 2021, price: 33800, mileage: 29000, fuel: "Diesel", location: "Hamburg", image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80", badge: null, seller: "Händler" },
  { id: 4, brand: "Mercedes-Benz", model: "C 200", year: 2018, price: 22400, mileage: 91000, fuel: "Benzin", location: "Frankfurt", image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80", badge: "DEAL", seller: "Privat" },
  { id: 5, brand: "Toyota", model: "RAV4 Hybrid", year: 2022, price: 38900, mileage: 18000, fuel: "Hybrid", location: "Stuttgart", image: "https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=600&q=80", badge: null, seller: "Händler" },
  { id: 6, brand: "Volkswagen", model: "Tiguan", year: 2020, price: 27600, mileage: 54000, fuel: "Diesel", location: "Köln", image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80", badge: null, seller: "Privat" },
];

const BRANDS_LOGOS = [
  { name: "VW", emoji: "🔵" },
  { name: "BMW", emoji: "🔵" },
  { name: "Audi", emoji: "⭕" },
  { name: "Mercedes", emoji: "⭐" },
  { name: "Ford", emoji: "🔷" },
  { name: "Opel", emoji: "⚡" },
];

export default function HomePage() {
  const [brand, setBrand] = useState("Alle Marken");
  const [model, setModel] = useState("Alle Modelle");
  const [price, setPrice] = useState("Beliebig");
  const [menuOpen, setMenuOpen] = useState(false);

  const fmt = (n: number) => n.toLocaleString("de-DE");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F0F4F8; }
        a { text-decoration: none; color: inherit; }
        button { cursor: pointer; font-family: 'DM Sans', sans-serif; }
        select { font-family: 'DM Sans', sans-serif; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card { animation: fadeUp 0.4s ease both; }
        .card:nth-child(2) { animation-delay: 0.05s; }
        .card:nth-child(3) { animation-delay: 0.1s; }
        .card:nth-child(4) { animation-delay: 0.15s; }
        .card:nth-child(5) { animation-delay: 0.2s; }
        .card:nth-child(6) { animation-delay: 0.25s; }
        .card:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(28,53,87,0.13) !important; }
        .card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .brand-pill:hover { background: #1C3557!important; color: #fff!important; }
        .brand-pill { transition: all 0.18s ease; }
        .search-btn:hover { background: #c4261e!important; }
        .post-btn:hover { background: #fff!important; color: #E63027!important; }
      `}</style>

      <div style={{ minHeight: "100vh" }}>

        {/* ── NAV ── */}
        <nav style={{
          background: "#1C3557", padding: "0 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 56, position: "sticky", top: 0, zIndex: 100,
          boxShadow: "0 2px 16px rgba(28,53,87,0.35)",
        }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 7, background: "#E63027",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>🚘</div>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
              automarket<span style={{ color: "#E63027" }}>.de</span>
            </span>
          </a>

          {/* Desktop nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {["Kaufen", "Verkaufen", "Händler"].map(item => (
              <a key={item} href="#" style={{
                color: "#8AA8C4", fontSize: 13, fontWeight: 600, padding: "6px 10px",
                borderRadius: 7, display: "none",
              }}>{item}</a>
            ))}
            <a href="/inserate/neu" style={{
              background: "#E63027", color: "#fff", fontSize: 13, fontWeight: 700,
              padding: "8px 14px", borderRadius: 8, border: "none",
            }}>+ Inserieren</a>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{
              background: "transparent", border: "none", color: "#8AA8C4",
              fontSize: 20, padding: "4px 8px", marginLeft: 4,
            }}>☰</button>
          </div>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{
            position: "fixed", top: 56, left: 0, right: 0, bottom: 0,
            background: "#1C3557", zIndex: 99, padding: 24,
            display: "flex", flexDirection: "column", gap: 4,
          }}>
            {["🏠 Startseite", "🔍 Alle Fahrzeuge", "📝 Inserat aufgeben", "🏢 Händlerbereich", "ℹ️ Über uns"].map(item => (
              <a key={item} href={item.includes("Inserat") ? "/inserate/neu" : "#"}
                onClick={() => setMenuOpen(false)}
                style={{
                  color: "#fff", fontSize: 17, fontWeight: 600, padding: "14px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}>{item}</a>
            ))}
          </div>
        )}

        {/* ── HERO ── */}
        <div style={{
          background: "linear-gradient(160deg, #1C3557 0%, #2A4F7C 60%, #1a3a5c 100%)",
          padding: "36px 20px 48px",
          position: "relative", overflow: "hidden",
        }}>
          {/* Background decoration */}
          <div style={{
            position: "absolute", top: -60, right: -60,
            width: 220, height: 220, borderRadius: "50%",
            background: "rgba(230,48,39,0.08)", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: -40, left: -40,
            width: 160, height: 160, borderRadius: "50%",
            background: "rgba(255,255,255,0.04)", pointerEvents: "none",
          }} />

          <div style={{ maxWidth: 480, margin: "0 auto", position: "relative" }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#E63027", textTransform: "uppercase", marginBottom: 8 }}>
              🇩🇪 Deutschlands neue Autoplatform
            </p>
            <h1 style={{
              fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1.2,
              marginBottom: 8, letterSpacing: "-0.02em",
            }}>
              Finde dein<br />
              <span style={{ color: "#E63027" }}>Traumauto.</span>
            </h1>
            <p style={{ fontSize: 14, color: "#8AA8C4", marginBottom: 24, lineHeight: 1.5 }}>
              Über 50.000 Fahrzeuge von Privat und Händlern
            </p>

            {/* Search box */}
            <div style={{
              background: "#fff", borderRadius: 16, padding: 16,
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#8A9BAE", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Marke</label>
                  <select value={brand} onChange={e => setBrand(e.target.value)} style={{
                    width: "100%", padding: "10px 12px", borderRadius: 9, border: "1.5px solid #E0E8F0",
                    fontSize: 13, color: "#1C3557", fontWeight: 600, background: "#F7F9FB",
                    appearance: "none",
                  }}>
                    {BRANDS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#8A9BAE", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Modell</label>
                  <select value={model} onChange={e => setModel(e.target.value)} style={{
                    width: "100%", padding: "10px 12px", borderRadius: 9, border: "1.5px solid #E0E8F0",
                    fontSize: 13, color: "#1C3557", fontWeight: 600, background: "#F7F9FB",
                    appearance: "none",
                  }}>
                    {MODELS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#8A9BAE", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Max. Preis</label>
                <select value={price} onChange={e => setPrice(e.target.value)} style={{
                  width: "100%", padding: "10px 12px", borderRadius: 9, border: "1.5px solid #E0E8F0",
                  fontSize: 13, color: "#1C3557", fontWeight: 600, background: "#F7F9FB",
                  appearance: "none",
                }}>
                  {PRICES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <button className="search-btn" style={{
                width: "100%", padding: "13px", borderRadius: 10, border: "none",
                background: "#E63027", color: "#fff", fontSize: 15, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                🔍 Fahrzeuge suchen
              </button>
            </div>
          </div>
        </div>

        {/* ── POPULAR BRANDS ── */}
        <div style={{ padding: "24px 20px 0", maxWidth: 480, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A9BAE", marginBottom: 12 }}>
            Beliebte Marken
          </p>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {BRANDS_LOGOS.map(b => (
              <button key={b.name} className="brand-pill" style={{
                flexShrink: 0, padding: "7px 14px", borderRadius: 20,
                border: "1.5px solid #DDE3EA", background: "#fff",
                fontSize: 12, fontWeight: 700, color: "#1C3557",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 14 }}>{b.emoji}</span>
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── CAR LISTINGS ── */}
        <div style={{ padding: "24px 20px", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A9BAE" }}>
              Aktuelle Inserate
            </p>
            <a href="#" style={{ fontSize: 12, fontWeight: 700, color: "#E63027" }}>Alle ansehen →</a>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {CARS.map(car => (
              <div key={car.id} className="card" style={{
                background: "#fff", borderRadius: 14, overflow: "hidden",
                boxShadow: "0 2px 16px rgba(28,53,87,0.07)",
                display: "flex", height: 110,
              }}>
                {/* Image */}
                <div style={{ width: 130, flexShrink: 0, position: "relative" }}>
                  <img src={car.image} alt={car.model} style={{
                    width: "100%", height: "100%", objectFit: "cover", display: "block",
                  }} />
                  {car.badge && (
                    <div style={{
                      position: "absolute", top: 8, left: 8,
                      background: "#E63027", color: "#fff",
                      fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 20,
                      letterSpacing: "0.06em",
                    }}>{car.badge}</div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#1C3557", marginBottom: 2, lineHeight: 1.2 }}>
                      {car.brand} {car.model}
                    </p>
                    <p style={{ fontSize: 11, color: "#8A9BAE" }}>
                      {car.year} · {fmt(car.mileage)} km · {car.fuel}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "#E63027" }}>
                      {fmt(car.price)} €
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 20,
                        background: car.seller === "Händler" ? "#EEF3F8" : "#FFF0F0",
                        color: car.seller === "Händler" ? "#1C3557" : "#E63027",
                        letterSpacing: "0.04em",
                      }}>{car.seller}</span>
                      <span style={{ fontSize: 11, color: "#8A9BAE" }}>📍 {car.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <a href="#" style={{
            display: "block", textAlign: "center", padding: "13px",
            border: "1.5px solid #DDE3EA", borderRadius: 12, marginTop: 14,
            fontSize: 14, fontWeight: 700, color: "#1C3557", background: "#fff",
          }}>
            Alle Fahrzeuge anzeigen →
          </a>
        </div>

        {/* ── POST YOUR CAR CTA ── */}
        <div style={{ padding: "0 20px 32px", maxWidth: 480, margin: "0 auto" }}>
          <div style={{
            background: "linear-gradient(135deg, #1C3557, #2A4F7C)",
            borderRadius: 16, padding: "24px 20px", textAlign: "center",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -30, right: -30, width: 120, height: 120,
              borderRadius: "50%", background: "rgba(230,48,39,0.15)",
            }} />
            <p style={{ fontSize: 22, marginBottom: 6 }}>🚗</p>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 6 }}>
              Fahrzeug verkaufen?
            </h3>
            <p style={{ fontSize: 13, color: "#8AA8C4", marginBottom: 18, lineHeight: 1.5 }}>
              Inserat in 3 Minuten aufgeben — kostenlos für Privatanbieter.
            </p>
            <a href="/inserate/neu" className="post-btn" style={{
              display: "inline-block", padding: "12px 28px",
              background: "#E63027", color: "#fff",
              fontSize: 14, fontWeight: 700, borderRadius: 10,
              border: "2px solid #E63027", transition: "all 0.18s ease",
            }}>
              + Jetzt inserieren
            </a>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          background: "#1C3557", padding: "24px 20px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
            automarket<span style={{ color: "#E63027" }}>.de</span>
          </div>
          <p style={{ fontSize: 12, color: "#8AA8C4", marginBottom: 16 }}>
            Die moderne Fahrzeugplattform für Deutschland
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            {["Impressum", "Datenschutz", "AGB", "Kontakt"].map(item => (
              <a key={item} href="#" style={{ fontSize: 11, color: "#8AA8C4", fontWeight: 600 }}>{item}</a>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "#4A6380", marginTop: 16 }}>
            © 2025 AutoMarket.de
          </p>
        </div>

      </div>
    </>
  );
}
