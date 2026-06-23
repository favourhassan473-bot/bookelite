import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "../../../lib/mongodb";
import Business from "../../../models/Business";
import Booking from "../../../models/Booking";
import Service from "../../../models/Service";

const FREE_TIER_LIMIT = 20;

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user.businessId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { status, date } = req.query;
    const filter = { business: session.user.businessId };
    if (status) filter.status = status;
    if (date) filter.date = date;
    const bookings = await Booking.find(filter)
      .populate("service", "name duration price")
      .sort({ date: -1, time: -1 });
    return res.status(200).json({ bookings });
  }

  if (req.method === "POST") {
    const { businessId, serviceId, customerName, customerEmail, customerPhone, date, time, notes } = req.body;

    if (!businessId || !serviceId || !customerName || !customerEmail || !date || !time) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: "Business not found" });

    if (business.subscriptionStatus === "free" && business.bookingsThisMonth >= FREE_TIER_LIMIT) {
      return res.status(403).json({
        message: "Free tier limit reached",
        limitReached: true,
        businessSlug: business.slug,
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const existingBooking = await Booking.findOne({
      business: businessId,
      date,
      time,
      status: "confirmed",
    });
    if (existingBooking) {
      return res.status(400).json({ message: "This time slot is already booked. Please choose another time." });
    }

    const booking = await Booking.create({
      business: businessId,
      service: serviceId,
      customerName,
      customerEmail,
      customerPhone: customerPhone || "",
      date,
      time,
      notes: notes || "",
      status: "confirmed",
    });

    await Business.findByIdAndUpdate(businessId, { $inc: { bookingsThisMonth: 1 } });

    return res.status(201).json({ booking });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
