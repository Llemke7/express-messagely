const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const { ensureLoggedIn, ensureCorrectUserOrRecipient } = require('../middleware/auth');

/** Middleware to ensure user is logged in */
router.use(ensureLoggedIn);

/** GET /:id - get detail of message.
 *
 * => {message: {id, body, sent_at, read_at, from_user: {username, first_name, last_name, phone}, to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in user is either the to or from user.
 */
router.get('/:id', ensureCorrectUserOrRecipient, async (req, res, next) => {
  try {
    const message = await Message.get(req.params.id);
    return res.json({ message });
  } catch (err) {
    return next(err);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 * Make sure that any logged-in user can send a message to any other user.
 */
router.post('/', async (req, res, next) => {
  try {
    const { to_username, body } = req.body;
    const message = await Message.create(req.user.username, to_username, body);
    return res.status(201).json({ message });
  } catch (err) {
    return next(err);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that only the intended recipient can mark the message as read.
 */
router.post('/:id/read', ensureCorrectUserOrRecipient, async (req, res, next) => {
  try {
    const message = await Message.markAsRead(req.params.id);
    return res.json({ message });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
