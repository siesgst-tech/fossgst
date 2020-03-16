const https = require('https');
const qs = require('querystring');

const User = require('../../model/User');

module.exports.index = function (req, res) {
  const session = req.session;

  if (session.loggedIn && !session.user.tos) {
    res.redirect('/tos');
  } else {
    res.render('index');
  }
}

module.exports.philosophy = function (req, res) {
  res.render('philosophy');
}

module.exports.community = function (req, res) {
  res.render('community');
}

module.exports.tos = function (req, res) {
  res.render('static/tos');
}

module.exports.tosAccept = function (req, res) {
  const userId = req.session.user._id;

  User.findOneAndUpdate({ _id: userId }, { tos: true }, (err, user) => {
    if (err) {
      // handle the damn error!
    } else {
      req.session.user.tos = true;
      res.redirect('/');
    }
  });
}

module.exports.legals = function (req, res) {

}

module.exports.register = function (req, res) {
  if (req.session.loggedIn && req.session.user && req.session.user._id) {
    res.redirect('/user/profile');
    return;
  }

  res.render('static/register');
}

module.exports.githubCallback = function (req, res) {
  const ghCode = req.query.code;
  const ghState = req.query.state;
  // console.log(ghCode, ghState);

  const state = (req.session.user._id).substring(0, 10);
  if (state !== ghState) {
    // flash message: GH connection failed
    res.redirect('/user/profile');
    return;
  }

  let ghId = process.env.GITHUB_DEV_CLIENT_ID;
  let ghSecret = process.env.GITHUB_DEV_SECRET;
  if (process.env.NODE_ENV !== 'dev') {
    ghId = process.env.GITHUB_CLIENT_ID;
    ghSecret = process.env.GITHUB_SECRET;
  }

  const postData = qs.stringify({
    client_id: ghId,
    client_secret: ghSecret,
    code: ghCode,
    state: state,
  });

  const options = {
    hostname: 'github.com',
    port: 443,
    path: '/login/oauth/access_token',
    method: 'POST',
    headers: { accept: 'application/json' }
  };

  const httpReq = https.request(options, (httpRes) => {
    let data = '';
    httpRes.setEncoding('utf8');

    httpRes.on('data', (chunk) => {
      data += chunk;
    });

    httpRes.on('end', () => {
      // console.log(data);
      const resp = JSON.parse(data);
      // console.log(resp);

      if (resp.error) {
        // TODO: handle error
        req.flash('toastMessage', 'There is no such user');
        req.flash('toastStatus', 'danger');
        res.send('error');
      } else {
        req.session.user.ghToken = resp.access_token;
        res.redirect('/github/getuser')
      }
    });
  });

  httpReq.on('error', (e) => {
    // console.error(`problem with request: ${e.message}`);
    req.flash('toastMessage', 'OOPS! Some error!');
    req.flash('toastStatus', 'danger');
    res.send(e);
  });

  httpReq.write(postData);
  httpReq.end();
}

module.exports.githubGetUser = function (req, res) {
  const accessToken = req.session.user.ghToken;
  const userId = req.session.user._id;
  // console.log(accessToken);

  const options = {
    hostname: 'api.github.com',
    port: 443,
    path: '/user',
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'User-Agent': 'FOSSGST',
      'Authorization': `token ${accessToken}`
    }
  };

  const httpReq = https.request(options, (httpRes) => {
    let data = '';
    httpRes.setEncoding('utf8');

    httpRes.on('data', (chunk) => {
      data += chunk;
    });

    httpRes.on('end', () => {
      // console.log(data);
      const resp = JSON.parse(data);
      // console.log(resp);

      if (!resp.login) {
        // TODO: handle error
        req.flash('toastMessage', 'There is no such user');
        req.flash('toastStatus', 'danger');
        res.send('error');
      } else {
        User.findByIdAndUpdate(userId, {$set: {ghProfile: resp.login, ghToken: accessToken}}, (err, doc) => {
          if (err) {
            // TODO: handle error
            req.flash('toastMessage', 'There is no such user');
            req.flash('toastStatus', 'danger');
            res.send('error');
          } else {
            // console.log(doc);
            req.session.user.ghProfile = resp.login;
            req.session.user.ghToken = accessToken;
            // console.log(req.session);

            req.flash('toastStatus', 'success');
            req.flash('toastMessage', 'GitHub account connected!');
            res.redirect('/user/profile');
          }
        });
      }
    });
  });

  httpReq.on('error', (e) => {
    // console.error(`problem with request: ${e.message}`);
    req.flash('toastMessage', 'OOPS! Some error!');
    req.flash('toastStatus', 'danger');
    res.send(e);
  });

  httpReq.end();
}
