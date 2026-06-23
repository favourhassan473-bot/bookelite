import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "../../../lib/mongodb";
import Service from "../../../models/Service";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user.businessId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  await dbConnect();

  const { id } = req.query;

  const service = await Service.findOne({
    _id: id,
    business: session.user.businessId,
  });

  if (!service) {
    return res.status(404).json({ message: "Service not found" });
  }

  if (req.method === "PUT") {
    const { name, duration, price, description, isActive } = req.body;

    if (name !== undefined) service.name = name;
    if (duration !== undefined) service.duration = duration;
    if (price !== undefined) service.price = price;
    if (description !== undefined) service.description = description;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();
    return res.status(200).json({ service });
  }

  if (req.method === "DELETE") {
    await Service.deleteOne({ _id: id });
    return res.status(200).json({ message: "Service deleted" });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
