export default eventHandler(async (event) => {
  // Make sure the user is authenticated to upload
  // const { user } = await requireUserSession(event)

  // Read the form data
  const form = await readFormData(event)
  const photo = form.get('photo') as File

  // TODO add validation to ensure its an image or video
  // Ensure the file is a jpeg image and is not larger than 1MB
  /* ensureBlob(drawing, {
    maxSize: '1MB',
    types: ['image/jpeg'],
  }) */

  const name = `${new Date('2050-01-01').getTime() - Date.now()}`

  // Upload the file to the Cloudflare R2 bucket
  return hubBlob().put(`${name}.jpg`, photo, {
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