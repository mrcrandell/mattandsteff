export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(
    event,
    (body) => loginValidation.parse(body),
  );

  const admin = await prisma.admin.findUnique({
    where: { email },
  });

  // Hash/rehash password utility can be added if needed, but for now we follow the simple plan
  // If the admin doesn't exist or hash is invalid
  const isValid = admin &&
    await customVerifyPassword(password, admin.passwordHash);

  if (!isValid) {
    throw createError({
      statusCode: 401,
      message: "Invalid credentials",
    });
  }

  // Create session
  await setUserSession(event, {
    // Keep existing user session data intact if any (though usually admin login is separate)
    // admin namespace
    admin: {
      id: admin!.id,
      role: admin!.role,
      name: admin!.name,
    },
    loggedIn: true, // Maintain consistency with existing auth
  });

  return { success: true };
});
