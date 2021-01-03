const express = require('express');
const router = express.Router();
const passport = require('passport');
const passportConf = require('../config/passport');

const gameController = require('../controllers/game');

// Just for testing
router.post('/', passport.authenticate('jwt', { session: false }), gameController.newGame);
router.get('/getAll',  passport.authenticate('jwt', { session: false }), gameController.getAll);

module.exports = router;