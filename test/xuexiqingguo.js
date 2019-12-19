/*
* test3：自动操作浏览器
* new：新增登录操作
* */
const puppeteer = require('puppeteer');
const {autoScroll} = require('../puppeteertest/util/functions');

const COLITEMCOUNT = 2;
const selector = {
  videoOpenBtn: '[data-locations="7"]',
  diyipindao: '[data-data-id="menuList"] .grid-cell:nth-child(1) .item-text',
  menuSelector: (index) => `.container.top .tab-panel-container .left-item .horizontal-item:nth-child(${index}) .tab-item`,
  list: '.list', // 列表形式显示视频，方便校验日期
  videoDate: '.text-link-item-title .extra-wrap .text',
  videoSelector: (row, col) => `.tab-panel-container .tab-panel-container section > div:nth-child(3) > section .grid-gr:nth-child(${row}) .grid-cell:nth-child(${col}) .text-wrap`,
};

const waitTime = 5 * 1000;
const newsTaskConfig = {
  task: '看新闻',
  time: 2.5 * 60 * 1000, // 2 min 以上
  openBtn: '[data-data-id="xxxal"] .grid-gr:nth-child(1) .grid-cell section section div.extra > span', // 打开新闻列表的按钮选择器
  newSelector: (index) => `[data-data-id="shiping-text-list-grid"] .grid-cell:nth-child(${index}) .text-link-item-title`,
  needCount: 6,
};

const today = new Date();
const todayFormat = `${today.getFullYear()}-${today.getMonth() + 1} - ${today.getDate()}`;
const yesterday = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate() - 1}`;

(async () => {
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
    width: 1440,
    height: 790,
  });
  let currentPages = await browser.pages();
  // 等待指定时间 second
  await page.waitFor(waitTime);
  // 给30s的时间扫码登录
  await page.waitFor(30 * 1000);
  let title = await page.title();
  // 登录页面title='用户登录'，登录成功后title='学习强国'
  console.info(title);

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
    console.info(`开始 ${newsTaskConfig.task} 任务`);
    for (let i = 0; i < newsTaskConfig.needCount; i++) {
      console.log(`开始第${i + 1}条新闻`);
      await doTask(page, newsTaskConfig.newSelector(i + 1), 2, newsTaskConfig.time);
      /*
      await page.click(newsTaskConfig.newSelector(i + 1));
      await page.waitFor(5 * 1000);
      const pages = await browser.pages();
      const newPage = pages[2];
      await autoScroll(newPage);
      await newPage.waitFor(newsTaskConfig.time);
      await newPage.close();
      await page.bringToFront();
      */
      console.log(`结束第${i + 1}条新闻`);
    }
    console.warn(`结束 ${newsTaskConfig.task} 任务`);
  }

  async function videoTask() {
    // 视频任务 start
    const videoCount = 0;
    // 打开视频页面 此时pages=['','首页','视频页']
    await page.click(selector.videoOpenBtn);
    await page.waitFor(waitTime);
    currentPages = await browser.pages();
    // 打开视频第一频道页面 此时pages=['','首页','视频页','第一频道']
    // 打开视频的操作都在最后一个打开的页面进行
    await currentPages[2].click(selector.diyipindao);
    await page.waitFor(waitTime);
    currentPages = await browser.pages();
    // 第一频道的五个专题 第四个专题略过
    for (let i = 1; i <= 5; i++) {
      console.log('视频任务开始');
      if (videoCount < 6 && i !== 4) {
        console.log(`第 ${i} 个栏目开始`);
        const currentPage = currentPages[3];
        await currentPage.click(selector.menuSelector(i));
        await currentPage.waitFor(waitTime);
        // 切换成列表模式方便拿到视频日期
        await currentPage.click(selector.list);
        await currentPage.waitFor(waitTime);
        console.log('切换到列表模式');
        // 是看发布时间是前一天的新闻保证每天看的都不一样
        const dateList = (await currentPage.$$eval(selector.videoDate, els => Array.from(els).map(el => {
          console.log(el.innerText);
          return el.innerText;
        })));
        const canViewNumber = dateList.filter(date => date === yesterday).length;
        console.log(`该栏目有 ${canViewNumber} 个可看视频`);
        const rowCount = Math.ceil(canViewNumber / 2);
        for (let row = 1; row <= rowCount; row++) {
          let col = 1;
          while (col + (row - 1) * COLITEMCOUNT <= canViewNumber) {
            // 打开视频详情页面 此时pages=['','首页','视频页','第一频道','视频详情']
            // await page.click(selector.videoSelector(row, col));
            // await page.waitFor(waitTime);
            console.log(`开始第 ${col + (row - 1) * COLITEMCOUNT} 个视频任务`);
            await doTask(currentPages[3], selector.videoSelector(row, col), 4, 3.5 * 60 * 1000);
            console.log(`第 ${col + (row - 1) * COLITEMCOUNT} 个视频任务结束`);
          }
        }
        console.log(`第 ${i} 个栏目结束`);
      }
    }
    if (videoCount >= 6) {
      console.log('视频任务已完成');
    } else {
      console.log(`还需 ${6 - videoCount} 个视频才可以完成任务`);
    }
  }

  if (title === '学习强国') {
    console.info('登陆成功');
    console.info('任务开始');
    await newsTask();
    await videoTask();
    console.warn('今日任务完成');
  } else {
    console.error('登录失败！');
  }
  await browser.close();
  console.log('浏览器已经关闭');
})();

