import { Request, Response } from "express";
import { env } from "../config/env";
import { AuthService } from "../services/auth.service";

export class AuthController {
  constructor(private readonly authService = new AuthService()) {}

  register = async (req: Request, res: Response) => {
    const result = await this.authService.register(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      ...result,
    });
  };

  login = async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body);

    res.status(200).json({
      success: true,
      message: "Login successful",
      ...result,
    });
  };

  providers = async (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        google: Boolean(
          env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL,
        ),
      },
    });
  };

  me = async (req: Request, res: Response) => {
    const user = await this.authService.getProfile(req.user!.userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  };

  ssoCallback = async (req: Request, res: Response) => {
    const result = req.user as unknown as Awaited<ReturnType<AuthService["loginWithSso"]>>;
    const params = new URLSearchParams({
      token: result.token,
      user: JSON.stringify(result.user),
    });

    res.redirect(`${env.FRONTEND_URL}/oauth/callback?${params.toString()}`);
  };
}
