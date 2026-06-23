import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    businessName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push("/login");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={styles.card}
      >
        <h1 style={styles.title}>Create your BookElite account</h1>
        <p style={styles.subtitle}>
          Set up your business in a couple of minutes.
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            name="name"
            placeholder="Your full name"
            value={form.name}
            onChange={handleChange}
            style={styles.input}
            required
          />
          <input
            type="text"
            name="businessName"
            placeholder="Business name"
            value={form.businessName}
            onChange={handleChange}
            style={styles.input}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            style={styles.input}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            style={styles.input}
            required
          />
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account?{" "}
          <a href="/login" style={styles.link}>
            Log in
          </a>
        </p>
      </motion.div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f0f12",
    padding: "20px",
  },
  card: {
    background: "#1a1a1f",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
  },
  title: {
    color: "#fff",
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "8px",
  },
  subtitle: { color: "#999", fontSize: "14px", marginBottom: "24px" },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  input: {
    background: "#26262c",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "12px 14px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
  },
  button: {
    background: "#6c5ce7",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "13px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "6px",
  },
  error: {
    background: "rgba(255,82,82,0.1)",
    border: "1px solid rgba(255,82,82,0.3)",
    color: "#ff5252",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    marginBottom: "16px",
  },
  footerText: {
    color: "#999",
    fontSize: "13px",
    marginTop: "20px",
    textAlign: "center",
  },
  link: { color: "#6c5ce7", textDecoration: "none", fontWeight: "600" },
};
