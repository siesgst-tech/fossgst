const https = require('https')
const qs = require('querystring');

const moment = require('moment');

const env = require('dotenv');
env.config();

const database = require('../config/database');
database();

const User = require('../model/User');
const XDOC = require('../model/Xdoc');
const Activities = require('../model/XdocActivity');

const sod = moment().startOf('day');

function getActiveXDoCs() {
  const condition = {
    endDate: {
      $gte: sod.set('hours', '2').subtract(1, 'days')
    }
  };
  // console.log(condition);

  return new Promise((resolve, reject) => {
    XDOC.find(condition, 'x repo userId')
      .populate('userId', { ghProfile: 1, ghToken: 1, _id: 0 })
      .lean().then((xdocs) => {
        // console.log(xdocs);
        resolve(xdocs);
      }).catch((err) => {
        // TODO: Handle error
        // console.log(err);
        reject(err);
      });
  });
}

function checkXDoC(xdoc) {
  return new Promise((resolve, reject) => {
    const query = qs.stringify({
      author: xdoc.userId.ghProfile,
      since: sod.subtract(1, 'days').toISOString(),
      until: sod.toISOString(),
    });

    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: `/repos/${xdoc.userId.ghProfile}/${xdoc.repo}/commits?${query}`,
      method: 'GET',
      headers: {
        'Authorization': `token ${xdoc.userId.ghToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'FOSSGST'
      }
    };
    // console.log(options);

    const req = https.request(options, res => {
      // console.log(`status code: ${res.statusCode}`);
      let data = '';
      res.on('data', (d) => {
        data += d;
      });

      res.on('end', () => {
        resolve(JSON.parse(data));
      });
    });

    req.on('error', (err) => {
      // console.error(err)
      reject(err);
    });

    req.end();
  });
}

async function start() {
  try {
    let xdocs = await getActiveXDoCs();
    // console.log(xdocs);

    // loop over xdocs and chech them individually
    let promises = [];
    xdocs.forEach(x => {
      promises.push(checkXDoC(x));
    });

    Promise.all(promises).then((success) => {
      // its success! hurray
      console.log(success);
    }).catch((err) => {
      // do something with error
    });
  } catch (err) {
    // do something with error
  }
}

start();
