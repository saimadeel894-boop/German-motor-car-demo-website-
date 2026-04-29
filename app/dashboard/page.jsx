"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function Dashboard() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    setLoading(true);
    // In a real app, we'd filter by user ID. For this demo, we'll show all listings 
    // or simulate "My Listings" using a local storage key if it exists.
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setListings(data);
    setLoading(false);
  };

  const deleteListing = async (id) => {
    if (!confirm("Inserat wirklich löschen?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (!error) {
      setListings(prev => prev.filter(l => l.id !== id));
    }
  };

  const fmt = (n) => parseInt(n || 0).toLocaleString("de-DE");

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: "40px" }}>
      {/* Header */}
      <header style={{ background: "var(--white)", borderBottom: "1px solid var(--border)", padding: "20px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-main)" }}>Mein Dashboard</h1>
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Verwalte deine Inserate</p>
          </div>
          <Link href="/inserate/neu" className="btn-primary" style={{ padding: "10px 20px", fontSize: "14px" }}>
            + Neues Inserat
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "800px", margin: "32px auto", padding: "0 20px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="card" style={{ display: "flex", overflow: "hidden", height: "120px" }}>
                <div className="skeleton" style={{ width: "160px", height: "100%" }} />
                <div style={{ padding: "16px", flex: 1 }}>
                  <div className="skeleton" style={{ width: "60%", height: "20px", marginBottom: "10px" }} />
                  <div className="skeleton" style={{ width: "30%", height: "24px" }} />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--white)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>📭</div>
            <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px" }}>Noch keine Inserate</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>Verkaufe dein Auto in wenigen Minuten auf AutoMarket.</p>
            <Link href="/inserate/neu" className="btn-primary" style={{ display: "inline-flex" }}>
              Jetzt erstes Inserat erstellen
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {listings.map(car => (
              <div key={car.id} className="card" style={{ display: "flex", overflow: "hidden", transition: "transform 0.2s" }}>
                {/* Thumbnail */}
                <div style={{ width: "140px", flexShrink: 0, background: "var(--primary-light)", position: "relative" }}>
                  {car.image_url ? (
                    <img src={car.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>🚗</div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "4px" }}>{car.title}</h3>
                    <p style={{ fontSize: "18px", fontWeight: "900", color: "var(--primary)" }}>{fmt(car.price)} €</p>
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", background: "var(--background)", padding: "2px 8px", borderRadius: "4px" }}>{car.year}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", background: "var(--background)", padding: "2px 8px", borderRadius: "4px" }}>{fmt(car.mileage)} km</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                    <Link href={`/inserate/${car.id}`} style={{ fontSize: "13px", fontWeight: "700", color: "var(--primary)" }}>Ansehen</Link>
                    <button onClick={() => deleteListing(car.id)} style={{ fontSize: "13px", fontWeight: "700", color: "var(--error)", background: "none" }}>Löschen</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Navigation Footer for Mobile */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--white)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-around", padding: "12px", zIndex: 100 }}>
        <Link href="/" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
          <span style={{ fontSize: "20px" }}>🏠</span> Start
        </Link>
        <Link href="/dashboard" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--primary)", fontWeight: "700" }}>
          <span style={{ fontSize: "20px" }}>📊</span> Dashboard
        </Link>
        <Link href="/inserate/neu" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
          <span style={{ fontSize: "20px" }}>➕</span> Inserieren
        </Link>
      </nav>
    </div>
  );
}
