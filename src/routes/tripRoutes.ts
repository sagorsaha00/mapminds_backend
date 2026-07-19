import { Router } from 'express';
import { getTrips, getTripById, createTrip, getMyTrips, deleteTrip } from '../controllers/tripController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', getTrips);
router.get('/mine', getMyTrips);
router.get('/:id', getTripById);
router.post('/', createTrip);
router.delete('/:id', deleteTrip);

export default router;
