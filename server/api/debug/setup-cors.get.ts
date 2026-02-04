import { PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";

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
  // Only allow in dev mode
  if (process.env.NODE_ENV !== "development") {
    throw createError({ statusCode: 403, message: "Dev only" });
  }

  try {
    const command = new PutBucketCorsCommand({
      Bucket: config.r2.bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["PUT", "POST", "GET", "HEAD"],
            AllowedOrigins: [
              "http://localhost:3000",
              "https://mattandsteff.com",
              "https://www.mattandsteff.com", // Add www variant
            ], // Add your production domain too
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    });

    await s3.send(command);

    return {
      success: true,
      message: "CORS configuration updated for R2 bucket.",
    };
  } catch (error: any) {
    return { success: false, error: error.message, details: error };
  }
});
