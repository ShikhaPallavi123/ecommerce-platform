/**
 * User Service - Registration, login, and profile management
 * In production: replace token generation with signed JWTs and use bcrypt for passwords
 */

const express = require('express');
const crypto  = require('crypto');
const app     = express();
app.use(express.json());

let users = [];

const hashPassword = pwd => crypto.createHash('sha256').update(pwd).digest('hex');

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'user-service' });
});

// Register
app.post('/api/users/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password and name are required' });
  }
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const user = {
    id: `USR-${Date.now()}`,
    name, email,
    password: hashPassword(password),
    createdAt: new Date().toISOString()
  };
  users.push(user);
  const { password: _, ...safeUser } = user;
  res.status(201).json(safeUser);
});

// Login
app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === hashPassword(password));
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = crypto.randomBytes(32).toString('hex');
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, token, message: 'Login successful' });
});

// Get profile
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`User service running on port ${PORT}`));

module.exports = app;
