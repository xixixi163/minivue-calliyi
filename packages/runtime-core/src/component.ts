import { proxyRefs, shallowReadonly } from "@mini-vue-calliyi/reactivity";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

export function createComponentInstance(vnode, parent) {
    console.log('createComponentInstance', parent);
    
    const component = {
        vnode,
        type: vnode.type, // 方便拿type
        next: null, // 要更新的虚拟节点
        setupState: {}, // 初始化setup对象空
        props: {},
        slots: {},
        provides: parent ? parent.provides : {}, // 指向父级的provides
        parent,
        isMounted: false,
        subTree: {},
        emit: () => {}
    };
    // bind(null, component 第一个参数表示this，即用户不需要传instance，emit中就可以直接拿到this props
    component.emit = (emit.bind(null, component) as any);
    return component
}

// setup 组件
export function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props)
    initSlots(instance, instance.vnode.children)

    // vue3中还有函数组件，是没有状态的
    // 初始化有状态的组件
    setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
    const Component = instance.type;  // type 也就是options

    // proxy 实现 render函数使用this，setup的实例绑定到render
    // 第一个参数 ctx
    instance.proxy = new Proxy({_: instance}, PublicInstanceProxyHandlers)

    const { setup } = Component;

    if (setup) {
        setCurrentInstance(instance)
        // setupResult 是 function ——> 也是返回了render函数  object——>则注入到上下文中
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        }); // 返回setup的返回值，要执行

        setCurrentInstance(null)
        handleSetupResult(instance, setupResult);
    } else {
        finishComponentSetup(instance)
    }
}
function handleSetupResult(instance, setupResult: any) {
    
    // setup 返回值不一样的话，会有不同的处理
  // 1. 看看 setupResult 是个什么
  if (typeof setupResult === "function") {
    // 如果返回的是 function 的话，那么绑定到 render 上
    // 认为是 render 逻辑
    // setup(){ return ()=>(h("div")) }
    instance.render = setupResult;
  } else if (typeof setupResult === 'object') { // function ——> render函数  object——注入上下文
        instance.setupState = proxyRefs(setupResult) // ref包裹变量，this拿到其value值，非object
    }

    finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
    const Component = instance.type;

    // 生成render函数
    if(compile && !Component.render) {
        if(Component.template) {
            Component.render = compile(Component.template)
        }
    }

    // if(Component.render) {
        // 先默认有render
        instance.render = Component.render
    // }    
}

let currentInstance = null;
export function getCurrentInstance() {
    return currentInstance
}

// 起中间层作用，更改instance 方便追踪，打断点
export function setCurrentInstance(instance) {
    currentInstance = instance
}

// 拿到compiler的引用
let compile;
export function registerRuntimeCompiler(_compile) {
    compile = _compile;
}