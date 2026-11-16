# H-Tracker

A rental-property application with a responsive frontend served by the existing Express server.

## Run locally

1. Install dependencies with `npm install`.
2. Configure the existing MySQL connection and `JWT_SECRET` in `.env`.
3. Run `npm start` and open `http://localhost:7000` (or the configured `PORT`).

The home page loads listings from `GET /properties/getallproperties`. If the API or database is unavailable, it displays clearly labeled example homes instead. A successful empty response shows an empty state. Search and filters work on the loaded listings. Saved homes are stored on the current device; they are not synced to an account. Login and registration use the existing user endpoints. Property contact and rental requests are not yet connected in the frontend.

The property listing query expects the `properties`, `property_images`, `location`, and `htracker` tables. The existing `db/table.js` creates the additional property tables but assumes the core user and location tables already exist.
