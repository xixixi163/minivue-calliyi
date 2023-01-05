import { ShapeFlags } from '@mini-vue-calliyi/shared'

export const Fragment = Symbol('Fragment');
export const Text = Symbol('Text')

export { createVNode as createElementVNode };
export function createVNode(type, props?, children?) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        key: props && props.key, // diff key
        shapeFlag: getShapeFlag(type),
        el: null
    }
    // children
    if(typeof children === 'string') {
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN // | 运算 给出类型 0100 或 （0010 | 0001），结果：0110，0101
    } else if (Array.isArray(children)) {
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    }

    // slot的shapeFlag: 组件 + children object
    if(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        if(typeof children === 'object') {
            vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
        }
    }
    return vnode;
}

function getShapeFlag(type) {
    return typeof type === 'string' ? 
    ShapeFlags.ELEMENT : 
    ShapeFlags.STATEFUL_COMPONENT
}

export function crateTextVNode(text: string) {
    return createVNode(Text, {}, text)
}