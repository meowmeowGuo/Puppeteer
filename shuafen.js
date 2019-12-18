let readTime = 2.5 * 60 * 1000;  // 文章2min+
let videoTime = 3.5 * 60 * 1000;  // 视频3min+
let news = document.querySelectorAll('[data-data-id = guyMNoYZuW] .text-wrap');
// let news = document.querySelectorAll('[data-data-id = shiping-text-list-grid] .grid-gr .grid-cell .text-link-item-title .text-wrap');
let videos = document.querySelectorAll('[data-data-id = news] .grid-cell .Pic .thePic');
let videos2 = document.querySelectorAll('.tab-panel-container [data-data-id=tvPanel1_1] .grid-box [data-link-target]');

let taskList = [
  {
    list: news,  // 任务列表
    time: readTime, // 每个任务执行时间
    count: 6, // 至少需要几个任务
  },
  {
    list: videos,
    time: videoTime,
    count: 6,
  },
  {
    list: videos2,
    time: videoTime,
    count: 3,
  },
];

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function runSingleTask(task) {
  let {list, time, count = 6} = task;
  for (let i = 0; i < (Math.min(count, list.length)); i++) {
    list[i].click();
    await sleep(time);
  }
}

async function runTaskList() {
  for (let task of taskList) {
    await runSingleTask(task);
  }
}


runTaskList();
