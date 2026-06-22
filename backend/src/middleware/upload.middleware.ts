import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { CdnService } from "../services/cdn.service";

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(_req, file, callback) {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Only image uploads are allowed"));
      return;
    }

    callback(null, true);
  },
});

const cdnService = new CdnService();

export const uploadProductImage = imageUpload.single("ImageFile");

export const attachUploadedProductImage = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    if (req.file) {
      req.body.Images = await cdnService.uploadProductImage(req.file);
    }

    next();
  } catch (error) {
    next(error);
  }
};
