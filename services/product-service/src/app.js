/**
 * Product Service - Handles product catalog, inventory, and search
 * Part of the Multi-Region E-Commerce Platform
 */

const express = require('express');
const app = express();
app.use(express.json());

// In-memory store (swap out for RDS/DynamoDB in production)
let products = [
  { id: '1', name: 'Wireless Headphones', price: 79.99, stock: 150, category: 'electronics', region: 'us-east-1' },
  { id: '2', name: 'Running Shoes',       price: 59.99, stock: 200, category: 'footwear',    region: 'us-east-1' },
  { id: '3', name: 'Coffee Maker',        price: 49.99, stock: 80,  category: 'kitchen',     region: 'us-west-2' },
];

// Health check — used by Kubernetes liveness/readiness probes
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'product-service', region: process.env.AWS_REGION || 'local' });
});

// Get all products (optional category/region filter)
app.get('/api/products', (req, res) => {
  const { category, region } = req.query;
  let result = products;
  if (category) result = result.filter(p => p.category === category);
  if (region)   result = result.filter(p => p.region === region);
  res.json({ products: result, count: result.length });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Add product
app.post('/api/products', (req, res) => {
  const { name, price, stock, category } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'name and price are required' });
  const product = {
    id: String(products.length + 1),
    name, price,
    stock: stock || 0,
    category: category || 'general',
    region: process.env.AWS_REGION || 'local',
    createdAt: new Date().toISOString()
  };
  products.push(product);
  res.status(201).json(product);
});

// Decrement stock — called by order service after a purchase
app.patch('/api/products/:id/stock', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const { quantity } = req.body;
  if (product.stock < quantity) return res.status(409).json({ error: 'Insufficient stock' });
  product.stock -= quantity;
  res.json({ id: product.id, remaining_stock: product.stock });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Product service running on port ${PORT}`));

module.exports = app;
