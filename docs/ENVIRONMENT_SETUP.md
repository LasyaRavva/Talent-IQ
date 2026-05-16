# Environment Setup

Talent IQ now supports a shared root `.env` file so the frontend and backend can be configured together.

## Recommended Setup

Create a single `.env` in the repository root using `.env.example` as the template.

This is the best option for:

- one-site deployment
- one-domain frontend and backend hosting
- simpler environment management

## How It Works

- the backend reads the root `.env` first
- the backend then reads `backend/.env` for any missing values
- the frontend reads shared values from the root `.env`
- the frontend can still use `frontend/.env` to override `VITE_*` values locally

## Priority Rules

- shared values belong in the root `.env`
- backend-only fallback values can stay in `backend/.env`
- frontend-only fallback values can stay in `frontend/.env`

## Important Frontend Variables

The frontend only exposes variables that start with `VITE_`, for example:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_API_URL`
- `VITE_STREAM_API_KEY`
- `VITE_PUBLIC_APP_URL`

## Production Note

For same-domain deployment, `VITE_API_URL` can be omitted so the frontend uses the current site origin for `/api` requests.
