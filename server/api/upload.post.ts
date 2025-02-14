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
  console.log(secret);
  console.log(token);
  console.log(ip);
  console.log(outcome);
  return outcome.success;
}


export default eventHandler(async (event) => {
  // Get token from event data
  const form = await readFormData(event)
  const file = form.get('file') as File
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
  // return;
  /* const turnstileResp = await verifyTurnstileToken(token);
  if (!turnstileResp.success) {
    return {
      status: 403,
      body: {
        error: 'Invalid token'
      }
    }
  } */

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