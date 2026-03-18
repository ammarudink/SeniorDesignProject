import { Request, Response } from "express";
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

  me = async (req: Request, res: Response) => {
    const user = await this.authService.getProfile(req.user!.userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  };
}
