const queue: any[] = []; // 微任务队列
const activePreFlushCbs: any[] = [] // watchEffect fn队列，在组件渲染前调用
let isFlushPending =false;

const p = Promise.resolve() // 创建一次promise即可
// 执行微任务 返回prromise
export function nextTick(fn?) {
    return fn ? p.then(fn) : p
}
export function queueJobs(job) {
    if(!queue.includes(job)) {
        queue.push(job)
    }
    // 执行一次
    queueFlush();
}

// 添加watchEffect 的fn队列
export function queuePreFlushCb(job) {
    activePreFlushCbs.push(job);

    // 调用
    queueFlush()
}

function queueFlush() {
    if(isFlushPending) return
    isFlushPending = true
    nextTick(flushJobs)
}

function flushJobs() {
    isFlushPending = false;
    let job;
    // component render before TODO 为什么这里是渲染前，是因为还没有调用微任务队列吗
    flushPreFlushCbs();

    // component render
    while((job = queue.shift())) {
        job && job();
    }
}
function flushPreFlushCbs() {
    for (let i = 0; i < activePreFlushCbs.length; i++) {
        activePreFlushCbs[i]()
    }
}

