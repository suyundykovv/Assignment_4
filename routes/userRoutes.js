const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');

router.get('/', (req, res) => {
  res.render('index');
});
module.exports = router;

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { error: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('login', { error: 'Invalid email or password.' });
    }

    // Save user session
    req.session.user = user;
    res.redirect('/dashboard');
  } catch (err) {
    res.render('login', { error: 'An unexpected error occurred.' });
  }
});

// Register page
router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

const { body, validationResult } = require('express-validator');

router.post('/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('register', { error: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.render('register', { error: 'Email already exists' });
      }

      const user = new User({ name, email, password });
      await user.save();
      res.redirect('/login');
    } catch (err) {
      console.error('Registration error:', err);
      res.render('register', { error: 'Registration failed. Please try again.' });
    }
  }
);
router.get('/dashboard', (req, res) => {
  if (req.session && req.session.user) {
    res.render('dashboard', { user: req.session.user });
  } else {
    res.redirect('/login');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/dashboard');
    }
    res.redirect('/');
  });
});

module.exports = router;
