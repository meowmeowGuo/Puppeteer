# 前端自动化工具 Puppeteer 使用

[`Puppeteer API文档`](https://zhaoqize.github.io/puppeteer-api-zh_CN/#?product=Puppeteer&version=v2.0.0&show=outline)

`puppeteertest/`
* test1：用Puppeteer截图浏览器界面(根据文档即可)
* test2：用Puppeteer改写minieye拉钩招聘的爬虫（不通过接口，直接爬取页面内容）
* test3：Puppeteer 自动操作浏览器页面(打开新页面，关闭新页面，回到原标签，登录等操作)
---

实践  

`test/xuexiqiangguo` 某个学习平台WEB端刷分脚本

---

## 1. Puppeteer 简介及安装
Puppeteer(中文翻译”木偶”)是 Google Chrome 团队官方的无界面（Headless）Chrome 工具（可以通过
修改配置项显示 gui，来直观的观察页面的操作），它是一个 Node 库，提供 了一个高级的 API 来控制
DevTools 协议上的无头版 Chrome 。也可以配置为使用完整（非 无头）的 Chrome。通过 Puppeteer
可以完成在浏览器中需要手动完成的大部分事情：
1. 生成页面的截图或者PDF（test1）
2. 抓取 SPA 并生成预先呈现的内容即（SSR）
3. 从网站抓取需要的内容（爬虫）（test2）
4. 自动表单提交，UI测试，键盘输入等 （test3）
5. 创建一个最新的自动化测试环境。使用最新的JavaScript和浏览器功能，直接在最新版本的Chrome中运行测试
6. 捕获您的网站的时间线跟踪，以帮助诊断性能问题。 

截止到2019.12.19 测试脚本中只涉及到1、3、4、5

安装 Puppeteer：
 
```
npm i puppeteer
or
yarn add puppeteer
```

## 2. Puppeteer  使用
### 2.1 简单的页面截图（puppeteertest/test1）
目标：截取 minieye 拉钩首页（url：https://www.lagou.com/gongsi/j124262.html）
 
puppeteer基本上每个操作都会返回一个Promise,记得要用await接收下。

```javascript
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  // 启动浏览器
  const browser = await puppeteer.launch();
  // 生成 page 对象
  const page = await browser.newPage();
  // 跳转到 minieye 拉钩招聘列表
  await page.goto('https://www.lagou.com/gongsi/j124262.html', {
    waitUntil: 'networkidle0', // 满足什么条件认为页面跳转完成
  });
  // 设置页面视图大小
  await page.setViewport({
    width: 1280,
    height: 960,
  });
  // 等待指定时间 second
  await page.waitFor(2 * 1000);
  // 等待指定 DOM 节点
  await page.waitForSelector('#main_container');
  const title = await page.title();
  console.log('page title:', title);
  // await autoScroll(page); // 针对带有懒加载的页面滚动加载完成后再进行截图
  // 截屏
  await page.screenshot({
    path: path.join(__dirname, './cacheData/test1.png'),
    fullPage: true,
  });
  await browser.close();
})();
```

### 2.2 基本用法
#### 2.2.1 启动/关闭 Chromium
Puppeteer 模块提供了一种启动 Chromium 实例的方法。可以通过启动的配置项决定是否需要显示gui，最后，
需要关闭 Chromium，打开及关闭 Chromium 如下 

```javascript
const puppeteer = require('puppeteer');

puppeteer.launch().then(async browser => {
  const page = await browser.newPage(); // 获取 page 对象
  await page.goto('https://www.lagou.com/gongsi/j124262.html');
  // 其他操作...
  await browser.close();
});
```
通过 Puppeteer 启动 Chromium 的默认视窗大小是 800×600，也可以通过启动时的配置项进行调整

---

#### 2.2.2 页面等待
进入页面后，需要一些间隔时间来模拟的更像浏览器，以及二维码登录时无法直接使用工具绕过，因此可用此方法预留
扫码时间， 单位是ms。具体用法如下：

```javascript
await page.waitFor(2 * 1000) // 停留2s，2s后再做其他操作
```
在 `test/xuexiqingguo` 中，登录必须要用APP扫码，因此需要预留时间（例子中是30s ），扫码登录后，
再做后续的操作。

---

#### 2.2.3 模拟点击和输入
浏览器自动化的基本需求是点击和输入可以自动化，这两点可以保证简单的页面登录，翻页，打开新的链接等，
下面代码中的`.login_enter_password`是选择器， 可参考 `docment.querySelector` 的用法

```javascript
await page.type('.login_enter_password', 'username', {delay: 200}); // 设置延时使输入更像人工操作
await page.type('.login_enter_password[type="password"]', 'password', {delay: 200});
await page.click('div.login-btn.login-password.sense_login_password.btn-green');
```
上述三行代码是拉钩网登录页面的用户名输入，密码输入自动化，以及登录自动化，设置的延时200ms，如果在浏览器
启动时打开了gui，那就可以看到用户名和密码慢慢的一个一个字符输入，拉勾网登录后有图片验证码，可以结合
2.2.2 设置页面等待，手动点击验证码验证成功后即可登陆成功

---

#### 2.2.4 切换浏览器tab页
点击操作可能会打开一个新的tab，此时浏览器的 page 对象依然是前一个tab的，
为了在新开的标签页做一些操作， 需要获取到新开的tab的 page 对象，需要用到 `browser.pages()`，
该API可以获取到当前浏览器打开的所有页面的 page 对象集合 

```javascript
const pages = await browser.pages(); // 当前所有 page 对象集合
/*
* 初始是['']
* 打开一个页面后 ['',page1]
* 在 page1点击某个连接打开了新页面后['',page1,page2]
* */
const newPage = pages[2]; // 最后一个tab页即为新打开的tab页。
```
新开一个tab页后，需要在新页面进行点击操作时使用newPage对象

---

#### 2.2.5 获取DOM节点及相关信息
WebAPI中可通过 `documet.querySelector`,`documet.querySelectorAll`获取到dom节点，在通过
`DOM.getAttribute()`获取节点的指定属性值，Puppeteer中的两个类似的API为 `page.$eval()`,
`page.$$eval()`，

1. `page.$$eval(selector, pageFunction[, ...args])`
 *  selector < string > 一个框架选择器
 *  pageFunction < function > 在浏览器实例上下文中要执行的方法
 *  ...args < ...Serializable|JSHandle > 要传给 pageFunction 的参数。
    （比如你的代码里生成了一个变量，在页面中执行方法时需要用到，可以通过这个 args 传进去)
 *  返回: < Promise< Serializable > > Promise对象，完成后是 pageFunction 的返回值 此 方法在
    页面内执行 Array.from(document.querySelectorAll(selector))，
    然后把匹配到的元素数组作为第一个参数传给 pageFunction。
2. `page.$eval(selector, pageFunction[, ...args])` 
  *   selector < string > 选择器 
  * pageFunction <function> 在浏览器实例上下文中要执行的方法
  * ...args <...Serializable|JSHandle> 要传给 pageFunction 的参数。
    （比如你的代码里生成了一个变量，在页面中执行方法时需要用到，可以通过这个 args 传进去） 
  * 返回: <Promise<Serializable>> Promise对象， 完成后是 pageFunction 的返回值
  此方法在页面内执行 document.querySelector，然后把匹配到的元素作为第一个参数传给
  pageFunction。
  
示例：

```javascript
// 所有 a 标签的href集合
const links = await page.$$eval('a', els => Array.from(els).map(el => el.href));
// 第一个a标签的href值
const link = await page.$$eval('a', el => el.href);

```
webAPI中写法分别为
```javascript
const links = Array.from(document.querySelectorAll('a')).map(el=>el.getAttribute('href'));
const link = document.querySelector('a').getAttribute('href');
```
