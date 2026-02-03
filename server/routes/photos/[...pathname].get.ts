import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "stream";

const config = useRuntimeConfig();

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
});

export default eventHandler(async (event) => {
  const pathname = getRouterParam(event, "pathname");

  if (!pathname) {
    throw createError({ statusCode: 400, statusMessage: "Invalid pathname" });
  }

  // The URL structure is /photos/<uuid>/<variant>.jpg
  // The R2 Key structure is photos/<uuid>/<variant>.jpg
  const key = `photos/${pathname}`;

  if (config.r2.publicUrl) {
    // If a public URL is configured, redirect to it directly (CDN offload)
    const url = `${config.r2.publicUrl}/${key}`;
    return sendRedirect(event, url, 302);
  }

  try {
    const command = new GetObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key,
    });

    const response = await s3.send(command);

    if (response.ContentType) {
      setHeader(event, "Content-Type", response.ContentType);
    }
    setHeader(event, "Cache-Control", "public, max-age=31536000");

    // Pass the stream
    return response.Body as Readable;
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      throw createError({ statusCode: 404, statusMessage: "File not found" });
    }
    console.error("S3 Error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
