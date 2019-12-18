/* *
* test1：用Puppeteer截图
* */
const puppeteer = require('puppeteer');
const path = require('path');
const {autoScroll} = require('./util/functions');

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // 是否以 无头模式 运行浏览器。默认是 true
    devtools: true, // 是否为每个选项卡自动打开DevTools面板
    args: ['--auto-open-devtools-for-tabs'],
  });
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
  const title = await page.title();
  console.log('page title:', title);
  await autoScroll(page); // 针对带有懒加载的页面滚动一下在进行截图
  // 截屏
  await page.screenshot({
    path: path.join(__dirname, './cacheData/test1.png'),
    fullPage: true,
  });
  await browser.close();
})();
