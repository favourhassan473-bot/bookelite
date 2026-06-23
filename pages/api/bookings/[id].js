import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "../../../lib/mongodb";
import Booking from "../../../models/Booking";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user.businessId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  await dbConnect();

  const { id } = req.query;

  const booking = await Booking.findOne({
    _id: id,
    business: session.user.businessId,
  });

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (req.method === "PUT") {
    const { status } = req.body;
    if (!["confirmed", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    booking.status = status;
    await booking.save();
    return res.status(200).json({ booking });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
