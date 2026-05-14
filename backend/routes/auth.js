const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name || !['patient', 'coach'].includes(role)) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  if (password.length < 8) return res.status(400).json({ error: 'Password too short' });
  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await db.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1,$2,$3,$4) RETURNING id,email,name,role',
      [email.toLowerCase(), hash, name, role]
    );
    const user = rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Invalid input' });
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
