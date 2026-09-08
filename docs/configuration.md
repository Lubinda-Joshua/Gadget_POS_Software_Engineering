# Configuration

Gadget POS deliberately supports one configuration model for the course release.

## Environment configuration

Database and authentication configuration lives in `.env`; use `.env.example` as the template. Secrets are never stored in the database or repository.

## Business configuration

Administrators can configure the business name, logo URL, colors, currency symbol, decimal places, tax name/rate, receipt footer, loyalty settings, and low-stock threshold. Product image uploads are stored in `public/uploads` on the application server.

## Device configuration

Scanner sounds and receipt-printer preferences are stored in the browser because they belong to a checkout device, not the whole business.

## Constraint

Cloud object storage and serverless deployment are outside the academic MVP. Add either only after recording a new requirement and architecture decision.
