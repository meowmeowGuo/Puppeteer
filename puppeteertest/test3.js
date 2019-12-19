/*
* test3：自动操作浏览器
* new：新增登录操作
* */
const puppeteer = require('puppeteer');
const {autoScroll} = require('../util/functions');
const DEVCONFIG = require('./config/dev.config');

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // 是否以 无头模式 运行浏览器。默认是 true
    devtools: true, // 是否为每个选项卡自动打开DevTools面板
    args: ['--auto-open-devtools-for-tabs'],
  });

  /*
  //在点击按钮之前，事先定义一个promise，用于返回新tab的page对象
   const newPagePromise = new Promise(res =>
     browser.once('targetcreated',
       target => res(target.page()),
     ),
   );
   */
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
  await page.click('.login');
  // 登录系统
  await page.waitFor(2 * 1000);
  // await autoScroll(page);
  // 输入用户名密码
  await page.type('.login_enter_password', DEVCONFIG.lagou.username, {delay: 200}); // 设置延时使输入更像人工操作
  await page.type('.login_enter_password[type="password"]', DEVCONFIG.lagou.password, {delay: 200});
  // 点击登录按钮
  await page.click('div.login-btn.login-password.sense_login_password.btn-green');
  // 登录后等待30秒等页面加载，并手动完成验证码验证
  await page.waitFor(30 * 1000);
  const jobList = await page.$$('.position_link');
  console.log('jobList.length: ', jobList.length);
  let index = 1;
  while (index < jobList.length) {
    const selector = `li.con_list_item:nth-child(${index}) .position_link`;
    const item = page.$(selector);
    if (item) {
      console.log('click jobList: ', index);
      // 点击指定元素打开新页面tab
      await page.click(selector, 3 * 1000);
      await page.waitFor(2 * 1000);
      // 加载新页面后获取当前浏览器打开的所有页面对象
      const pages = await browser.pages();
      console.log(pages.length);
      const newPage = pages[2];
      await newPage.waitFor(2 * 1000);
      // 新页面tab操作
      await autoScroll(newPage);
      console.log(await newPage.title());
      // 关闭新页面tab
      await newPage.close();
      // 回到之前的tab
      await page.bringToFront();

    } else {
      console.log(`No node found for selector: ${selector}`);
    }
    index += 1;
  }

  await browser.close();

})();
