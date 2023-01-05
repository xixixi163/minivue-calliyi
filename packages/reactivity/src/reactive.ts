import { isObject } from '@mini-vue-calliyi/shared';
import { mutableHandlers, readonlyHandles, shallowReadonlyHandles } from './baseHandlers';

// 抽离 增加可读性
function createReactiveObject(target, baseHandlers) {
    if(!isObject(target)) {
        console.warn(`target ${target} 必须是一个对象`)
        return target
    }
    return new Proxy( target, baseHandlers)
}
export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly'
}
export function reactive (raw) {
    return createReactiveObject( raw, mutableHandlers)
}

export function readonly(raw) {
    return createReactiveObject( raw, readonlyHandles)
}

export function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandles)
}

export function isReactive (value) {
    //设置value 的key值，从而触发get get内部进行判断，判断后直接return  不进行操作
    return !!value[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(value) {
    // 非reactive值 设置key不会调用get，所以返回 undefined，需要加！！转boolean
    return !!value[ReactiveFlags.IS_READONLY]
}

export function isProxy(value) {
    return isReactive(value) || isReadonly(value)
}

