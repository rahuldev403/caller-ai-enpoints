# Webhook Service

A lightweight, idempotent web service built with **Express.js** and **TypeScript** to process and store incoming call-ended webhooks. The application uses an in-memory map to guarantee strict idempotency—ensuring duplicate webhook deliveries with the same `call_id` return a successful response without modifying or duplicating stored records. It provides a `POST /call-ended` endpoint for ingesting webhook payloads, a `GET /calls/:call_id` endpoint for retrieving records, and automated test coverage powered by **Jest** and **Supertest**.

## Quick Start

```bash
# Install dependencies
npm install

# Run automated tests
npm test

# Start the server locally
npx ts-node src/server.ts
