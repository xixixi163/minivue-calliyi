
import { extend, isObject } from "@mini-vue-calliyi/shared";
import { track, trigger } from "./effect"
import { reactive, ReactiveFlags, readonly } from "./reactive";
// 初始化创建一次，不需要每次重复创建
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true)
// 抽离
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        // 判断逻辑直接return
        if(key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly
        } else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly
        }
        const res = Reflect.get(target, key)
        if (shallow) {
            // shallowReadonly 不需要嵌套响应式，也不需要收集依赖
            return res
        }
        if(isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res)
        }
        
        if (!isReadonly) {
            // TODO 收集依赖
            track(target, key)
        }
        return res
    }
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value)
        // TODO 触发依赖
        trigger(target, key)
        return res
    }
}
// 抽离对象
export const mutableHandlers = {
    // get: createGetter(),  // 抽离get fn
    // set: createSetter()
    get,
    set
}

export const readonlyHandles = {
    // get: createGetter(true),
    get: readonlyGet,
    set(target, key, value) {
        // 警告
        console.warn(`key: ${key} set 失败 因为 target 是 readonly`, target)
        return true
    }
}

export const shallowReadonlyHandles = extend({}, readonlyHandles, { // 创建一个空的初始对象放进去，第一个参数会被改变内存值，所以要{}
    get: shallowReadonlyGet
})