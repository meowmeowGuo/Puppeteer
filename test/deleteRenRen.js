const puppeteer = require('puppeteer');
const {autoScroll} = require('../util/functions');

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // 是否以 无头模式 运行浏览器。默认是 true
    devtools: true, // 是否为每个选项卡自动打开DevTools面板
    args: ['--auto-open-devtools-for-tabs'],
  });
  const page = await browser.newPage();
  await page.goto('http://www.renren.com/444666193/profile', {
    waitUntil: 'load',
  });
  // 设置视图大小
  await page.setViewport({
    width: 1280,
    height: 960,
  });
  // 等待指定时间 second
  await page.waitFor(2 * 1000);
  await page.waitFor('#email');
  await page.type('#email', '15827061459', {delay: 200}); // 设置延时使输入更像人工操作
  await page.type('#password', 'miao940114', {delay: 200});
  await page.click('#login');
  await page.waitFor(3000);
  const title = await page.title();
  page.$$('.tl-feed-actions .edit-this .del')
  console.log('page title:', title);
  await autoScroll(page); // 针对带有懒加载的页面滚动一下在进行截图

  const list = await page.$$('.timeline_feed');
  for (let i = 1;i<=list.length;i++){
    //  循环点击隐藏
    await page.click(`.timeline_feed:nth-child(${i}) .tl-feed-actions .edit-this .del`);
    // 点击确定
    await page.waitFor('.input-submit');
    await page.click('.input-submit:nth-child(1)')
  }

  // page.$$eval('.timeline_feed .tl-feed-actions .edit-this .del',divs=>{
  //   for await (let item  of Array.from(divs)){
  //     await page.click(item);
  //   }
    
  // })
  
  await browser.close();
})();