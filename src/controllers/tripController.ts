import { Request, Response } from 'express';
import Trip from '../models/Trip';
import { AuthRequest } from '../middleware/auth';

export const getTrips = async (req: Request, res: Response) => {
  try {
    const { search, category, minPrice, maxPrice, sort, page = 1, limit = 8 } = req.query;
    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {
        ...(minPrice ? { $gte: Number(minPrice) } : {}),
        ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
      };
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const [trips, total] = await Promise.all([
      Trip.find(filter)
        .sort(sortOption)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Trip.countDocuments(filter),
    ]);

    res.status(200).json({
      trips,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch trips', error: (error as Error).message });
  }
};

export const getTripById = async (req: Request, res: Response) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    const related = await Trip.find({ category: trip.category, _id: { $ne: trip._id } }).limit(4);
    res.status(200).json({ trip, related });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch trip', error: (error as Error).message });
  }
};

export const createTrip = async (req: any, res: Response) => {
  try {
    console.log('API Hit: createTrip');
    console.log('URL Params:', req.params);
    console.log('Request Body:', req.body);


    const userId = req.params.userId || req.params.id;

    if (!userId) {
      return res.status(400).json({
        message: 'Bad Request. User ID is missing from URL parameters.'
      });
    }

    // ২. req.body এর সাথে স্কিমার রিকোয়ার্ড createdBy ফিল্ডটি যুক্ত করা
    const tripData = {
      ...req.body,
      createdBy: userId
    };

    const trip = await Trip.create(tripData);

    return res.status(201).json(trip);
  } catch (error) {
    console.error('Error in createTrip:', error);

    return res.status(500).json({
      message: 'Failed to create trip',
      error: (error as Error).message
    });
  }
}

export const getMyTrips = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required in query parameters' });
    }
    const trips = await Trip.find({ createdBy: userId }).sort({ createdAt: -1 });

    return res.status(200).json(trips);
  } catch (error) {
    console.error('Error in getMyTrips:', error);
    return res.status(500).json({
      message: 'Failed to fetch your trips',
      error: (error as Error).message
    });
  }
};

export const deleteTrip = async (req: AuthRequest, res: Response) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    await trip.deleteOne();
    res.status(200).json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete trip', error: (error as Error).message });
  }
};
