export default eventHandler(async (event) => {
  // Return 1000 last drawings
  const { blobs } = await hubBlob().list({
    limit: 1000
  })

  return blobs
})