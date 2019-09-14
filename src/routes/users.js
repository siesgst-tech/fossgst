const express = require('express');
const router = express.Router();

const user = require('../controller/userController');

router.get('/', (req, res) => res.redirect(301, '/user/profile'));

router.get('/profile', user.profile);

module.exports = router;
