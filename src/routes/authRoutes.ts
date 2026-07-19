import { Router } from 'express';
import { register, login, demoLogin, googleLogin } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.post('/google', googleLogin);

export default router;
