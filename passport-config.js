const ppjwt = require('passport-jwt');
const Strategy = ppjwt.Strategy;
const ExtractJwt = ppjwt.ExtractJwt;

require('dotenv').config();
const secret = process.env.SECRET || 'there is no spoon!';
const mongoose = require('mongoose');
const User = require('./models/user');

//this sets how we handle tokens coming from the requests that come
// and also defines the key to be used when verifying the token.
const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secret
};

module.exports = passport => {
    passport.use(
        new Strategy(opts, (payload, done) => {
            // FInd user in database from the token received
            User.findById(payload.id)
            .then(user => {
                if(user){
                    return done(null, {
                        id: user.id,
                        userName: user.userName,
                        email: user.email,
                        role: user.role
                    });
                }
                return done(null, false);
            })
            .catch(err => console.error(err));
        })
    );
};