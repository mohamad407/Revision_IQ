import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '8.8.4.4']);


import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => {
  res.json({ success: true, message: "Welcome to the RevisionIQ API!" });
});

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`RevisionIQ API listening on port ${PORT}`);
  });
}
