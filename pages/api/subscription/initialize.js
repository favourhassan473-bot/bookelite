import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "../../../lib/mongodb";
import Business from "../../../models/Business";
import User from "../../../models/User";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user.businessId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  await dbConnect();

  const user = await User.findById(session.user.id);
  const business = await Business.findById(session.user.businessId);

  if (!user || !business) {
    return res.status(404).json({ message: "User or business not found" });
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: 500000,
      currency: "NGN",
      metadata: {
        businessId: business._id.toString(),
        businessName: business.name,
      },
      callback_url: `${process.env.NEXTAUTH_URL}/dashboard?subscribed=true`,
    }),
  });

  const data = await response.json();

  if (!data.status) {
    return res.status(500).json({ message: "Failed to initialize payment" });
  }

  return res.status(200).json({
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
  });
}
