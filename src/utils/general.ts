import { HttpStatusCode } from '../constants';
import AppError from './appError';

/**
 * Throws an error with the specified message and optional HTTP status code.
 * @param {string} message - The error message to throw.
 * @param {HttpStatusCode} [statusCode] - The optional HTTP status code for the error.
 * @throws {AppError | Error} Throws an AppError with the specified status code, if provided, otherwise throws a regular Error.
 * @returns {never} This function never returns a value, as it always throws an error.
 */
export const raise = (message: string, statusCode?: HttpStatusCode): never => {
  if (statusCode) throw new AppError(statusCode, message);
  throw new Error(message);
};

/**
 * Generates a random integer within the specified range (both max and min included).
 * @param {number} min - The minimum value of the range (inclusive).
 * @param {number} max - The maximum value of the range (inclusive).
 * @returns {number} A random integer within the specified range.
 */
export const random = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Calculate the factorial of a given number.
 * @param {number} num - The number to calculate the factorial for.
 * @returns {number} The factorial of the given number.
 */
export const fact = (num: number): number => {
  if (num == 0 || num == 1) return 1;
  else return num * fact(num - 1);
};

/**
 * Capitalizes the first letter of each word in a string.
 * @param {string} str - The input string to capitalize.
 * @returns {string} The capitalized string.
 */
export const capitalize = (str: string): string => {
  // Return empty string if input is falsy
  if (!str) return str;

  // Capitalize the first letter of each word in the string
  return str
    .split(/\s+/) // Split the string into words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
    .join(' '); // Join the capitalized words back into a string
};
