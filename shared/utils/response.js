function sendResponse(res, { statusCode = 200, message = 'Success', data = null, meta = null }) {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return res.status(statusCode).json(response);
}

module.exports = sendResponse;
