import { extend } from "@mini-vue-calliyi/shared";
let activeEffect;
let shouldTrack = false;
export class ReactiveEffect {
    private _fn: any;
    deps = [];
    active = true;
    onStop?: () => void;
    public scheduler: Function | undefined
    constructor(fn, scheduler: Function) {
        this._fn = fn
        // scheduler 也要初始化 --
        this.scheduler = scheduler
    }
    run() {
        // 是否调用了stop，true表示没有
        if(!this.active) {
            return this._fn()
        }
        // 应该收集
        shouldTrack = true;
        // 全局的dep
        activeEffect = this;
        const r = this._fn();

        // 调用完 重置
        shouldTrack = false;
        
        return r // 执行依赖,并返回依赖的返回值
    }
    stop() {
        // 避免多次调用stop 消耗
        if(this.active) {
           cleanupEffect(this);
           if(this.onStop) {
            this.onStop()
           }
            this.active = false
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep: any) => {
        dep.delete(effect)
    })
    // TODO 优化 已清空this 直接length变为0
    effect.deps.length = 0;
}
let targetMap = new Map()
export function track(target, key) {
    // run的时候才有实例this赋值全局
    // if(!activeEffect) return;
    // if(!shouldTrack) return;
    if(!isTracking()) return;

    let depsMap = targetMap.get(target)
    if (!depsMap) {
        depsMap = new Map()
        targetMap.set(target, depsMap)
    }
    let dep = depsMap.get(key)
    if(!dep) {
        // dep集合 无重复
        dep = new Set();
        depsMap.set(key, dep)
    }
    trackEffects(dep)
}
// 抽离
export function trackEffects(dep) {
    // 看看 dep 之前有没有添加过，添加过的话  那么就不添加了
    if(dep.has(activeEffect)) return
    dep.add(activeEffect)

    // 反向存dep，effect 收集 依赖
    activeEffect.deps.push(dep)
}
// 优化
export function isTracking () {
    return shouldTrack && activeEffect !== undefined;
}
export function trigger(target, key) {
    const depsMap = targetMap.get(target);
    const dep = depsMap.get(key)
    triggerEffects(dep)
}
// 抽离
export function triggerEffects(dep) {
    for (const effect of dep) {
        // set update 不执行fn 执行scheduler
        if (effect.scheduler) {
            effect.scheduler()
        } else {
            effect.run();
        }
    }
}
export function effect (fn, options: any = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler)
    // 抽离object.assign
    extend(_effect, options)
    _effect.run();
    const runner: any = _effect.run.bind(_effect) // 返回fn,this指向当前实例，这个不会执行，相当于_effect.run
    runner.effect = _effect;
    return runner
}
export function stop(runner) {
    runner.effect.stop()
}