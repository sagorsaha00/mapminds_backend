import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';
import { generateToken } from '../utils/generateToken';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
console.log('google id ', process.env.GOOGLE_CLIENT_ID)

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    console.log("details", name, email)
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }
    const user = await User.create({ name, email, password });
    const token = generateToken(user.id);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, preferences: user.preferences },
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = generateToken(user.id);
    res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, preferences: user.preferences },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: (error as Error).message });
  }
};

export const demoLogin = async (req: Request, res: Response) => {
  try {
    const demoEmail = 'demo@trailmind.ai';
    let user = await User.findOne({ email: demoEmail });
    if (!user) {
      user = await User.create({
        name: 'Demo Traveler',
        email: demoEmail,
        password: 'Demo@1234',
        preferences: { interests: ['beaches', 'hiking'], budgetRange: 'moderate', travelStyle: 'adventure' },
      });
    }
    const token = generateToken(user.id);
    res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, preferences: user.preferences },
    });
  } catch (error) {
    res.status(500).json({ message: 'Demo login failed', error: (error as Error).message });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    console.log('credential', credential)
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    console.log("ticket", ticket)
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        name: payload.name || 'Traveler',
        email: payload.email,
        authProvider: 'google',
        googleId: payload.sub,
        avatar: payload.picture || '',
      });
    }

    const token = generateToken(user.id);
    res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, preferences: user.preferences },
    });
  } catch (error) {
    res.status(401).json({ message: 'Google login failed', error: (error as Error).message });
  }
};
