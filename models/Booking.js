import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
  },
  customerPhone: {
    type: String,
    default: "",
  },
  date: {
    type: String, // 'YYYY-MM-DD'
    required: true,
  },
  time: {
    type: String, // 'HH:MM'
    required: true,
  },
  status: {
    type: String,
    enum: ["confirmed", "cancelled", "completed"],
    default: "confirmed",
  },
  notes: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Booking ||
  mongoose.model("Booking", BookingSchema);
