import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import dbConnect from "../../lib/mongodb";
import Business from "../../models/Business";
import Service from "../../models/Service";
import Booking from "../../models/Booking";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  await dbConnect();
  const business = await Business.findById(session.user.businessId).lean();
  if (!business) {
    return { redirect: { destination: "/login?error=no-business", permanent: false } };
  }
  const services = await Service.find({ business: session.user.businessId }).sort({ createdAt: -1 }).lean();
  const bookings = await Booking.find({ business: session.user.businessId })
    .populate("service", "name duration price")
    .sort({ date: -1, time: -1 })
    .lean();
  return {
    props: {
      business: JSON.parse(JSON.stringify(business)),
      initialServices: JSON.parse(JSON.stringify(services)),
      initialBookings: JSON.parse(JSON.stringify(bookings)),
    },
  };
}

const FREE_TIER_LIMIT = 20;

export default function Dashboard({ business, initialServices, initialBookings }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("services");
  const [services, setServices] = useState(initialServices);
  const [bookings, setBookings] = useState(initialBookings);
  const [form, setForm] = useState({ name: "", duration: "", price: "", description: "" });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (router.query.subscribed === "true" && router.query.reference) {
      setVerifying(true);
      fetch(`/api/subscription/verify?reference=${router.query.reference}`)
        .then((r) => r.json())
        .then(() => {
          setVerifying(false);
          router.replace("/dashboard");
        });
    }
  }, [router.query]);

  const handleSubscribe = async () => {
    setSubLoading(true);
    try {
      const res = await fetch("/api/subscription/initialize", { method: "POST" });
      const data = await res.json();
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    } catch (err) {
      console.error(err);
    }
    setSubLoading(false);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddService = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          duration: Number(form.duration),
          price: Number(form.price),
          description: form.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Something went wrong"); setLoading(false); return; }
      setServices([data.service, ...services]);
      setForm({ name: "", duration: "", price: "", description: "" });
      setShowForm(false);
    } catch (err) {
      setError("Something went wrong.");
    }
    setLoading(false);
  };

  const handleDeleteService = async (id) => {
    if (!confirm("Delete this service?")) return;
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (res.ok) setServices(services.filter((s) => s._id !== id));
  };

  const handleUpdateBooking = async (id, status) => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setBookings(bookings.map((b) => b._id === id ? { ...b, status } : b));
  };

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const pastBookings = bookings.filter((b) => b.status !== "confirmed");
  const isFreeTier = business.subscriptionStatus === "free";
  const bookingsLeft = Math.max(0, FREE_TIER_LIMIT - business.bookingsThisMonth);
  const statusColor = { confirmed: "#6c5ce7", completed: "#00b894", cancelled: "#ff5252" };
  const statusBg = { confirmed: "rgba(108,92,231,0.1)", completed: "rgba(0,184,148,0.1)", cancelled: "rgba(255,82,82,0.1)" };

  if (verifying) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f12", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#fff", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>⏳</div>
          <p>Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.businessName}>{business.name}</h1>
          <a href={`/book/${business.slug}`} target="_blank" rel="noreferrer" style={styles.bookingLink}>
            View public booking page →
          </a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isFreeTier && (
            <span style={styles.freeBadge}>Free · {bookingsLeft} bookings left</span>
          )}
          {!isFreeTier && (
            <span style={styles.proBadge}>⚡ Pro</span>
          )}
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={styles.logoutButton}>
            Log out
          </button>
        </div>
      </header>

      {isFreeTier && bookingsLeft <= 5 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.upgradeBanner}
        >
          <div>
            <strong style={{ color: "#fff" }}>
              {bookingsLeft === 0 ? "You've hit your free limit!" : `Only ${bookingsLeft} bookings left on the free plan.`}
            </strong>
            <p style={{ color: "#ccc", fontSize: "13px", marginTop: "4px" }}>
              Upgrade to Pro for unlimited bookings — ₦5,000/month.
            </p>
          </div>
          <button onClick={handleSubscribe} disabled={subLoading} style={styles.upgradeButton}>
            {subLoading ? "Redirecting..." : "Upgrade to Pro →"}
          </button>
        </motion.div>
      )}

      <nav style={styles.nav}>
        <span onClick={() => setActiveTab("services")} style={{ ...styles.navItem, ...(activeTab === "services" ? styles.navItemActive : {}) }}>
          Services
        </span>
        <span onClick={() => setActiveTab("bookings")} style={{ ...styles.navItem, ...(activeTab === "bookings" ? styles.navItemActive : {}) }}>
          Bookings {confirmedBookings.length > 0 && <span style={styles.badge}>{confirmedBookings.length}</span>}
        </span>
        <span onClick={() => setActiveTab("subscription")} style={{ ...styles.navItem, ...(activeTab === "subscription" ? styles.navItemActive : {}) }}>
          Subscription
        </span>
      </nav>

      <main style={styles.main}>
        {activeTab === "services" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Your services</h2>
              <button onClick={() => setShowForm(!showForm)} style={styles.addButton}>
                {showForm ? "Cancel" : "+ Add service"}
              </button>
            </div>
            {showForm && (
              <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                onSubmit={handleAddService} style={styles.form}>
                {error && <div style={styles.error}>{error}</div>}
                <div style={styles.formRow}>
                  <input type="text" name="name" placeholder="Service name" value={form.name} onChange={handleChange} style={styles.input} required />
                  <input type="number" name="duration" placeholder="Duration (min)" value={form.duration} onChange={handleChange} style={styles.input} required />
                  <input type="number" name="price" placeholder="Price (₦)" value={form.price} onChange={handleChange} style={styles.input} required />
                </div>
                <textarea name="description" placeholder="Description (optional)" value={form.description} onChange={handleChange} style={styles.textarea} />
                <button type="submit" disabled={loading} style={styles.submitButton}>
                  {loading ? "Adding..." : "Add service"}
                </button>
              </motion.form>
            )}
            {services.length === 0 ? (
              <p style={styles.emptyState}>No services yet. Add your first one above.</p>
            ) : (
              <div style={styles.serviceList}>
                {services.map((service) => (
                  <div key={service._id} style={styles.serviceCard}>
                    <div>
                      <h3 style={styles.serviceName}>{service.name}</h3>
                      <p style={styles.serviceMeta}>{service.duration} min · ₦{service.price.toLocaleString()}</p>
                      {service.description && <p style={styles.serviceDescription}>{service.description}</p>}
                    </div>
                    <button onClick={() => handleDeleteService(service._id)} style={styles.deleteButton}>Delete</button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "bookings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Bookings</h2>
              <div style={styles.statsRow}>
                <div style={styles.stat}>
                  <span style={styles.statNum}>{confirmedBookings.length}</span>
                  <span style={styles.statLabel}>Upcoming</span>
                </div>
                <div style={styles.stat}>
                  <span style={styles.statNum}>{bookings.filter(b => b.status === "completed").length}</span>
                  <span style={styles.statLabel}>Completed</span>
                </div>
                <div style={styles.stat}>
                  <span style={styles.statNum}>{business.bookingsThisMonth}</span>
                  <span style={styles.statLabel}>This month</span>
                </div>
              </div>
            </div>
            {bookings.length === 0 ? (
              <p style={styles.emptyState}>No bookings yet. Share your booking page to get started.</p>
            ) : (
              <>
                {confirmedBookings.length > 0 && (
                  <>
                    <h3 style={styles.subheading}>Upcoming</h3>
                    <div style={styles.bookingList}>
                      {confirmedBookings.map((booking) => (
                        <div key={booking._id} style={styles.bookingCard}>
                          <div style={styles.bookingLeft}>
                            <div style={styles.bookingDate}>
                              <span style={styles.bookingDateNum}>{booking.date.split("-")[2]}</span>
                              <span style={styles.bookingDateMonth}>{new Date(booking.date + "T12:00:00").toLocaleString("default", { month: "short" })}</span>
                            </div>
                            <div>
                              <h3 style={styles.customerName}>{booking.customerName}</h3>
                              <p style={styles.bookingService}>{booking.service?.name} · {booking.time}</p>
                              <p style={styles.bookingContact}>{booking.customerEmail}</p>
                              {booking.customerPhone && <p style={styles.bookingContact}>{booking.customerPhone}</p>}
                              {booking.notes && <p style={styles.bookingNotes}>"{booking.notes}"</p>}
                            </div>
                          </div>
                          <div style={styles.bookingRight}>
                            <span style={{ ...styles.statusBadge, color: statusColor[booking.status], background: statusBg[booking.status] }}>
                              {booking.status}
                            </span>
                            <div style={styles.actionButtons}>
                              <button onClick={() => handleUpdateBooking(booking._id, "completed")} style={styles.completeButton}>Complete</button>
                              <button onClick={() => handleUpdateBooking(booking._id, "cancelled")} style={styles.cancelButton}>Cancel</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {pastBookings.length > 0 && (
                  <>
                    <h3 style={{ ...styles.subheading, marginTop: "32px" }}>Past bookings</h3>
                    <div style={styles.bookingList}>
                      {pastBookings.map((booking) => (
                        <div key={booking._id} style={{ ...styles.bookingCard, opacity: 0.6 }}>
                          <div style={styles.bookingLeft}>
                            <div style={styles.bookingDate}>
                              <span style={styles.bookingDateNum}>{booking.date.split("-")[2]}</span>
                              <span style={styles.bookingDateMonth}>{new Date(booking.date + "T12:00:00").toLocaleString("default", { month: "short" })}</span>
                            </div>
                            <div>
                              <h3 style={styles.customerName}>{booking.customerName}</h3>
                              <p style={styles.bookingService}>{booking.service?.name} · {booking.time}</p>
                            </div>
                          </div>
                          <span style={{ ...styles.statusBadge, color: statusColor[booking.status], background: statusBg[booking.status] }}>
                            {booking.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </motion.div>
        )}

        {activeTab === "subscription" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={styles.sectionTitle}>Subscription</h2>
            <div style={styles.subCard}>
              <div style={styles.subStatus}>
                <div>
                  <h3 style={styles.subPlanName}>
                    {isFreeTier ? "Free Plan" : "Pro Plan ⚡"}
                  </h3>
                  <p style={styles.subPlanDesc}>
                    {isFreeTier
                      ? `${bookingsLeft} of ${FREE_TIER_LIMIT} free bookings remaining this month`
                      : `Renews on ${new Date(business.subscriptionRenewsAt).toLocaleDateString()}`}
                  </p>
                </div>
                <span style={{ ...styles.statusBadge, color: isFreeTier ? "#999" : "#6c5ce7", background: isFreeTier ? "#26262c" : "rgba(108,92,231,0.1)", fontSize: "14px", padding: "6px 14px" }}>
                  {isFreeTier ? "Free" : "Active"}
                </span>
              </div>

              {isFreeTier && (
                <div style={styles.proFeatures}>
                  <h4 style={styles.proFeaturesTitle}>Upgrade to Pro — ₦5,000/month</h4>
                  <ul style={styles.featureList}>
                    {["Unlimited bookings per month", "Priority support", "Advanced analytics (coming soon)", "Custom branding (coming soon)"].map((f) => (
                      <li key={f} style={styles.featureItem}>
                        <span style={{ color: "#6c5ce7", marginRight: "8px" }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={handleSubscribe} disabled={subLoading} style={styles.bigUpgradeButton}>
                    {subLoading ? "Redirecting to Paystack..." : "Upgrade to Pro — ₦5,000/month"}
                  </button>
                </div>
              )}

              {!isFreeTier && (
                <div style={{ marginTop: "20px", padding: "16px", background: "rgba(0,184,148,0.05)", border: "1px solid rgba(0,184,148,0.2)", borderRadius: "10px" }}>
                  <p style={{ color: "#00b894", fontSize: "14px" }}>✓ Your subscription is active. Bookings are unlimited.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0f0f12", color: "#fff" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 32px", borderBottom: "1px solid #222" },
  businessName: { fontSize: "20px", fontWeight: "700", marginBottom: "4px" },
  bookingLink: { fontSize: "13px", color: "#6c5ce7", textDecoration: "none" },
  logoutButton: { background: "transparent", border: "1px solid #333", color: "#999", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: "pointer" },
  freeBadge: { background: "#26262c", color: "#999", borderRadius: "20px", padding: "5px 12px", fontSize: "12px" },
  proBadge: { background: "rgba(108,92,231,0.15)", color: "#6c5ce7", borderRadius: "20px", padding: "5px 12px", fontSize: "12px", fontWeight: "700" },
  upgradeBanner: { background: "linear-gradient(135deg, #1a1a2e, #16213e)", borderBottom: "1px solid #6c5ce7", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  upgradeButton: { background: "#6c5ce7", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" },
  nav: { display: "flex", gap: "24px", padding: "16px 32px", borderBottom: "1px solid #222" },
  navItem: { color: "#555", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" },
  navItemActive: { color: "#6c5ce7", fontWeight: "600" },
  badge: { background: "#6c5ce7", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: "700" },
  main: { padding: "32px", maxWidth: "860px", margin: "0 auto" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  sectionTitle: { fontSize: "18px", fontWeight: "700" },
  statsRow: { display: "flex", gap: "12px" },
  stat: { display: "flex", flexDirection: "column", alignItems: "center", background: "#1a1a1f", borderRadius: "10px", padding: "12px 20px" },
  statNum: { fontSize: "22px", fontWeight: "700", color: "#6c5ce7" },
  statLabel: { fontSize: "11px", color: "#999", marginTop: "2px" },
  subheading: { fontSize: "14px", fontWeight: "600", color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" },
  bookingList: { display: "flex", flexDirection: "column", gap: "12px" },
  bookingCard: { background: "#1a1a1f", borderRadius: "12px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  bookingLeft: { display: "flex", gap: "16px", alignItems: "flex-start" },
  bookingDate: { display: "flex", flexDirection: "column", alignItems: "center", background: "#26262c", borderRadius: "8px", padding: "8px 12px", minWidth: "48px" },
  bookingDateNum: { fontSize: "20px", fontWeight: "700", color: "#fff", lineHeight: "1" },
  bookingDateMonth: { fontSize: "11px", color: "#999", marginTop: "2px", textTransform: "uppercase" },
  customerName: { fontSize: "15px", fontWeight: "600", marginBottom: "4px" },
  bookingService: { fontSize: "13px", color: "#6c5ce7", marginBottom: "4px" },
  bookingContact: { fontSize: "12px", color: "#999" },
  bookingNotes: { fontSize: "12px", color: "#666", fontStyle: "italic", marginTop: "4px" },
  bookingRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" },
  statusBadge: { borderRadius: "20px", padding: "4px 10px", fontSize: "12px", fontWeight: "600" },
  actionButtons: { display: "flex", gap: "6px" },
  completeButton: { background: "rgba(0,184,148,0.1)", border: "1px solid rgba(0,184,148,0.3)", color: "#00b894", borderRadius: "6px", padding: "5px 10px", fontSize: "12px", cursor: "pointer" },
  cancelButton: { background: "rgba(255,82,82,0.1)", border: "1px solid rgba(255,82,82,0.3)", color: "#ff5252", borderRadius: "6px", padding: "5px 10px", fontSize: "12px", cursor: "pointer" },
  addButton: { background: "#6c5ce7", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  form: { background: "#1a1a1f", borderRadius: "12px", padding: "20px", marginBottom: "24px", overflow: "hidden" },
  formRow: { display: "flex", gap: "12px", marginBottom: "12px" },
  input: { flex: 1, background: "#26262c", border: "1px solid #333", borderRadius: "8px", padding: "11px 14px", color: "#fff", fontSize: "14px", outline: "none" },
  textarea: { width: "100%", background: "#26262c", border: "1px solid #333", borderRadius: "8px", padding: "11px 14px", color: "#fff", fontSize: "14px", outline: "none", minHeight: "70px", marginBottom: "12px", fontFamily: "inherit", resize: "vertical" },
  submitButton: { background: "#6c5ce7", color: "#fff", border: "none", borderRadius: "8px", padding: "11px 20px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  error: { background: "rgba(255,82,82,0.1)", border: "1px solid rgba(255,82,82,0.3)", color: "#ff5252", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "12px" },
  emptyState: { color: "#666", fontSize: "14px", padding: "40px 0", textAlign: "center" },
  serviceList: { display: "flex", flexDirection: "column", gap: "12px" },
  serviceCard: { background: "#1a1a1f", borderRadius: "12px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  serviceName: { fontSize: "15px", fontWeight: "600", marginBottom: "4px" },
  serviceMeta: { fontSize: "13px", color: "#6c5ce7", marginBottom: "6px" },
  serviceDescription: { fontSize: "13px", color: "#999" },
  deleteButton: { background: "transparent", border: "1px solid #3a1f1f", color: "#ff5252", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" },
  subCard: { background: "#1a1a1f", borderRadius: "16px", padding: "28px" },
  subStatus: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  subPlanName: { fontSize: "18px", fontWeight: "700", marginBottom: "6px" },
  subPlanDesc: { fontSize: "13px", color: "#999" },
  proFeatures: { borderTop: "1px solid #222", paddingTop: "20px" },
  proFeaturesTitle: { fontSize: "15px", fontWeight: "600", marginBottom: "14px" },
  featureList: { listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" },
  featureItem: { fontSize: "14px", color: "#ccc" },
  bigUpgradeButton: { width: "100%", background: "#6c5ce7", color: "#fff", border: "none", borderRadius: "10px", padding: "15px", fontSize: "15px", fontWeight: "700", cursor: "pointer" },
};
