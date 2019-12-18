/*
* test3：自动操作浏览器
* */
const puppeteer = require('puppeteer');
const {autoScroll} = require('./util/functions');

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // 是否以 无头模式 运行浏览器。默认是 true
    devtools: true, // 是否为每个选项卡自动打开DevTools面板
    args: ['--auto-open-devtools-for-tabs'],
  });

  //在点击按钮之前，事先定义一个promise，用于返回新tab的page对象
  const newPagePromise = new Promise(res =>
    browser.once('targetcreated',
      target => res(target.page()),
    ),
  );

  /* const target = await browser.target();
   await target.screenshot({path: 'example.png'});*/
  const page = await browser.newPage();
  await page.goto('https://www.lagou.com/gongsi/j124262.html', {
    waitUntil: 'load',
  });
  // 设置视图大小
  await page.setViewport({
    width: 1280,
    height: 960,
  });
  // 等待指定时间 second
  await page.waitFor(2 * 1000);
  await page.waitForSelector('#main_container');
  let title = await page.title();
  console.log(title);
  await autoScroll(page);
  const jobList = await page.$$('.position_link');
  const cids = await page.$$eval('.position_link', els => Array.from(els).map(el => el.href));
  console.log('jobList.length: ', jobList.length);
  let index = 0;
  while (index < cids.length) {
    const selector = `.position_link[href="${cids[index]}"]`;
    const item = page.$(selector);
    if (item) {
      console.log('click jobList: ', index);
      await page.click(selector, 3 * 1000);
      await page.waitFor(2 * 1000);
      const pages = await browser.pages();
      console.log(pages.length);
      const newPage = pages[2];
      await newPage.waitFor(2 * 1000);
      await autoScroll(newPage);
      console.log(await newPage.title());
      await newPage.close();
      await page.bringToFront();

    } else {
      console.log(`No node found for selector: ${selector}`);
    }
    index += 1;
  }

  // lagouScript();

})();
