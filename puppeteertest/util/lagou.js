const fs = require('fs');
const path = require('path');
const axios = require('axios');
const {stringify} = require('querystring');
const lodashGet = require('lodash/get');

const pcUserAgentList = require('./pcUserAgent');
const Util = require('./utils');

let FAKE_USERAGENT = pcUserAgentList[0]; // 伪造的浏览器信息
const WRITE_FILE_DIR = path.join(__dirname, './cacheData'); // 请求数据存储的文件目录 （目前测试使用，todo 存储到数据库 或者 业务中直接使用文件读数据后缓存也ok）
const DELAY_TIME = 20000; // 下一轮请求的延迟，单位 ms ，建议10s 以上，以防被反爬虫
const PAGE_SIZE = 10; // list api 每次获取的条数 (貌似最大为10，未深入研究，仅猜测)
const JOB_LIST_API = 'https://www.lagou.com/gongsi/searchPosition.json'; // POST 获取职位列表
const COMPANY_PAGE_URL = 'https://www.lagou.com/gongsi/j124262.html'; // GET 获取公司页面(124262)为minieye

// get page 获取cookies时的header设置，直接浏览器拷贝
const getPageHeaders = {
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'zh,en;q=0.9,zh-HK;q=0.8,zh-CN;q=0.7',
  'Cache-Control': 'max-age=0',
  Connection: 'keep-alive',
  Host: 'www.lagou.com',
  Referer: 'https://www.lagou.com/gongsi/j124262.html',
  'Upgrade-Insecure-Requests': 1,
  // 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
  'User-Agent': FAKE_USERAGENT,
};

// 获取jobList时的header设置，直接浏览器拷贝,Cookie使用即使获取
const getJobListHeaders = {
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'zh,en;q=0.9,zh-HK;q=0.8,zh-CN;q=0.7',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  // Cookie,
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  Host: 'www.lagou.com',
  Origin: 'https://www.lagou.com',
  Pragma: 'no-cache',
  Referer: 'https://www.lagou.com/gongsi/j124262.html',
  // 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
  'User-Agent': FAKE_USERAGENT,
  'X-Anit-Forge-Code': '0',
  'X-Anit-Forge-Token': 'None',
  'X-Requested-With': 'XMLHttpRequest',
};

function parseSetCookieToCookieStr(setCookieArr) {
  let cookieStr = '';
  if (!Array.isArray(setCookieArr)) {
    return cookieStr;
  }
  setCookieArr.forEach(setCookie => {
    cookieStr += `${setCookie.split(';')[0]}; `;
  });

  return cookieStr.substring(0, cookieStr.lastIndexOf(';'));
}

function getRequestCookies() {
  return new Promise(async (resolve, reject) => {
    const res = await axios.get(COMPANY_PAGE_URL, {headers: getPageHeaders}).catch(err => {
      console.log('请求页面出错,获取cookie失败');
      console.log(err);
      reject(err);
    });

    if (res && res.headers) {
      const setCookie = res.headers['set-cookie'];
      const cookieStr = parseSetCookieToCookieStr(setCookie);

      console.log('获取 cookie 成功: ');
      console.log(cookieStr);

      resolve(cookieStr);
    } else {
      console.log('获取 cookie 失败');
    }
  });
}

function saveResDataToJsonFile(data, currentPageNo) {
  if (!fs.existsSync(WRITE_FILE_DIR)) {
    fs.mkdirSync(WRITE_FILE_DIR);
  }
  const filePath = `${WRITE_FILE_DIR}/allPosition_${currentPageNo}.json`;
  fs.writeFile(filePath, JSON.stringify(data), 'utf8', err => {
    if (err) {
      console.log(`文件保存出错,filePath：${filePath} `);
      console.log(err);
    } else {
      console.log(`文件保存成功,filePath：${filePath} `);
    }
  });
}

function getJobList(pageNo = 1) {
  return new Promise(async (resolve, reject) => {
    const cookieStr = await getRequestCookies().catch(e => {
      reject(e);
    });
    const postParamObj = {
      companyId: 124262,
      positionFirstType: '全部',
      city: '',
      salary: '',
      workYear: '',
      schoolJob: false,
      pageNo: pageNo,
      pageSize: PAGE_SIZE,
    };
    const postData = stringify(postParamObj);

    const res = await axios({
      url: JOB_LIST_API,
      method: 'post',
      headers: {
        ...getJobListHeaders,
        Cookie: cookieStr,
      },
      cache: false,
      data: postData,
    }).catch(e => {
      console.log('获取列表失败error：');
      console.log(e);
      reject(e);
    });

    resolve(res);
  });
}

async function getListData(currentPageNo = 1) {
  Util.consoleSepTip(`开始请求 job 列表数据，当前pageNo： ${currentPageNo}`);
  const res = await getJobList(currentPageNo).catch(e => {
    return null;
  });
  if (res && res.data && res.data.state === 1) {
    // console.log(res.data);
    const pageData = lodashGet(res.data, 'content.data.page');

    if (!pageData) {
      return;
    }

    saveResDataToJsonFile(res.data, currentPageNo);

    const {pageNo = currentPageNo, totalCount} = pageData;
    if (Number.parseInt(pageNo) * PAGE_SIZE < Number.parseInt(totalCount)) {
      Util.consoleSepTip(
        `----- 还有数据未请求完，即将在 ${DELAY_TIME / 1000}s 后进行下一次请求 --------`,
      );

      await Util.delay(DELAY_TIME);
      const nextPageNo = pageNo + 1;
      await getListData(nextPageNo);
    } else {
      Util.consoleSepTip('---- 所有数据请求完成! ------');
    }
  }
}

async function lagouScript() {
  FAKE_USERAGENT = pcUserAgentList[Math.floor(Math.random() * pcUserAgentList.length)]; // 随机伪造当前任务的浏览器信息
  await getListData();
}

module.exports = {
  lagouScript,
};
