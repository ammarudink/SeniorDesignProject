import path from "path";
import { randomUUID } from "crypto";
import { supabase, supabaseBucket } from "../config/supabase";
import { ApiError } from "../utils/api-error";

const extensionByMimeType: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

function getImageExtension(file: Express.Multer.File) {
  const mimeExtension = extensionByMimeType[file.mimetype];

  if (mimeExtension) {
    return mimeExtension;
  }

  const originalExtension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

  if (allowedExtensions.has(originalExtension)) {
    return originalExtension;
  }

  return "";
}

export class CdnService {
  async uploadProductImage(file: Express.Multer.File) {
    const objectPath = `products/${randomUUID()}${getImageExtension(file)}`;

    const { error } = await supabase.storage.from(supabaseBucket).upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: "31536000",
      upsert: false,
    });

    if (error) {
      throw new ApiError(500, "Supabase image upload failed", error.message);
    }

    const { data } = supabase.storage.from(supabaseBucket).getPublicUrl(objectPath);

    if (!data.publicUrl) {
      throw new ApiError(500, "Supabase image URL could not be created");
    }

    return data.publicUrl;
  }
}
