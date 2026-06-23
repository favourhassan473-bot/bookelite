import dbConnect from "../../../lib/mongodb";
import User from "../../../models/User";
import Business from "../../../models/Business";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { name, email, password, businessName } = req.body;

    if (!name || !email || !password || !businessName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "An account with this email already exists" });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
    });

    const slug =
      businessName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Math.random().toString(36).slice(2, 6);

    const business = await Business.create({
      owner: user._id,
      name: businessName,
      slug,
    });

    return res.status(201).json({
      message: "Account created successfully",
      businessSlug: business.slug,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong. Please try again." });
  }
}
