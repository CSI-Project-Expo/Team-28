import { Router } from 'express';
import { login } from '../controllers/authController';

export const authRouter = Router();

// POST /api/login
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await login(username, password);
    res.json({ token: 'some-token' });
  } catch (error) {
    if (error.status === 401) {
      res.status(401).json({ error: 'Invalid username or password' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});