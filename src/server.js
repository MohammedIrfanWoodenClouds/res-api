const app = require('./app');
const connectDB = require('./config/db');
const seed = require('./seed/superAdmin');

const port = Number(process.env.PORT || 5000);
const host = process.env.HOST || '0.0.0.0';

(async () => {
  try {
    await connectDB();
    await seed();
    app.listen(port, host, () => console.log(`API running on http://${host}:${port}`));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
