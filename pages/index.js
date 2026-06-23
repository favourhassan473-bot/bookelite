import { useRouter } from "next/router";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.logo}>Book<span style={styles.logoAccent}>Elite</span></h1>
        <div style={styles.headerButtons}>
          <button onClick={() => router.push("/login")} style={styles.loginBtn}>Log in</button>
          <button onClick={() => router.push("/signup")} style={styles.signupBtn}>Get started free</button>
        </div>
      </header>

      <section style={styles.hero}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div style={styles.heroBadge}>Built for Lagos service businesses</div>
          <h2 style={styles.heroTitle}>
            Accept bookings online.<br />
            <span style={styles.heroAccent}>Get paid. Grow faster.</span>
          </h2>
          <p style={styles.heroSubtitle}>
            BookElite gives your salon, barbershop, or clinic a professional booking page in minutes.
            No more WhatsApp chaos. No more double bookings.
          </p>
          <div style={styles.heroButtons}>
            <button onClick={() => router.push("/signup")} style={styles.heroCta}>
              Start free — no credit card needed
            </button>
            <button onClick={() => router.push("/book/test-salon-two-yc9z")} style={styles.heroDemo}>
              See a demo →
            </button>
          </div>
        </motion.div>
      </section>

      <section style={styles.features}>
        {[
          { icon: "📅", title: "Online booking page", desc: "Share a link with your customers. They pick a service, date, and time — done." },
          { icon: "💳", title: "Paystack payments", desc: "Accept subscription payments directly into your Nigerian bank account." },
          { icon: "📊", title: "Dashboard & analytics", desc: "See all your upcoming bookings, manage services, and track your growth." },
          { icon: "🔒", title: "No double bookings", desc: "Our smart slot system prevents two customers from booking the same time." },
        ].map((f) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={styles.featureCard}>
            <div style={styles.featureIcon}>{f.icon}</div>
            <h3 style={styles.featureTitle}>{f.title}</h3>
            <p style={styles.featureDesc}>{f.desc}</p>
          </motion.div>
        ))}
      </section>

      <section style={styles.pricing}>
        <h2 style={styles.pricingTitle}>Simple pricing</h2>
        <p style={styles.pricingSubtitle}>Start free. Upgrade when you grow.</p>
        <div style={styles.pricingCards}>
          <div style={styles.pricingCard}>
            <h3 style={styles.planName}>Free</h3>
            <p style={styles.planPrice}>₦0<span style={styles.planPer}>/month</span></p>
            <ul style={styles.planFeatures}>
              {["20 bookings/month", "1 booking page", "Services management", "Customer dashboard"].map((f) => (
                <li key={f} style={styles.planFeature}><span style={styles.check}>✓</span> {f}</li>
              ))}
            </ul>
            <button onClick={() => router.push("/signup")} style={styles.planBtn}>Get started free</button>
          </div>
          <div style={{ ...styles.pricingCard, ...styles.pricingCardPro }}>
            <div style={styles.proBadge}>Most popular</div>
            <h3 style={styles.planName}>Pro</h3>
            <p style={styles.planPrice}>₦5,000<span style={styles.planPer}>/month</span></p>
            <ul style={styles.planFeatures}>
              {["Unlimited bookings", "Priority support", "Advanced analytics", "Custom branding (soon)"].map((f) => (
                <li key={f} style={styles.planFeature}><span style={styles.check}>✓</span> {f}</li>
              ))}
            </ul>
            <button onClick={() => router.push("/signup")} style={styles.planBtnPro}>Start with Pro</button>
          </div>
        </div>
      </section>

      <footer style={styles.footer}>
        <p style={styles.footerText}>© 2026 BookElite · Built in Lagos 🇳🇬</p>
      </footer>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0f0f12", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid #1a1a1f" },
  logo: { fontSize: "24px", fontWeight: "800", color: "#fff", margin: 0 },
  logoAccent: { color: "#6c5ce7" },
  headerButtons: { display: "flex", gap: "12px" },
  loginBtn: { background: "transparent", border: "1px solid #333", color: "#fff", borderRadius: "8px", padding: "9px 20px", fontSize: "14px", cursor: "pointer" },
  signupBtn: { background: "#6c5ce7", border: "none", color: "#fff", borderRadius: "8px", padding: "9px 20px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  hero: { padding: "100px 40px", maxWidth: "760px", margin: "0 auto", textAlign: "center" },
  heroBadge: { display: "inline-block", background: "rgba(108,92,231,0.15)", color: "#6c5ce7", borderRadius: "20px", padding: "6px 16px", fontSize: "13px", fontWeight: "600", marginBottom: "24px" },
  heroTitle: { fontSize: "52px", fontWeight: "800", lineHeight: "1.15", marginBottom: "20px", color: "#fff" },
  heroAccent: { color: "#6c5ce7" },
  heroSubtitle: { fontSize: "18px", color: "#999", lineHeight: "1.7", marginBottom: "36px" },
  heroButtons: { display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" },
  heroCta: { background: "#6c5ce7", color: "#fff", border: "none", borderRadius: "10px", padding: "15px 28px", fontSize: "16px", fontWeight: "700", cursor: "pointer" },
  heroDemo: { background: "transparent", color: "#fff", border: "1px solid #333", borderRadius: "10px", padding: "15px 28px", fontSize: "16px", cursor: "pointer" },
  features: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", padding: "60px 40px", maxWidth: "1000px", margin: "0 auto" },
  featureCard: { background: "#1a1a1f", borderRadius: "16px", padding: "28px" },
  featureIcon: { fontSize: "32px", marginBottom: "16px" },
  featureTitle: { fontSize: "16px", fontWeight: "700", marginBottom: "8px" },
  featureDesc: { fontSize: "14px", color: "#999", lineHeight: "1.6" },
  pricing: { padding: "80px 40px", textAlign: "center", maxWidth: "800px", margin: "0 auto" },
  pricingTitle: { fontSize: "36px", fontWeight: "800", marginBottom: "12px" },
  pricingSubtitle: { color: "#999", fontSize: "16px", marginBottom: "48px" },
  pricingCards: { display: "flex", gap: "24px", justifyContent: "center", flexWrap: "wrap" },
  pricingCard: { background: "#1a1a1f", borderRadius: "16px", padding: "32px", width: "280px", textAlign: "left", border: "1px solid #222" },
  pricingCardPro: { border: "2px solid #6c5ce7", position: "relative" },
  proBadge: { position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#6c5ce7", color: "#fff", borderRadius: "20px", padding: "3px 14px", fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap" },
  planName: { fontSize: "18px", fontWeight: "700", marginBottom: "8px" },
  planPrice: { fontSize: "36px", fontWeight: "800", color: "#6c5ce7", marginBottom: "24px" },
  planPer: { fontSize: "14px", color: "#999", fontWeight: "400" },
  planFeatures: { listStyle: "none", padding: 0, marginBottom: "28px", display: "flex", flexDirection: "column", gap: "10px" },
  planFeature: { fontSize: "14px", color: "#ccc" },
  check: { color: "#6c5ce7", marginRight: "8px" },
  planBtn: { width: "100%", background: "#26262c", color: "#fff", border: "none", borderRadius: "8px", padding: "13px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  planBtnPro: { width: "100%", background: "#6c5ce7", color: "#fff", border: "none", borderRadius: "8px", padding: "13px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  footer: { borderTop: "1px solid #1a1a1f", padding: "32px 40px", textAlign: "center" },
  footerText: { color: "#555", fontSize: "14px" },
};
