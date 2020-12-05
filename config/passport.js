const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const { ExtractJwt } = require('passport-jwt');
const Admin = require('../models/admin');

passport.use('jwt', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromHeader('authorization'),
    secretOrKey: process.env.TOKEN_SECRET
}, async (payload, done) => {
    try {
        const admin = await Admin.findById(payload.id);
        if(!admin) return done(null, false);
        done(null, admin);
    } catch(err) {
        done(err, false);
    }
}));

passport.use('local', new LocalStrategy({
    usernameField: 'email'
}, async (email, password, done) => {
    try {
        const admin = await Admin.findOne({ email });
        if(!admin) return done(null, false);

        const checkPassword = await admin.isValidPassword(password);
        if(!checkPassword) return done(null, false);

        done(null, admin);
    } catch(err) {
        return done(err, false);
    }
}));