const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // 是否以 无头模式 运行浏览器。默认是 true
    devtools: true, // 是否为每个选项卡自动打开DevTools面板
  });
  /* const target = await browser.target();
   await target.screenshot({path: 'example.png'});*/
  const page = await browser.newPage();
  await page.goto('https://www.xuexi.cn/');
  await page.screenshot({path: 'example.png'});
})();
