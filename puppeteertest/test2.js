/* *
* test2：爬取 minieye 拉钩职位列表
* */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const {autoScroll} = require('../util/functions');

const WRITE_FILE_DIR = path.join(__dirname, './cacheData'); // 请求数据存储的文件目录

(async () => {
  const TOTAL_PAGE = 4;
  const browser = await puppeteer.launch();
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
  const writeList = [];
  for (let pageNumber = 1; pageNumber <= TOTAL_PAGE; pageNumber++) {
    const list = await handleData(page);
    writeList.push(...list);
    await page.click('.next');
    await page.waitFor(2 * 1000);
    await autoScroll(page);
  }
  await saveResDataToJsonFile(writeList);
  await browser.close();
})();

// 处理爬虫需求
async function handleData(page) {
  return await page.evaluate(() => {
    const positionList = [];
    let itemList = document.querySelectorAll('.item_con_list li');
    for (let item of itemList) {
      const titleInfo = item.querySelector('.position_link').innerText.replace(/ /g, '');
      const positionId = item.querySelector('.position_link').getAttribute('data-lg-tj-cid');
      // 要爬取的数据结构
      const positionDesc = item.querySelector('.item_desc').innerText.replace(/ /g, '');
      let writeData = {
        positionId,
        position: titleInfo.match(/(.*)\[/)[1],
        address: titleInfo.match(/\[(.*)\]/)[1],
        workYear: positionDesc[0],
        education: positionDesc[1],
        jobType: positionDesc[2],
        date: item.querySelector('.item_date').innerText.replace(/ /g, ''),
        salary: item.querySelector('.item_salary').innerText.replace(/ /g, ''),
      };
      positionList.push(writeData);
    }
    return positionList;
  });
}

function saveResDataToJsonFile(data) {
  if (!fs.existsSync(WRITE_FILE_DIR)) {
    fs.mkdirSync(WRITE_FILE_DIR);
  }
  const filePath = `${WRITE_FILE_DIR}/allPosition.json`;
  fs.writeFile(filePath, JSON.stringify(data), 'utf8', err => {
    if (err) {
      console.log(`文件保存出错,filePath：${filePath} `);
      console.log(err);
    } else {
      console.log(`文件保存成功,filePath：${filePath} `);
    }
  });
}
