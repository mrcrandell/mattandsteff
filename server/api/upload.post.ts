export default eventHandler(async (event) => {
  // Get token from event data
  const form = await readFormData(event)
  const token = (form.get('token') || form.get('cf-turnstile-response') || '') as string;
  console.log(token);
  /* const turnstileResp = await verifyTurnstileToken(token);
  if (!turnstileResp.success) {
    return {
      status: 403,
      body: {
        error: 'Invalid token'
      }
    }
  }
  */
  return hubBlob().handleUpload(event, {
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
  });
})