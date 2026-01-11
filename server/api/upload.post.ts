async function validateToken(ip: string, token: string, secret: string) {
  const formData = new FormData();
  formData.append('secret', secret);
  formData.append('response', token);
  formData.append('remoteip', ip);

  const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  const result = await fetch(url, {
      body: formData,
      method: 'POST',
  });

  const outcome = await result.json();
  return outcome.success;
}


export default eventHandler(async (event) => {
  // Get token from event data
  const form = await readFormData(event);
  const token = (form.get('token') || form.get('cf-turnstile-response') || '') as string;
  const secret = process.env.NUXT_TURNSTILE_SECRET_KEY || '';
  // ref="turnstile"
  // const headers = useRequestHeader(['cookie'])
  // Get the client's IP address from the 'cf-connecting-ip' header
  let ip = event.node.req.headers['cf-connecting-ip'] || '';
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
  if (! await validateToken(ip, token, secret)) {
      // HTTP_400: Bad Request
      return {
        status: 400,
        body: {
          error: 'Invalid token'
        }
      }
  }
  // If posts exists, set up 
  // Modify event to remove token
  // Create a new FormData object without the token
  const newForm = new FormData()
  for (const [key, value] of form.entries()) {
    if (key !== 'token' && key !== 'cf-turnstile-response') {
      newForm.append(key, value)
    }
  }

  // console.log(event.node.req.body);

  // Manually handle the upload using the new form data
  const files = newForm.getAll('photos') as File[]
  if (!files.length) {
    throw createError({ statusCode: 400, statusMessage: 'No files uploaded' })
  }

  const uploadResults = []

  for (const file of files) {
    // Ensure the file meets the criteria
    ensureBlob(file, {
      maxSize: '8MB',
      types: ['image']
    })

    // Upload the file
    const result = await hubBlob().put(file.name, file, {
      addRandomSuffix: false,
      prefix: 'photos/'
    })

    // Collect the result
    uploadResults.push(result)
  }

  // Return the upload results
  return {
    status: 200,
    body: {
      uploads: uploadResults
    }
  }
})