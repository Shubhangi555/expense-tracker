import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { createUser, findUser } from '../models/user';

const router = Router(); // Router = mini express app for grouping routes

router.post('/register', async (req, res) => {
  const { username, password, displayName } = req.body; // req.body = JSON the frontend sent

  // Basic validation before hitting the DB
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const user = await createUser(username, password, displayName);

    // Create JWT token with user info baked in
    const token = jwt.sign(
      { userId: user.id, username: user.username }, // payload (what's inside the token)
      process.env.JWT_SECRET!,                       // secret (signs the token)
      { expiresIn: '7d' }                            // expiry
    );

    res.status(201).json({ token, user }); // 201 = Created
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  try {
    const user = await findUser(username, password); // checks DB + verifies password

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({ token, user }); // 200 = OK (default)
  } catch (err) {
    res.status(401).json({ error: (err as Error).message }); // 401 = Unauthorized
  }
});

export default router;