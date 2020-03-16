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

Array.prototype.last = function () {
  return this[this.length - 1];
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

Promise.allSettled = function (promises) {
  return Promise.all(promises.map((promise) => {
    return promise
      .then(val => ({ status: 'fulfilled', value: val }))
      .catch(err => ({ status: 'rejected', error: err }));
  })
  );
}

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
    const commits = await fetchAllCommits(xdoc);
    // console.log(commits);

    let promises = []
    commits.forEach((c) => {
      promises.push(fetchCheckCommit(c, xdoc.userId.ghToken));
    });

    Promise.allSettled(promises).then(d => {
      let validity = false;
      for (const k in d) {
        const e = d[k];
        if (e.status === 'fulfilled') {
          validity = true;
          break;
        }
      }

      updateXDoCActivity(xdoc, d, validity).then((act) => {
        console.log(act);
      }).catch((err) => {
        console.log(err);
      });
    });
  } catch (err) {
    console.log(err);
  }
}

function fetchAllCommits(xdoc) {
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

function fetchCheckCommit(commitObj, token) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'FOSSGST'
      }
    };

    const req = https.request(commitObj.url, options, res => {
      let data = '';
      res.on('data', (d) => { data += d; });

      res.on('end', () => {
        let commit = JSON.parse(data);

        if (checkCommit(commit)) {
          resolve([commit.sha, true]);
        } else {
          reject([commit.sha, false]);
        }
      });
    });

    req.on('error', (err) => { reject(err); });
    req.end();
  });
}

function checkCommit(commit) {
  if (commit.parents.length > 1)
    return false;

  const exts = ['md', 'info', 'example', 'txt'];
  for (let i = 0; i < commit.files.length; i++) {
    const f = commit.files[i];
    let ext = f.filename.split('.');

    if (ext.length > 1 && !exts.includes(ext.last()))
      return true;
  }

  return false;
}

function updateXDoCActivity(xdoc, commits, validity) {
  return new Promise((resolve, reject) => {
    Activities.findOne({ xdocId: xdoc._id }).sort({ createdAt: -1 }).limit(1).lean().exec((err, activity) => {
      let c = [];
      for (let k=0; k<commits.length; ++k) {
        const e = commits[k].value || commits[k].error;

        c.push({
          'sha': e[0],
          'validity': e[1]
        });
      }

      let point = activity.point;
      if (validity)
        point += 1;

      let newActivity = {
        xdocId: xdoc._id,
        point: point,
        commit: c,
        validity: validity,
      };

      Activities.create(newActivity, (err, act) => {
        if (err)
          reject(err);
        else
          resolve(act);
      });
    });
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
