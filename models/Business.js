import mongoose from "mongoose";

const BusinessSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    default: "",
  },
  logo: {
    type: String,
    default: "",
  },
  phone: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "",
  },
  workingHours: {
    type: [
      {
        day: String,
        open: String,
        close: String,
        isOpen: Boolean,
      },
    ],
    default: [
      { day: "Monday", open: "09:00", close: "18:00", isOpen: true },
      { day: "Tuesday", open: "09:00", close: "18:00", isOpen: true },
      { day: "Wednesday", open: "09:00", close: "18:00", isOpen: true },
      { day: "Thursday", open: "09:00", close: "18:00", isOpen: true },
      { day: "Friday", open: "09:00", close: "18:00", isOpen: true },
      { day: "Saturday", open: "10:00", close: "16:00", isOpen: true },
      { day: "Sunday", open: "00:00", close: "00:00", isOpen: false },
    ],
  },
  subscriptionStatus: {
    type: String,
    enum: ["free", "active", "past_due", "cancelled"],
    default: "free",
  },
  subscriptionPlan: {
    type: String,
    default: null,
  },
  subscriptionRenewsAt: {
    type: Date,
    default: null,
  },
  bookingsThisMonth: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Business ||
  mongoose.model("Business", BusinessSchema);
