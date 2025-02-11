export default eventHandler(async (event) => {
  // Make sure the user is authenticated to upload
  // const { user } = await requireUserSession(event)

  // TODO add some kind of validation from the frontend
  return;
  /* return hubBlob().handleUpload(event, {
    formKey: 'photos', // read file or files form the `formKey` field of request body (body should be a `FormData` object)
    multiple: true, // when `true`, the `formKey` field will be an array of `Blob` objects
    ensure: {
      maxSize: '8MB',
      types: ['image']
    },
    put: {
      addRandomSuffix: true,
      prefix: 'photos/',
    }
  }); */
})