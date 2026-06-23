import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import dbConnect from "../../lib/mongodb";
import Business from "../../models/Business";
import Service from "../../models/Service";

export async function getServerSideProps(context) {
  const { slug } = context.params;
  await dbConnect();
  const business = await Business.findOne({ slug }).lean();
  if (!business) {
    return { notFound: true };
  }
  const services = await Service.find({ business: business._id, isActive: true }).lean();
  return {
    props: {
      business: JSON.parse(JSON.stringify(business)),
      services: JSON.parse(JSON.stringify(services)),
    },
  };
}

function getAvailableSlots(workingHours, date, duration) {
  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const dayName = dayNames[new Date(date + "T12:00:00").getDay()];
  const daySchedule = workingHours.find((d) => d.day === dayName);
  if (!daySchedule || !daySchedule.isOpen) return [];
  const slots = [];
  const [openHour, openMin] = daySchedule.open.split(":").map(Number);
  const [closeHour, closeMin] = daySchedule.close.split(":").map(Number);
  let current = openHour * 60 + openMin;
  const end = closeHour * 60 + closeMin;
  while (current + duration <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, "0");
    const m = (current % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += 30;
  }
  return slots;
}

export default function BookingPage({ business, services }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const availableSlots = selectedService && selectedDate
    ? getAvailableSlots(business.workingHours, selectedDate, selectedService.duration)
    : [];

  const handleSubmit = async () => {
    if (!form.name || !form.email) { setError("Name and email are required"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business._id,
          serviceId: selectedService._id,
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          date: selectedDate,
          time: selectedTime,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Something went wrong"); setLoading(false); return; }
      setSuccess(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={styles.successCard}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Booking Confirmed!</h2>
            <p style={styles.successText}>Your appointment at <strong>{business.name}</strong> has been booked for <strong>{selectedDate}</strong> at <strong>{selectedTime}</strong>.</p>
            <p style={styles.successSubtext}>A confirmation has been sent to {form.email}</p>
            <button onClick={() => router.reload()} style={styles.bookAgainButton}>Book another appointment</button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Book at {business.name}</title></Head>
      <div style={styles.page}>
        <div style={styles.container}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={styles.header}>
            <h1 style={styles.businessName}>{business.name}</h1>
            {business.address && <p style={styles.businessAddress}>📍 {business.address}</p>}
            {business.phone && <p style={styles.businessPhone}>📞 {business.phone}</p>}
          </motion.div>

          <div style={styles.steps}>
            {[1,2,3].map((s) => (
              <div key={s} style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ ...styles.stepDot, ...(step >= s ? styles.stepDotActive : {}) }}>{s}</div>
                <span style={{ ...styles.stepLabel, ...(step === s ? styles.stepLabelActive : {}) }}>
                  {s === 1 ? "Service" : s === 2 ? "Date & Time" : "Your Details"}
                </span>
                {s < 3 && <div style={styles.stepLine} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                <h2 style={styles.stepTitle}>Choose a service</h2>
                {services.length === 0 ? (
                  <p style={styles.emptyText}>No services available yet.</p>
                ) : (
                  <div style={styles.serviceList}>
                    {services.map((service) => (
                      <div key={service._id} onClick={() => { setSelectedService(service); setStep(2); }}
                        style={{ ...styles.serviceCard, ...(selectedService?._id === service._id ? styles.serviceCardSelected : {}) }}>
                        <div>
                          <h3 style={styles.serviceName}>{service.name}</h3>
                          {service.description && <p style={styles.serviceDesc}>{service.description}</p>}
                        </div>
                        <div style={styles.serviceMeta}>
                          <span style={styles.servicePrice}>₦{service.price.toLocaleString()}</span>
                          <span style={styles.serviceDuration}>{service.duration} min</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                <h2 style={styles.stepTitle}>Pick a date & time</h2>
                <div style={styles.selectedServiceBadge}>
                  {selectedService?.name} · ₦{selectedService?.price.toLocaleString()} · {selectedService?.duration} min
                </div>
                <label style={styles.label}>Select date</label>
                <input type="date" min={today} max={maxDateStr} value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(""); }}
                  style={styles.dateInput} />
                {selectedDate && availableSlots.length === 0 && <p style={styles.noSlots}>No available slots on this day.</p>}
                {availableSlots.length > 0 && (
                  <>
                    <label style={styles.label}>Select time</label>
                    <div style={styles.slotGrid}>
                      {availableSlots.map((slot) => (
                        <button key={slot} onClick={() => setSelectedTime(slot)}
                          style={{ ...styles.slotButton, ...(selectedTime === slot ? styles.slotButtonSelected : {}) }}>
                          {slot}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <div style={styles.navButtons}>
                  <button onClick={() => setStep(1)} style={styles.backButton}>← Back</button>
                  <button onClick={() => setStep(3)} disabled={!selectedDate || !selectedTime}
                    style={{ ...styles.nextButton, ...(!selectedDate || !selectedTime ? styles.nextButtonDisabled : {}) }}>
                    Continue →
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                <h2 style={styles.stepTitle}>Your details</h2>
                <div style={styles.summaryCard}>
                  <p style={styles.summaryItem}><span style={styles.summaryLabel}>Service</span> {selectedService?.name}</p>
                  <p style={styles.summaryItem}><span style={styles.summaryLabel}>Date</span> {selectedDate}</p>
                  <p style={styles.summaryItem}><span style={styles.summaryLabel}>Time</span> {selectedTime}</p>
                  <p style={styles.summaryItem}><span style={styles.summaryLabel}>Price</span> ₦{selectedService?.price.toLocaleString()}</p>
                </div>
                {error && <div style={styles.error}>{error}</div>}
                <div style={styles.formFields}>
                  <input type="text" placeholder="Your full name *" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} style={styles.input} />
                  <input type="email" placeholder="Email address *" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} style={styles.input} />
                  <input type="tel" placeholder="Phone number (optional)" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} style={styles.input} />
                  <textarea placeholder="Any notes? (optional)" value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })} style={styles.textarea} />
                </div>
                <div style={styles.navButtons}>
                  <button onClick={() => setStep(2)} style={styles.backButton}>← Back</button>
                  <button onClick={handleSubmit} disabled={loading} style={styles.confirmButton}>
                    {loading ? "Booking..." : "Confirm Booking"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: { minHeight:"100vh", background:"#0f0f12", padding:"40px 20px" },
  container: { maxWidth:"600px", margin:"0 auto" },
  header: { marginBottom:"32px", textAlign:"center" },
  businessName: { fontSize:"28px", fontWeight:"800", color:"#fff", marginBottom:"8px" },
  businessAddress: { color:"#999", fontSize:"14px", marginBottom:"4px" },
  businessPhone: { color:"#999", fontSize:"14px" },
  steps: { display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginBottom:"36px", flexWrap:"wrap" },
  stepDot: { width:"28px", height:"28px", borderRadius:"50%", background:"#26262c", color:"#666", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", fontWeight:"700", flexShrink:0 },
  stepDotActive: { background:"#6c5ce7", color:"#fff" },
  stepLabel: { color:"#666", fontSize:"13px" },
  stepLabelActive: { color:"#fff", fontWeight:"600" },
  stepLine: { width:"24px", height:"1px", background:"#333" },
  stepTitle: { color:"#fff", fontSize:"20px", fontWeight:"700", marginBottom:"20px" },
  serviceList: { display:"flex", flexDirection:"column", gap:"12px" },
  serviceCard: { background:"#1a1a1f", border:"2px solid transparent", borderRadius:"12px", padding:"18px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" },
  serviceCardSelected: { borderColor:"#6c5ce7" },
  serviceName: { fontSize:"16px", fontWeight:"600", color:"#fff", marginBottom:"4px" },
  serviceDesc: { fontSize:"13px", color:"#999" },
  serviceMeta: { display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"4px" },
  servicePrice: { fontSize:"16px", fontWeight:"700", color:"#6c5ce7" },
  serviceDuration: { fontSize:"12px", color:"#666" },
  selectedServiceBadge: { background:"#1a1a1f", border:"1px solid #6c5ce7", borderRadius:"8px", padding:"10px 14px", color:"#6c5ce7", fontSize:"13px", fontWeight:"600", marginBottom:"20px" },
  label: { display:"block", color:"#999", fontSize:"13px", marginBottom:"8px", marginTop:"16px" },
  dateInput: { width:"100%", background:"#26262c", border:"1px solid #333", borderRadius:"8px", padding:"12px 14px", color:"#fff", fontSize:"14px", outline:"none" },
  noSlots: { color:"#ff5252", fontSize:"13px", marginTop:"12px" },
  slotGrid: { display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"8px", marginTop:"8px" },
  slotButton: { background:"#26262c", border:"1px solid #333", borderRadius:"8px", padding:"10px", color:"#fff", fontSize:"13px", cursor:"pointer" },
  slotButtonSelected: { background:"#6c5ce7", border:"1px solid #6c5ce7" },
  navButtons: { display:"flex", justifyContent:"space-between", marginTop:"28px" },
  backButton: { background:"transparent", border:"1px solid #333", color:"#999", borderRadius:"8px", padding:"11px 20px", fontSize:"14px", cursor:"pointer" },
  nextButton: { background:"#6c5ce7", color:"#fff", border:"none", borderRadius:"8px", padding:"11px 24px", fontSize:"14px", fontWeight:"600", cursor:"pointer" },
  nextButtonDisabled: { background:"#333", color:"#666", cursor:"not-allowed" },
  summaryCard: { background:"#1a1a1f", borderRadius:"12px", padding:"16px 20px", marginBottom:"20px" },
  summaryItem: { display:"flex", justifyContent:"space-between", color:"#fff", fontSize:"14px", marginBottom:"8px" },
  summaryLabel: { color:"#999" },
  formFields: { display:"flex", flexDirection:"column", gap:"12px" },
  input: { background:"#26262c", border:"1px solid #333", borderRadius:"8px", padding:"12px 14px", color:"#fff", fontSize:"14px", outline:"none" },
  textarea: { background:"#26262c", border:"1px solid #333", borderRadius:"8px", padding:"12px 14px", color:"#fff", fontSize:"14px", outline:"none", minHeight:"80px", fontFamily:"inherit", resize:"vertical" },
  error: { background:"rgba(255,82,82,0.1)", border:"1px solid rgba(255,82,82,0.3)", color:"#ff5252", borderRadius:"8px", padding:"10px 14px", fontSize:"13px", marginBottom:"12px" },
  confirmButton: { background:"#6c5ce7", color:"#fff", border:"none", borderRadius:"8px", padding:"13px 28px", fontSize:"15px", fontWeight:"600", cursor:"pointer" },
  emptyText: { color:"#666", fontSize:"14px", textAlign:"center", padding:"40px 0" },
  successCard: { background:"#1a1a1f", borderRadius:"16px", padding:"48px 40px", textAlign:"center" },
  successIcon: { width:"64px", height:"64px", borderRadius:"50%", background:"rgba(108,92,231,0.2)", color:"#6c5ce7", fontSize:"28px", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" },
  successTitle: { fontSize:"24px", fontWeight:"700", color:"#fff", marginBottom:"12px" },
  successText: { color:"#ccc", fontSize:"15px", lineHeight:"1.6", marginBottom:"8px" },
  successSubtext: { color:"#666", fontSize:"13px", marginBottom:"28px" },
  bookAgainButton: { background:"#6c5ce7", color:"#fff", border:"none", borderRadius:"8px", padding:"12px 24px", fontSize:"14px", fontWeight:"600", cursor:"pointer" },
};
