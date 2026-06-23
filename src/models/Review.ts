import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  _id: Types.ObjectId;
  movieId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number; // 0.5 - 5
  text: string;
  isCritic: boolean; // rol del autor al momento de la resena
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 0.5, max: 5 },
    text: { type: String, default: '', maxlength: 2000 },
    isCritic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Una resena por usuario y titulo.
ReviewSchema.index({ movieId: 1, userId: 1 }, { unique: true });

export const Review = model<IReview>('Review', ReviewSchema);
