import dns from 'node:dns/promises';
import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';

// Only use Google DNS locally. Skip it when NODE_ENV is 'production' on Render.
if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.json({ success: true, message: "Welcome to the RevisionIQ API!" });
});

async function start() {
  await connectDB();
  // Listen on 0.0.0.0 to safely open the container ports to Render's gateway
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`RevisionIQ API listening on port ${PORT}`);
  });
}

start();
