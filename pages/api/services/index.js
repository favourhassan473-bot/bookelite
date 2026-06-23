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

  if (req.method === "GET") {
    const services = await Service.find({
      business: session.user.businessId,
    }).sort({ createdAt: -1 });
    return res.status(200).json({ services });
  }

  if (req.method === "POST") {
    const { name, duration, price, description } = req.body;

    if (!name || !duration || !price) {
      return res
        .status(400)
        .json({ message: "Name, duration, and price are required" });
    }

    const service = await Service.create({
      business: session.user.businessId,
      name,
      duration,
      price,
      description: description || "",
    });

    return res.status(201).json({ service });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
