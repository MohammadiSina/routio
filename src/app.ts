import express from 'express';
import dotenv from 'dotenv';

import globalErrorHandler from './controllers/globalErrorController';
import { problemRouter } from './routes';
import { appConstants as ac } from './constants';

// Load environment variables from .env file
dotenv.config({ path: './.env' });

const app = express();

// Section: Middlewares
// Express built-in body parser
app.use(express.json());

// Section: Routes
app.use(`${ac.APP_API_BASE_ROUTE}/problems`, problemRouter);

// Global error handler middleware function for handling errors that occur during request processing.
// It catches and processes errors that propagate through the Express middleware chain.
// Errors are passed to the global error controller for centralized error handling.
app.use(globalErrorHandler);

export default app;
