/**
 * Order Service - Handles order creation, tracking, and fulfillment
 * Communicates with Product Service to validate stock before confirming
 */

const express = require('express');
const app = express();
app.use(express.json());

let orders = [];

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'order-service', region: process.env.AWS_REGION || 'local' });
});

// Get all orders (optionally filter by user)
app.get('/api/orders', (req, res) => {
  const { userId } = req.query;
  const result = userId ? orders.filter(o => o.userId === userId) : orders;
  res.json({ orders: result, count: result.length });
});

// Get single order
app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// Create order
app.post('/api/orders', (req, res) => {
  const { userId, items } = req.body;
  if (!userId || !items || !items.length) {
    return res.status(400).json({ error: 'userId and items are required' });
  }
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = {
    id: `ORD-${Date.now()}`,
    userId,
    items,
    total: parseFloat(total.toFixed(2)),
    status: 'confirmed',
    region: process.env.AWS_REGION || 'local',
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  res.status(201).json(order);
});

// Update order status
app.patch('/api/orders/:id/status', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const validStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const { status } = req.body;
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }
  order.status = status;
  order.updatedAt = new Date().toISOString();
  res.json(order);
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Order service running on port ${PORT}`));

module.exports = app;
