# ShobPai E-Commerce — NestJS REST API

Scalable, high-performance REST API backend for the ShobPai Modern Full-Stack E-Commerce platform. Built with NestJS, Prisma ORM, and Neon Serverless PostgreSQL.

---

## Features
- **Prisma & Neon PostgreSQL**: Serverless PostgreSQL with pooling and migrations.
- **Firebase Auth**: Bearer token authentication and role-based access control (`ADMIN` and `USER`).
- **REST APIs**: Products, Categories, Orders, Cart/Checkout, Coupons, Wishlist, Reviews, and Admin Analytics.
- **Swagger Documentation**: Interactive OpenAPI documentation available at `/api/docs`.
- **Vercel Serverless Ready**: Native deployment support via `vercel.json`.

---

## Deploying to Vercel

### 1. Import Repository
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Import `rohan26ir/Nest.js-Backend-ShobPai-Ecommerce`.

### 2. Configure Environment Variables
In the **Environment Variables** section on Vercel, add the following:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Pooled Neon PostgreSQL connection string | `postgresql://neondb_owner:...@ep-...-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | Direct Neon PostgreSQL connection string | `postgresql://neondb_owner:...@ep-...us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `FIREBASE_PROJECT_ID` | Firebase project identifier | `shonpai-ecommerce` |
| `ADMIN_EMAILS` | Comma-separated admin email list | `rohan26ir@gmail.com,admin@shobpai.com` |
| `CORS_ORIGIN` | Allowed frontend origin URL(s) | `https://your-frontend.vercel.app,http://localhost:3000` |
| `NODE_ENV` | Environment mode | `production` |

### 3. Deploy
Click **Deploy**. Vercel will automatically run:
```bash
npm install
prisma generate
nest build
```

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env

# 3. Generate Prisma client & sync schema
npm run prisma:generate
npm run prisma:push

# 4. Start local development server
npm run start:dev
```
- API Base URL: `http://localhost:5000/api`
- Swagger Docs: `http://localhost:5000/api/docs`
