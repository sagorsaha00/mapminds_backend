import mongoose, { Schema, Document } from 'mongoose';

export interface ITrip extends Document {
  title: string;
  destination: string;
  shortDescription: string;
  fullDescription: string;
  images: string[];
  price: number;
  duration: number;
  rating: number;
  category: string;
  location: {
    country: string;
    city: string;
  };
  itinerary: { day: number; title: string; details: string }[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const tripSchema = new Schema<ITrip>(
  {
    title: { type: String, required: true, trim: true },
    destination: { type: String, required: true },
    shortDescription: { type: String, required: true, maxlength: 200 },
    fullDescription: { type: String, required: true },
    images: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 1 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    category: { type: String, required: true },
    location: {
      country: { type: String, required: true },
      city: { type: String, required: true },
    },
    itinerary: [
      {
        day: Number,
        title: String,
        details: String,
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ITrip>('Trip', tripSchema);
