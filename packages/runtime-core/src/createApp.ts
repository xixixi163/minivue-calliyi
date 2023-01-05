import { createVNode } from "./vnode";

export function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            // 根节点
            mount(rootContainer) {
                // component——> vnode 转为虚拟节点
                // 所有逻辑操作 都会基于vnode 做处理
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer)
            }
        }
    }
}