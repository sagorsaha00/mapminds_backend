import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const uri = 'mongodb+srv://mrartimas24_db_user:C8w537TgFpxvEHvl@travel.csdoxck.mongodb.net/?appName=travel'
    console.log("uri", uri)
    if (!uri) throw new Error('MONGO_URI is not defined in environment variables');
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
