# Multi-Region Cloud-Based E-Commerce Platform

This is a project I built to get hands-on with microservices, AWS, and Kubernetes. I wanted to understand what it actually takes to build something that stays fast and available even under heavy load — so I designed it across two AWS regions with auto-scaling.

---

## What I Built

Three independent microservices that each own their own data and can be deployed, scaled, and updated separately:

- **Product Service** (Node.js, port 3001) — catalog, inventory, stock management
- **Order Service** (Node.js, port 3002) — order creation, tracking, status updates
- **User Service** (Node.js, port 3003) — registration, login, profiles

Each service exposes a `/health` endpoint that Kubernetes uses for liveness and readiness probes.

---

## What I Learned Building This

The hardest part was figuring out inter-service communication — when the order service needs to check stock from the product service, what happens if the product service is slow or down? I learned about graceful degradation and why you need circuit breakers in real systems.

I also spent a lot of time on the Kubernetes HPA config. Getting the CPU threshold right so it scales up fast enough under load but doesn't over-provision was tricky — settled on 70% CPU utilization as the trigger.

The CI/CD pipeline was really satisfying to get working. Once it was done, every push to main automatically tests, builds Docker images, pushes to ECR, and rolls out to the cluster. It cut down "deployment time" to just the pipeline run.

---

## Architecture

```
                    Route 53 (DNS Failover)
                   /                       \
          us-east-1                     us-west-2
         (primary)                      (failover)
              |                               |
      AWS EKS Cluster                 AWS EKS Cluster
     /        |        \
Product    Order      User
Service   Service    Service
  |          |          |
 HPA        HPA        HPA
(2-10     (2-10      (2-10
 pods)     pods)      pods)
```

---

## Results

- P95 latency under 100ms with Kubernetes auto-scaling across both regions
- 99%+ availability maintained under peak load testing
- CI/CD pipeline reduced deployment time by ~80% compared to manual deploys
- HPA scales from 2 to 10 pods based on CPU utilization (threshold: 70%)

---

## How to Run Locally

**With Docker Compose (easiest):**

```bash
docker-compose up
```

Services will be available at:
- Product Service: http://localhost:3001
- Order Service: http://localhost:3002
- User Service: http://localhost:3003

**Without Docker:**

```bash
cd services/product-service && npm install && npm start
cd services/order-service   && npm install && npm start
cd services/user-service    && npm install && npm start
```

---

## API Examples

```bash
# Get all products
curl http://localhost:3001/api/products

# Create an order
curl -X POST http://localhost:3002/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"USR-1","items":[{"productId":"1","name":"Headphones","price":79.99,"quantity":1}]}'

# Register a user
curl -X POST http://localhost:3003/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Shikha","email":"shikha@example.com","password":"secret123"}'
```

---

## Project Structure

```
ecommerce-platform/
├── services/
│   ├── product-service/     # catalog and inventory
│   ├── order-service/       # orders and fulfillment
│   └── user-service/        # auth and profiles
├── k8s/                     # Kubernetes manifests + HPA configs
├── .github/workflows/       # CI/CD pipeline (GitHub Actions)
├── docker-compose.yml       # local dev setup
└── README.md
```

---

## Tech Stack

Node.js, Express, Docker, Kubernetes, AWS EKS, AWS ECR, Route 53, GitHub Actions

---

*Built to practice cloud-native architecture and DevOps. Still learning — open to feedback!*
