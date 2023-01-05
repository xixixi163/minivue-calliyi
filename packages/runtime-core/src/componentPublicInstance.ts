import { hasOwn } from "@mini-vue-calliyi/shared";

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props
}
export const PublicInstanceProxyHandlers = {
    // {_: instance} 别名
    get({_: instance}, key) {
        // setupState 也就是 setup()的返回值;props 组件传入的值
        const { setupState, props } = instance;
        
        if (hasOwn(setupState, key)) {
            return setupState[key]
        } else if (hasOwn(props, key)) {
            return props[key]
        }
        // map 形式取值，后期还有有$data setup——> options data 等
        // if(key === '$el') {
        //     console.log(instance.vnode.el);
            
        //     return instance.vnode.el
        // }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance) // 执行
        }
    }
}