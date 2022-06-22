import { Response,  } from "express";

export function sendError(res: Response, error: Error) {

}

export function sendSuccess(res: Response, body: any, others?: string | Record<string, any>, status: number = 200) {

}