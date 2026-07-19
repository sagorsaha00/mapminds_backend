import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  authProvider: 'local' | 'google';
  googleId?: string;
  preferences: {
    interests: string[];
    budgetRange: string;
    travelStyle: string;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: {
      type: String,
      required: function (this: IUser) {
        return this.authProvider === 'local';
      },
      minlength: 6,
      select: false,
    },
    avatar: { type: String, default: '' },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, default: null },
    preferences: {
      interests: { type: [String], default: [] },
      budgetRange: { type: String, default: 'moderate' },
      travelStyle: { type: String, default: 'balanced' },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
