import { useState } from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });

    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div style={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={styles.card}
      >
        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Log in to manage your bookings.</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
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
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p style={styles.footerText}>
          Don't have an account?{" "}
          <a href="/signup" style={styles.link}>
            Sign up
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
