const express = require('express');
const router = express.Router();
const { register, checkUser } = require('./auth.controller');

router.post('/register', register);
router.get('/check/:googleId', checkUser);

module.exports = router;