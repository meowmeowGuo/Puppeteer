/*
* test3：自动操作浏览器
* new：新增登录操作
* */
const puppeteer = require('puppeteer');
const clc = require('cli-color');
const {autoScroll} = require('../util/functions');

const COLITEMCOUNT = 2;


const newsSelector = {
  newsOpenBtn: '[data-data-id="shiping-title"] .linkSpan',
  newsDate: '[data-data-id="textListGrid"] .text-link-item-title .extra-wrap .text',
  news: (index) => `[data-data-id="textListGrid"] .grid-cell:nth-child(${index}) .text-link-item-title .text-wrap`,
};
const videoSelector = {
  videoOpenBtn: '[data-locations="7"]',
  diyipindao: '[data-data-id="menuList"] .grid-cell:nth-child(1) .item-text',
  menuSelector: (index) => `.container.top .tab-panel-container .left-item .horizontal-item:nth-child(${index}) .tab-item`,
  list: '.list', // 列表形式显示视频，方便校验日期
  videoDate: '.text-link-item-title .extra-wrap .text',
  videoSelector: (row, col) => `.tab-panel-container .tab-panel-container section > div:nth-child(3) > section .grid-gr:nth-child(${row}) .grid-cell:nth-child(${col}) .text-wrap`,
};


const waitTime = (Math.max(5, Math.random() * 10)) * 1000;
const randomMin = () => parseFloat(Math.random().toFixed(2));
const newsTaskConfig = {
  task: '看新闻',
  time: (2 + randomMin()) * 60 * 1000, // 2 min 以上
  openBtn: '[data-data-id="xxxal"] .grid-gr:nth-child(1) .grid-cell section section div.extra > span', // 打开新闻列表的按钮选择器
  newSelector: (index) => `[data-data-id="shiping-text-list-grid"] .grid-cell:nth-child(${index}) .text-link-item-title`,
  needCount: 6,
};

function getTaskDate() {
  const today = new Date();
  // const todayFormat = `${today.getFullYear()}-${today.getMonth() + 1} - ${today.getDate()}`;
  let yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (today.getDay() === 1) {
    yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3);
  }
  return `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;
}

(async () => {
  const taskDate = getTaskDate();
  console.log('任务日期：', clc.red(taskDate));
  const browser = await puppeteer.launch({
    headless: false, // 是否以 无头模式 运行浏览器。默认是 true
    // devtools: true, // 是否为每个选项卡自动打开DevTools面板
    // args: ['--auto-open-devtools-for-tabs'],
  });
  const page = await browser.newPage();
  // 学习强国登录页面
  await page.goto('https://pc.xuexi.cn/points/login.html?ref=https%3A%2F%2Fwww.xuexi.cn%2F', {
    waitUntil: 'load',
  });
  // 设置视图大小
  await page.setViewport({
    width: 1280,
    height: 800,
  });
  let currentPages = await browser.pages();
  // 等待指定时间 second
  await page.waitFor(waitTime);
  // 给30s的时间扫码登录
  await page.waitFor(30 * 1000);
  let title = await page.title();
  // 登录页面title='用户登录'，登录成功后title='学习强国'
  console.log(clc.blue(title));

  if (title === '学习强国') {
    console.log(clc.green('登陆成功'));
    console.log('任务开始');
    await newsTask();
    await videoTask();
    console.log('今日任务完成');
  } else {
    console.log(clc.red('登录失败！'));
  }

  async function doTask(page, selector, pageIndex, stayTime) {
    await page.click(selector);
    await page.waitFor(5 * 1000);
    const pages = await browser.pages();
    const newPage = pages[pageIndex];
    await autoScroll(newPage);
    await newPage.waitFor(stayTime);
    await newPage.close();
    await page.bringToFront();
  }

  async function newsTask() {
    console.log(clc.yellow(`====开始 ${newsTaskConfig.task} 任务====`));
    let newsCount = 0;
    // 打开时评新闻列表页面 打开后pages=['','首页','时评页']
    await page.click(newsSelector.newsOpenBtn);
    await page.waitFor(waitTime);
    currentPages = await browser.pages();
    const shiPingPage = currentPages[2];
    const indexList = [];
    // 筛选日期为昨天的时评的index
    const newDates = await shiPingPage.$$eval(newsSelector.newsDate, els =>
      Array.from(els).map(el =>
        el.innerText.replace(/ /g, '')),
    );
    newDates.filter((item, index) => {
      if (item === taskDate) {
        indexList.push(index);
      }
    });

    async function viewNew(index) {
      console.log(`--------第 ${clc.green(newsCount + 1)} 条新闻 index=${index + 1} start--------`);
      // 打开时评新闻详情页面 打开后pages=['','首页','时评页','时评详情']
      console.log(`new position:(${index})`);
      console.log('发布时间：', clc.blue(newDates[index]));
      const viewTime = 2 + randomMin();
      // 选择器下标从 1 开始，数组下标需要 +1
      await doTask(shiPingPage, newsSelector.news(index + 1), 3, viewTime * 60 * 1000);
      console.log('观看时间：', viewTime, 'min');
      console.log(`++++++++第 ${clc.green(newsCount + 1)} 条新闻 end++++++++++`);
    }

    for (let index of indexList) {
      if (newsCount === 6) {
        // 看完6篇自动结束
        break;
      }
      await viewNew(index);
      newsCount++;
    }
    console.log(`////////////////////已经看了${newsCount}条新闻`);
    if (newsCount < 6) {
      console.log(`上一个工作日的新闻不满6条，需要往前多看${6 - newsCount}条`);
      const firstIndex = indexList[0];
      for (let i = 1; i <= 6 - newsCount; i++) {
        await viewNew(firstIndex - i);
        newsCount++;
      }
    }
    await shiPingPage.close();
    console.log(clc.yellow(`====结束 ${newsTaskConfig.task} 任务====`));
  }

  async function videoTask() {
    console.log(clc.yellow('====视频任务开始===='));
    // 视频任务 start
    let videoCount = 0;
    // 打开视频页面 打开后pages=['','首页','视频页']
    await page.click(videoSelector.videoOpenBtn);
    await page.waitFor(waitTime);
    currentPages = await browser.pages();
    // 打开视频第一频道页面 打开后 pages=['','首页','视频页','第一频道']
    // 打开视频的操作都在最后一个打开的页面进行
    await currentPages[2].click(videoSelector.diyipindao);
    await page.waitFor(waitTime);
    currentPages = await browser.pages();
    // 第一频道共五个专题 第四个专题略过
    for (let i = 1; i <= 5; i++) {
      if (videoCount < 6 && i !== 4) {
        console.log(clc.magentaBright(`第 ${i} 个栏目开始`));
        const currentPage = currentPages[3];
        await currentPage.click(videoSelector.menuSelector(i));
        await currentPage.waitFor(waitTime);
        // 切换成列表模式方便拿到视频日期，筛选前一天的视频，只看日期为前一天的视频
        await currentPage.click(videoSelector.list);
        await currentPage.waitFor(waitTime);
        console.log(clc.blue('切换到列表模式'));
        // 是看发布时间是前一天的新闻保证每天看的都不一样
        const indexList = [];
        const dateList = await currentPage.$$eval(videoSelector.videoDate, els => Array.from(els).map(el => {
          console.log(el.innerText);
          return el.innerText.replace(/ /g, '');
        }));
        const canViewNumber = dateList.filter((item, index) => {
          if (item === taskDate) {
            indexList.push(index);
            return item;
          }
        }).length;
        console.log(clc.blue(`该栏目有 ${canViewNumber} 个可看视频`));
        for (index of indexList) {
          if (videoCount === 6) {
            break;
          }
          const row = parseInt(index / COLITEMCOUNT) + 1;
          const col = parseInt(index % COLITEMCOUNT) + 1;
          console.log(`------第 ${clc.green(videoCount + 1)} 个视频任务 start------`);
          console.log(`video position: (${row}, ${col})`);
          console.log('发布时间：', clc.blue(dateList[index]));
          const viewTime = 3 + randomMin();
          await doTask(currentPages[3], videoSelector.videoSelector(row, col), 4, viewTime * 60 * 1000);
          console.log('观看时间：', viewTime, 'min');
          console.log(`++++++第 ${clc.green(videoCount + 1)} 个视频任务 end++++++++`);
          videoCount++;
          console.log(`///////////////已观看 ${clc.red(videoCount)} 个视频`);
        }
        console.log(clc.magentaBright(`第 ${i} 个栏目结束`));
      }
    }
    if (videoCount >= 6) {
      await currentPages[2].close();
      console.log(clc.yellow('====视频任务已完成===='));
    } else {
      console.log(clc.red(`还需 ${6 - videoCount} 个视频才可以完成任务`));
    }
  }

  await browser.close();
  console.log('浏览器已经关闭');
})();

