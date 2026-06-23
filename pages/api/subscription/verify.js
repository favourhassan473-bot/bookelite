import dbConnect from "../../../lib/mongodb";
import Business from "../../../models/Business";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ message: "Reference is required" });
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  });

  const data = await response.json();

  if (!data.status || data.data.status !== "success") {
    return res.status(400).json({ message: "Payment verification failed" });
  }

  await dbConnect();

  const { businessId } = data.data.metadata;

  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + 1);

  await Business.findByIdAndUpdate(businessId, {
    subscriptionStatus: "active",
    subscriptionPlan: "pro",
    subscriptionRenewsAt: renewsAt,
    bookingsThisMonth: 0,
  });

  return res.status(200).json({ message: "Subscription activated successfully" });
}
