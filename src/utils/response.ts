import { Response } from "express";

export class ServiceError extends Error {
  constructor(public readonly statusCode: number, public message: string) {
    super(message);
  }
}

/**
 * Formats error and sends response.
 * @param res server response object
 * @param error server error object
 */
export function sendError(res: Response, error: ServiceError) {
  if (!error.statusCode || error.statusCode >= 500) {
    console.error(error);
  }

  res.status(error.statusCode || 500).send({
    message: error.message,
    success: false,
  });
}
