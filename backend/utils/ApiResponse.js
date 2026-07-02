/**
 * Send a successful JSON response with a standard envelope.
 *
 * @param {import('express').Response} res
 * @param {*}      data
 * @param {string} [message='Success']
 * @param {number} [status=200]
 */
function ok(res, data, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

/**
 * Send a 201 Created response.
 *
 * @param {import('express').Response} res
 * @param {*}      data
 * @param {string} [message='Created']
 */
function created(res, data, message = 'Created') {
  return ok(res, data, message, 201);
}

module.exports = { ok, created };
