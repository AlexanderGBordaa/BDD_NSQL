import mongoose from "mongoose";

const HeroSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    realName: { type: String, trim: true, maxlength: 80 },
    appearanceYear: { type: Number, required: true, min: 1900, max: 2100 },
    house: { type: String, required: true, enum: ["marvel", "dc"] },
    biography: { type: String, required: true, maxlength: 1000 },
    equipment: { type: [String], default: [] },
    images: {
      type: [String],
      validate: [(v) => Array.isArray(v) && v.length >= 1, "Debe tener al menos una imagen"],
    },
  },
  { timestamps: true },
);

export const Hero = mongoose.model("Hero", HeroSchema);
