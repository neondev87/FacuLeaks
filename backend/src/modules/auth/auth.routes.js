const express = require('express');
const router = express.Router();
const { register, checkUser, login } = require('./auth.controller');

router.post('/register', register);
router.get('/check/:googleId', checkUser);
router.post('/login', login);

module.exports = router;