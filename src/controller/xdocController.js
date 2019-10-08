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

Array.prototype.filterMapCommits = function (user) {
  if (this === null) {
    throw new TypeError('this is null or not defined');
  }

  let arr = [];

  for (let i = 0; i < this.length; i++) {
    const e = this[i];
    if (e.parents.length <= 1 && e.author.login === user.ghProfile) {
      const obj = {
        sha: e.sha,
        url: e.url
      };
      arr.push(obj);
    }
  }

  return arr;
}

Promise.any = function (promises) {
  let rejectCount = 0;
  let reasons = [];

  return new Promise((resolve, reject) => {
    promises.forEach((promise) => {
      promise.then(resolve).catch((err) => {
        rejectCount++;
        reasons.push(err)
        if (rejectCount === promises.length)
          reject(reasons);
      });
    });
  });
};

async function getActiveXDoCs() {
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

async function handleXDoC(xdoc) {
  // console.log(xdoc);
  try {
    const commits = await fetchCommits(xdoc);
    console.log(commits);

    let promises = []
    commits.forEach((c) => {
      promises.push(checkCommit(c));
    });

    Promise.any(promises).then((success) => {
      // atleast one of the comn
      console.log(success)

      return Promise.resolve(success);
    }).catch((err) => {

      // console.log(err)
    });
  } catch (err) {
    console.log(err);
  }
}

function fetchCommits(xdoc) {
  return new Promise((resolve, reject) => {
    const query = qs.stringify({
      author: xdoc.userId.ghProfile,
      // since: sod.subtract(1, 'days').toISOString(),
      until: sod.add(3, 'days').toISOString(),
    });

    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: `/repos/${xdoc.repo}/commits?${query}`,
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
        // filter commit date before forwarding it
        let commits = JSON.parse(data);
        commits = commits.filterMapCommits(xdoc.userId);

        resolve(commits);
      });
    });

    req.on('error', (err) => {
      // console.error(err)
      reject(err);
    });

    req.end();
  });
}

function checkCommit() {
  return new Promise((resolve, reject) => {
    reject('hi');
  });
}

async function start() {
  try {
    let xdocs = await getActiveXDoCs();
    // console.log(xdocs);

    // loop over xdocs and chech them individually
    let promises = [];
    xdocs.forEach(x => {
      promises.push(handleXDoC(x));
    });

    // Promise.all(promises).then((allXdocs) => {
    //   // its success! hurray
    //   // console.log(allXdocs);

    //   promises = []
    //   allXdocs.forEach((x) => {
    //     promises.push(handleXDoC(x));
    //   });

    //   Promise.all(promises).then((succes) => {
    //     // its success! hurray
    //     console.log(succes);
    //   }).catch((err) => {
    //     // do something with error
    //   });
    // }).catch((err) => {
    //   // do something with error
    // });
  } catch (err) {
    // do something with error
  }
}

start();
