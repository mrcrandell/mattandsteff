import { z } from "zod";

const toggleVisibilitySchema = z.object({
  id: z.string(),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  if (!session.admin) {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const result = await readValidatedBody(
    event,
    (body) => toggleVisibilitySchema.safeParse(body),
  );

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
    });
  }

  const asset = await prisma.asset.findUnique({
    where: { id: result.data.id },
  });

  if (!asset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Photo not found",
    });
  }

  const updated = await prisma.asset.update({
    where: { id: result.data.id },
    data: {
      isHidden: !asset.isHidden,
    },
  });

  return { success: true, isHidden: updated.isHidden };
});
