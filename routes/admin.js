const express = require('express');
const router = express.Router();
const passport = require('passport');
const passportConf = require('../config/passport');

const { validateBody, schemas } = require('../validations/authValidation');
const AdminController = require('../controllers/admin');

router.post('/signup', validateBody(schemas.signupSchema), AdminController.signUp);
router.post('/signin', validateBody(schemas.signinSchema), passport.authenticate('local', { session: false }), AdminController.signIn);
router.get('/', passport.authenticate('jwt', { session: false }), AdminController.getUser);

module.exports = router;