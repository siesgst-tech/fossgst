require('https').globalAgent.options.rejectUnauthorized = false;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = (passport) => {
  // Serialize the user for the sesison
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Used to unserialize the user
  passport.deserializeUser((id, done) => {
    // TODO: make a DB model to search users from :p
    const err = '';
    done(err, id);
  });

  let options = {
    clientID: process.env.GOOGLE_DEV_CLIENT_ID,
    clientSecret: process.env.GOOGLE_DEV_SECRET,
    callbackURL: process.env.APP_DEV_URL + '/google/signin/callback',
    passReqToCallback: true
  };

  if ('dev' !== process.env.NODE_ENV) {
    options = {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: process.env.APP_URL + '/google/signin/callback',
      passReqToCallback: true
    };
  }

  passport.use(new GoogleStrategy(options, (req, accessToken, refreshToken, profile, done) => {
    req.session.user = profile;
    req.session.loggedIn = true;
    req.flash('toastStatus', 'success');
    req.flash('toastMessage', 'Hey ' + profile.name.givenName + ', welcome back!');
    return done(null, profile);
  })
  );
}
