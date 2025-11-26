import { S3Client, randomUUIDv7 as uuidv7 } from "bun";
import env from "@api/env";
import { table } from "@api/db/model";
import db from "@api/db/db";
import { eq, inArray } from "drizzle-orm";
import sharp from "sharp";

const s3Client = new S3Client({
  accessKeyId: env.S3_ACCESS_KEY_ID,
  secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  bucket: env.S3_BUCKET_NAME,
  endpoint: env.S3_ENDPOINT,
});

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGE_DIMENSION = 1920; // Max width or height

export type UploadType = "post" | "comment" | "profile";

interface UploadResult {
  id: string;
  url: string;
}

/**
 * Compress and convert image to AVIF format
 * Resizes if larger than MAX_IMAGE_DIMENSION while maintaining aspect ratio
 */
const processImage = async (file: File): Promise<Buffer> => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const image = sharp(buffer);
  const metadata = await image.metadata();

  // Resize if image is larger than max dimension
  const needsResize =
    (metadata.width && metadata.width > MAX_IMAGE_DIMENSION) ||
    (metadata.height && metadata.height > MAX_IMAGE_DIMENSION);

  let pipeline = image;

  if (needsResize) {
    pipeline = pipeline.resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Convert to AVIF with good quality/compression balance
  const processedBuffer = await pipeline
    .avif({
      quality: 70,
      effort: 4, // Balance between speed and compression
    })
    .toBuffer();

  return processedBuffer;
};

export const uploadImage = async ({
  file,
  uploadType,
  userId,
  order = 0,
}: {
  file: File;
  uploadType: UploadType;
  userId: string;
  order?: number;
}): Promise<UploadResult> => {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    );
  }

  // process and compress before uploading
  const processedBuffer = await processImage(file);

  const fileId = uuidv7();
  // Always use .avif extension since we convert to AVIF
  const fileName = `${uploadType}/${userId}/${fileId}.avif`;

  await s3Client.write(fileName, processedBuffer, {
    type: "image/avif",
  });

  // construct public URL
  const imageUrl = `${env.S3_ENDPOINT}/${env.S3_BUCKET_NAME}/${fileName}`;

  if (uploadType === "post") {
    const [postImage] = await db
      .insert(table.postImage)
      .values({
        id: fileId,
        postId: null,
        imageUrl,
        order,
      })
      .returning();

    return {
      id: postImage.id,
      url: postImage.imageUrl,
    };
  }

  // comment and profile images, just return the URL
  return {
    id: fileId,
    url: imageUrl,
  };
};

export const uploadPostImages = async ({
  files,
  userId,
}: {
  files: File[];
  userId: string;
}): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadImage({
      file: files[i],
      uploadType: "post",
      userId,
      order: i,
    });
    results.push(result);
  }

  return results;
};

export const linkImagesToPost = async ({
  imageIds,
  postId,
}: {
  imageIds: string[];
  postId: string;
}): Promise<void> => {
  if (imageIds.length === 0) return;

  await db
    .update(table.postImage)
    .set({ postId })
    .where(inArray(table.postImage.id, imageIds));
};

export const deleteImage = async ({
  imageUrl,
}: {
  imageUrl: string;
}): Promise<void> => {
  // Extract the key from the URL
  const urlParts = imageUrl.split(`${env.S3_BUCKET_NAME}/`);
  if (urlParts.length < 2) {
    throw new Error("Invalid image URL");
  }
  const key = urlParts[1];

  await s3Client.delete(key);
};

export const getPostImages = async ({
  postId,
}: {
  postId: string;
}) => {
  const images = await db
    .select()
    .from(table.postImage)
    .where(eq(table.postImage.postId, postId))
    .orderBy(table.postImage.order);

  return images;
};
