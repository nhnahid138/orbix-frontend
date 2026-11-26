# Orbix storefront

Next.js storefront and store administration for the Orbix NestJS commerce API.

## Local development

1. Start PostgreSQL and configure the backend using `backend/.env.example`.
2. Run the backend migrations, including the homepage banner migration:

   ```bash
   cd ../backend
   npm install
   npm run migration:run
   npm run start:dev
   ```

3. Configure the browser API origin before starting the frontend:

   ```bash
   cp .env.example .env.local
   ```

   Set `NEXT_PUBLIC_API_URL` to the backend origin, without `/api/v1` (local default: `http://localhost:4000`). This public value is embedded at build time. Set backend `FRONTEND_URL` and `CORS_ORIGINS` to the exact storefront origin.

4. Start the frontend:

   ```bash
   npm install
   npm run dev
   ```

Create the first administrator through the backend bootstrap settings. Public registration only creates customer accounts.

## Storefront features

- Public product and category browsing, search, product variants, stock display and published reviews.
- Guest bag saved in the browser. An account is required to sync the bag and place an order.
- Customer registration/login with access tokens in memory and rotating refresh cookies kept HTTP-only by the backend.
- Address book, coupons, COD checkout, EPS redirect checkout when the backend reports EPS as configured, payment return state, order history, cancellation, profile and password change.
- Admin dashboard, product creation/archive, audited stock adjustments, categories, orders, coupons, review moderation, customer blocking, audit records and scheduled homepage banner management.

## Production setup and remaining business work

- Set `NEXT_PUBLIC_API_URL` at build time, configure HTTPS, exact backend CORS origins, `FRONTEND_URL`, database backups, monitoring and EPS merchant credentials. Product images uploaded through admin are stored in the backend `UPLOADS_DIR`; mount persistent storage there in production and back it up.
- Run reviewed TypeORM migrations in each environment. Do not enable schema synchronization.
- The backend does not yet implement email verification, password reset, newsletter subscription, shipping zones/rates, tax/VAT, return authorization, EPS refunds or notification delivery. The corresponding storefront copy identifies setup-dependent policies; the owner must publish approved legal, shipping, refund and contact details before taking live orders.
- EPS checkout remains hidden until its complete merchant configuration is enabled. COD remains available.
- The production homepage reads banners and products from the API. If no active banner exists, it renders a branded fallback hero; it does not invent catalog products in production.

## Build and run

```bash
npm run build
npm run start
```

The production build uses Next.js' webpack builder so it does not need Turbopack's local CSS-loader port binding in restricted build environments.
# orbix-frontend
