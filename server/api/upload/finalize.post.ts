export default eventHandler(async (event) => {
  const session = await requireUserSession(event);
  const sessionPhone = (session.user as any).phone;

  const body = await readBody(event);
  const { name, phone, message, assets } = body as {
    name: string;
    phone: string;
    message: string;
    assets: { id: string; path: string }[];
  };

  if (!assets || !Array.isArray(assets) || assets.length === 0) {
    throw createError({ statusCode: 400, message: "No assets to finalize" });
  }

  // 4. Database Transaction
  const result = await prisma.$transaction(async (tx) => {
    // A. Resolve User
    let userId: string | null = null;

    // Prioritize form phone, then session phone
    const targetPhone = phone || sessionPhone;

    if (targetPhone) {
      // Try to find existing user
      let user = await tx.user.findUnique({ where: { phone: targetPhone } });

      if (user) {
        // Update name if provided and different
        if (name && name.trim() !== "" && name !== user.name) {
          user = await tx.user.update({
            where: { id: user.id },
            data: { name },
          });
        }
      } else if (phone && name) {
        // Create new user ONLY if both phone and name are provided (User model requires name)
        // If name is missing but phone is present, we technically can't create a User
        // without violating the schema (name is String, not optional).
        user = await tx.user.create({
          data: { phone, name },
        });
      } else if (phone && !name) {
        // Fallback: If just phone is provided, create a user with a placeholder name?
        // Or treat as anonymous?
        // Let's create with "Guest" to capture the phone number interaction.
        user = await tx.user.create({
          data: { phone, name: "Friend & Family" },
        });
      }

      if (user) {
        userId = user.id;
      }
    }

    // B. Create Post
    const post = await tx.post.create({
      data: {
        text: message || null,
        userId: userId,
      },
    });

    // C. Create Assets and Links
    await Promise.all(
      assets.map((asset) =>
        tx.asset.create({
          data: {
            id: asset.id,
            path: asset.path,
            userId: userId,
            assetsPosts: {
              create: {
                postId: post.id,
              },
            },
          },
        })
      ),
    );

    return { postId: post.id, assets: assets.length };
  }, {
    maxWait: 10000, // Wait 10s to get a connection
    timeout: 20000, // Allow 20s for the transaction to complete
  });

  return { success: true, ...result };
});
