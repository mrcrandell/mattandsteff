export default eventHandler(async (event) => {
  // Make sure the user is authenticated to upload
  // const { user } = await requireUserSession(event)

  // Read the form data
  const form = await readFormData(event)
  const drawing = form.get('drawing') as File

  // TODO add validation to ensure its an image or video
  // Ensure the file is a jpeg image and is not larger than 1MB
  /* ensureBlob(drawing, {
    maxSize: '1MB',
    types: ['image/jpeg'],
  }) */

  // Upload the file to the Cloudflare R2 bucket
  return hubBlob().put(`${Date.now()}.jpg`, drawing, {
    addRandomSuffix: true,
    /* customMetadata: {
      userProvider: user.provider,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      userUrl: user.url,
    }, */
  })
})