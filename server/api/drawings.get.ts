export default eventHandler(async (event) => {
  // Return 100 last drawings
  return hubBlob().list({
    limit: 100
  })
})