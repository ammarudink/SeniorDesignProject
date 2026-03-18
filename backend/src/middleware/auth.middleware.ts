import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "../utils/api-error";

type TokenPayload = {
  sub: number;
  email: string;
  role: string;
  name: string;
};

const extractToken = (req: Request) => {
  const authorization = req.headers.authorization ?? req.headers.authentication;

  if (!authorization || Array.isArray(authorization)) {
    return null;
  }

  if (authorization.startsWith("Bearer ")) {
    return authorization.slice(7);
  }

  return authorization;
};

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    next(new ApiError(401, "Authentication token is missing"));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as unknown as TokenPayload;

    req.user = {
      userId: Number(payload.sub),
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };

    next();
  } catch {
    next(new ApiError(401, "Invalid or expired authentication token"));
  }
};
