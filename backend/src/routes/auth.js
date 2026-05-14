const express = require('express');
const jwt = require('jsonwebtoken');
const { usersMap, generateId, bcrypt, persistUsers } = require('../config/dataStore');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    if (usersMap.get(email)) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const _id = generateId();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      _id,
      email,
      password: hashedPassword,
      name,
      preferredLanguage: 'en',
      createdAt: new Date().toISOString()
    };

    usersMap.set(email, user);
    persistUsers();   // ← save to disk immediately

    res.status(201).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      preferredLanguage: user.preferredLanguage,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = usersMap.get(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        email: user.email,
        name: user.name,
        preferredLanguage: user.preferredLanguage,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = usersMap.get(req.user.email);
  if (user) {
    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      preferredLanguage: user.preferredLanguage,
      token: generateToken(user._id)
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = usersMap.get(req.user.email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = req.body.name || user.name;
    user.preferredLanguage = req.body.preferredLanguage || user.preferredLanguage;
    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    usersMap.set(req.user.email, user);
    persistUsers();   // ← save to disk

    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      preferredLanguage: user.preferredLanguage,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
