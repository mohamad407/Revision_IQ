import dns from 'node:dns/promises';
import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';

// 1. Only enforce custom public DNS servers locally. 
// Do NOT overwrite system DNS when running live on Render production nodes.
if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

const PORT = process.env.PORT || 5000;

// 2. Base API informational route
app.get('/', (req, res) => {
  res.json({ success: true, message: "Welcome to the RevisionIQ API!" });
});

async function start() {
  try {
    await connectDB();
    
    // 3. Bind to '0.0.0.0' to open internal networking ports to Render's gateway proxy
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`RevisionIQ API listening on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Database connection failed to start: ${error.message}`);
    process.exit(1);
  }
}

start();
