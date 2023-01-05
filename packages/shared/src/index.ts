export * from './toDisplayString'

export * from './ShapeFlags'

export const extend = Object.assign

export const EMPTY_OBJ = {}

export const isObject = (val) => {
    return val!==null && typeof val === 'object'
}

export const isString = (value) => typeof value === 'string'

// 判断两个对象是否相等
export function hasChanged(val,newVal) {
    return !Object.is(val, newVal)
}

export const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key)

// add-foo ——> addFoo 转驼峰
export const camelize = (str: string) => {
    // 一个参数表示匹配到的 _f,第二个参数表示f
    return str.replace(/-(\w)/g, (_, c: string) => {
        return c ? c.toUpperCase() : ''
    })
}
// add ——> Add
const capitalize = (str:string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}
// add ——> onAdd
export const toHandlerKey = (str: string) => {
    return str ? 'on' + capitalize(str) : ''
}