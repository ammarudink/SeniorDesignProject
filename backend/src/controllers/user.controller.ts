import { Request, Response } from "express";
import { UserService } from "../services/user.service";

export class UserController {
  constructor(private readonly userService = new UserService()) {}

  list = async (_req: Request, res: Response) => {
    const data = await this.userService.getUsers();

    res.status(200).json({
      success: true,
      data,
    });
  };

  getById = async (req: Request, res: Response) => {
    const data = await this.userService.getUserById(Number(req.params.userId));

    res.status(200).json({
      success: true,
      data,
    });
  };

  update = async (req: Request, res: Response) => {
    const data = await this.userService.updateUser(Number(req.params.userId), req.user!, req.body);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data,
    });
  };

  delete = async (req: Request, res: Response) => {
    await this.userService.deleteUser(Number(req.params.userId), req.user!);

    res.status(204).send();
  };
}
