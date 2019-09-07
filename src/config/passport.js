require('https').globalAgent.options.rejectUnauthorized = false;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const https = require('https');
const querystring = require('querystring');

const User = require('../model/User');

module.exports = (passport) => {
  // Serialize the user for the sesison
  passport.serializeUser((user, done) => {
    // console.log(user);
    done(null, user.id);
  });

  // Used to unserialize the user
  passport.deserializeUser((id, done) => {
    const err = null;
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
    // TODO: verify accessToken and refreshToken
    // TODO: check if user email group is from SIESGST

    User.findOne({ 'email': profile.emails[0].value }, (err, user) => {
      if (err) {
        return done(err);
      } else if (user) {
        User.findOneAndUpdate({ 'email': profile.emails[0].value }, { 'imageUrl': profile.photos[0].value }, (err, doc) => {
          if (err) {
            return done(err);
          } else {
            req.session.user = {
              _id: doc._id,
              email: doc.email,
              fname: profile.name.givenName,
              imageUrl: profile.photos[0].value,
              tos: doc.tos,
            };

            req.session.loggedIn = true;
            req.flash('toastStatus', 'success');
            req.flash('toastMessage', 'Hey ' + profile.name.givenName + ', welcome back!');
            return done(null, doc);
          }
        });
      } else {
        // TODO: make a http request to Portal to check if such user exist
        // if exists: register the user
        // if not: Throw no such user
        const postData = querystring.stringify({
          'email': profile.emails[0].value,
          'key': process.env.FOSSGST_PORTAL_SECRET
        });

        const options = {
          hostname: 'portal.siesgst.ac.in',
          port: 443,
          path: '/api/v2/checkuser',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const httpReq = https.request(options, (res) => {
          let data = '';
          res.setEncoding('utf8');

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            // console.log(data);
            resp = JSON.parse(data);
            // console.log(resp);

            if ('success' === resp.status) {
              // TODO: insert user in DB :p
              let user = {
                name: resp.data.name,
                email: resp.data.email,
                imageUrl: profile.photos[0].value
              };

              User.create(user, (err, doc) => {
                if (err) {
                  return done(err);
                } else {
                  req.session.user = {
                    _id: doc._id,
                    email: doc.email,
                    fname: profile.name.givenName,
                    imageUrl: profile.photos[0].value,
                    tos: doc.tos,
                  };

                  req.session.loggedIn = true;
                  req.flash('toastStatus', 'success');
                  req.flash('toastMessage', 'Hey ' + profile.name.givenName + ', welcome back!');
                  return done(null, doc);
                }
              });
            } else {
              req.flash('toastMessage', 'There is no such user');
              req.flash('toastStatus', 'error');
              return done(null, null);
            }
          });
        });

        httpReq.on('error', (e) => {
          console.error(`problem with request: ${e.message}`);
          req.flash('toastMessage', 'OOPS! Some error!');
          req.flash('toastStatus', 'error');
          return done(null, null);
        });

        httpReq.write(postData);
        httpReq.end();
      }
    });
  })
  );
}
