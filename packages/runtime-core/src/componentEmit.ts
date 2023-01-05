import { camelize, toHandlerKey } from "@mini-vue-calliyi/shared";

export function emit(instance: any, event, ...args) {
    // 找到props的 event
    // console.log('emit', event)

    const { props } = instance;
    // TPP 小步走思想
    // 先写一个特定的行为 ——> 重构成通用的行为
    // 抽离
    // // add-foo ——> addFoo 转驼峰
    // const camelize = (str: string) => {
    //     // 一个参数表示匹配到的 _f,第二个参数表示f
    //     return str.replace(/-(\w)/g, (_, c: string) => {
    //         return c ? c.toUpperCase() : ''
    //     })
    // }
    // // add ——> Add
    // const capitalize = (str:string) => {
    //     return str.charAt(0).toUpperCase() + str.slice(1)
    // }
    // const toHandlerKey = (str: string) => {
    //     return str ? 'on' + capitalize(str) : ''
    // }
    const handlerName = toHandlerKey(camelize(event))
    const handler = props[handlerName];
    handler && handler(...args);
}