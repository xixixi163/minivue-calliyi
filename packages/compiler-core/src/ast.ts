import { CREATE_ELEMENT_VNODE } from "./runtimeHelpers"

export const enum NodeTypes {
    INTERPOLATION, // 插值类型
    SIMPLE_EXPRESSION, // 单一表达
    ELEMENT,
    TEXT,
    ROOT,
    COMPOUND_EXPRESSION // text或插值上方新增一个节点挂，并用加号连接
}

export function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE)
    return {
        type: NodeTypes.ELEMENT,
        tag,
        props,
        children
    }
}