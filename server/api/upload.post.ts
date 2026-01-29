import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuid } from "uuid";

async function validateToken(ip: string, token: string, secret: string) {
  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  formData.append("remoteip", ip);

  const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  const result = await fetch(url, {
    body: formData,
    method: "POST",
  });

  const outcome = await result.json();
  return outcome.success;
}

export default eventHandler(async (event) => {
  // Get token from event data
  const form = await readFormData(event);
  const token =
    (form.get("token") || form.get("cf-turnstile-response") || "") as string;
  const secret = process.env.NUXT_TURNSTILE_SECRET_KEY || "";
  // ref="turnstile"
  // const headers = useRequestHeader(['cookie'])
  // Get the client's IP address from the 'cf-connecting-ip' header
  let ip = event.node.req.headers["cf-connecting-ip"] || "";
  if (Array.isArray(ip)) {
    ip = ip[0];
  }
  // const ip = event.request.headers.get('cf-connecting-ip') || '';
  // const token = form.get('token') as string
  // console.log(token);
  // console.log(process.env.NUXT_TURNSTILE_SECRET_KEY);
  // console.log(secret);
  // console.log(token);
  // console.log(`IP: ${ip}`);

  // Validate Turnstile before Sending Email
  if (!await validateToken(ip, token, secret)) {
    // HTTP_400: Bad Request
    return {
      status: 400,
      body: {
        error: "Invalid token",
      },
    };
  }
  // If posts exists, set up
  // Modify event to remove token
  // Create a new FormData object without the token
  const newForm = new FormData();
  for (const [key, value] of form.entries()) {
    if (key !== "token" && key !== "cf-turnstile-response") {
      newForm.append(key, value);
    }
  }

  // console.log(event.node.req.body);

  // Manually handle the upload using the new form data
  const files = newForm.getAll("photos") as File[];
  if (!files.length) {
    throw createError({ statusCode: 400, statusMessage: "No files uploaded" });
  }

  const uploadResults = [];
  const uploadsDir = join(process.cwd(), "uploads", "photos");

  // Ensure uploads directory exists
  await mkdir(uploadsDir, { recursive: true });

  for (const file of files) {
    // Ensure the file meets the criteria (using basic validation instead of ensureBlob)
    if (!file.type.startsWith("image/")) {
      throw createError({
        statusCode: 400,
        statusMessage: "Only image files are allowed",
      });
    }

    if (file.size > 8 * 1024 * 1024) { // 8MB
      throw createError({
        statusCode: 400,
        statusMessage: "File too large. Maximum size is 8MB",
      });
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop();
    const uniqueFilename = `${uuid()}.${fileExtension}`;
    const filePath = join(uploadsDir, uniqueFilename);
    const relativePath = `photos/${uniqueFilename}`;

    // Save file to disk
    const arrayBuffer = await file.arrayBuffer();
    await writeFile(filePath, new Uint8Array(arrayBuffer));

    // Save to database
    const asset = await prisma.asset.create({
      data: {
        id: uuid(),
        path: relativePath,
        // userId: null, // For now, anonymous uploads
      },
    });

    // Collect the result in similar format to hubBlob
    uploadResults.push({
      pathname: relativePath,
      contentType: file.type,
      size: file.size,
      uploadedAt: asset.createdAt,
    });
  }

  // Return the upload results
  return {
    status: 200,
    body: {
      uploads: uploadResults,
    },
  };
});
