import { createVNode, Fragment } from "../vnode";

/**
 * 
 * @param slots children object key:name,value:function可带参
 * @param name slot的name
 * @param props slot的参数
 * @returns 
 */
export function renderSlots(slots, name, props) {
    const slot = slots[name];
    if(slot) {
        if (typeof slot === 'function') {
            // 优化slot中每个都会包裹div标签，怎么样只渲染children，使用Fragment，patch时特殊处理
            return createVNode(Fragment, {}, slot(props))
        }
    }
}