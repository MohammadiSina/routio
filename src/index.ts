// Handler to protect the application from uncaught exception errors
process.on('uncaughtException', (err: Error) => {
  console.error(
    'An uncaught exception error has occurred: ',
    err.name,
    err.message
  );
  console.log('Server is shutting down');
  process.exit(1);
});

import mongoose from 'mongoose';

import app from './app';
import { databaseConstants as dbc, appConstants as ac } from './constants';

// Database connection.
// If the connection to the local database is experiencing delays, the use of "localhost" in the URI might be the cause.
// Instead, employ 127.0.0.1 to ensure that the Node.js app directly accesses IPv4 rather than IPv6 initially.
// https://mongoosejs.com/docs/connections.html

(async function connectDb() {
  try {
    // Check if DB URI exists
    if (!process.env.DB) throw new Error(dbc.URI_INVALID_ERR);

    // Connect to MongoDB database using Mongoose
    const conn = await mongoose.connect(process.env.DB);
    const dbName = conn.connections[0].name;
    console.log(`${dbc.CONNECTION_SUCCESSFUL_MSG} / name: ${dbName}`);
  } catch (err) {
    console.error(dbc.CONNECTION_FAILED_MSG, err);
    process.exit(1);
  }
})();

// Server initializing
const { PORT = 3000 } = process.env;
const server = app.listen(PORT, () =>
  console.log(
    `${ac.SERVER_CONNECTION_MSG} / Port: ${PORT} / Environment: ${process.env.NODE_ENV}`
  )
);

// Handler to protect the application from unhandled rejection errors
process.on('unhandledRejection', (err: Error | unknown) => {
  if (err instanceof Error)
    console.error(ac.APP_UNHANDLED_REJECTION_ERR, err.name, err.message);
  else console.error(ac.APP_UNHANDLED_REJECTION_ERR, err);

  console.log(ac.SERVER_SHUTDOWN_MSG);
  server.close(() => process.exit(1));
});
