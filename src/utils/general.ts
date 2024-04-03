import { HttpStatusCode } from '../constants';
import AppError from './appError';

export const capitalize = (str: string): string => {
  if (!str) return str;

  return str
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const raise = (message: string, statusCode?: HttpStatusCode): never => {
  if (statusCode) throw new AppError(statusCode, message);
  throw new Error(message);
};
