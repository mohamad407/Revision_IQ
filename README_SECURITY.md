# RevisionIQ — security hardening notes (v0.2.0)

See the accompanying Word document for the full report. Quick start:

    cd server && cp .env.example .env && npm install && npm run dev
    cd client && cp .env.example .env && npm install && npm run dev

Production checklist
- Set CLIENT_ORIGIN to your exact frontend URL(s) (the API refuses to boot without it in production).
- Rotate any secrets that were ever committed (Mongo, Cloudinary, Gemini, Firebase service account).
- Restrict your Firebase Web API key by HTTP referrer in Google Cloud Console.
- Existing documents uploaded before this release remain PUBLIC on Cloudinary until re-uploaded
  or migrated (see report, section "Migration").
- Vercel serverless limits request bodies to ~4.5MB: for 20MB PDFs host the API on Render/Railway/Fly.
