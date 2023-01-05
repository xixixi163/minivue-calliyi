const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    // children
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */; // | 运算 给出类型 0100 或 （0010 | 0001），结果：0110，0101
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // slot的shapeFlag: 组件 + children object
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === 'string' ?
        1 /* ShapeFlags.ELEMENT */ :
        2 /* ShapeFlags.STATEFUL_COMPONENT */;
}
function crateTextVNode(text) {
    return createVNode(Text, {}, text);
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

/**
 *
 * @param slots children object key:name,value:function可带参
 * @param name slot的name
 * @param props slot的参数
 * @returns
 */
function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            // 优化slot中每个都会包裹div标签，怎么样只渲染children，使用Fragment，patch时特殊处理
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const isString = (value) => typeof value === 'string';
// 判断两个对象是否相等
function hasChanged(val, newVal) {
    return !Object.is(val, newVal);
}
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
// add-foo ——> addFoo 转驼峰
const camelize = (str) => {
    // 一个参数表示匹配到的 _f,第二个参数表示f
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
};
// add ——> Add
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
// add ——> onAdd
const toHandlerKey = (str) => {
    return str ? 'on' + capitalize(str) : '';
};

let activeEffect;
let shouldTrack = false;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = true;
        this._fn = fn;
        // scheduler 也要初始化 --
        this.scheduler = scheduler;
    }
    run() {
        // 是否调用了stop，true表示没有
        if (!this.active) {
            return this._fn();
        }
        // 应该收集
        shouldTrack = true;
        // 全局的dep
        activeEffect = this;
        const r = this._fn();
        // 调用完 重置
        shouldTrack = false;
        return r; // 执行依赖,并返回依赖的返回值
    }
    stop() {
        // 避免多次调用stop 消耗
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    // TODO 优化 已清空this 直接length变为0
    effect.deps.length = 0;
}
let targetMap = new Map();
function track(target, key) {
    // run的时候才有实例this赋值全局
    // if(!activeEffect) return;
    // if(!shouldTrack) return;
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        // dep集合 无重复
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
// 抽离
function trackEffects(dep) {
    // 看看 dep 之前有没有添加过，添加过的话  那么就不添加了
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    // 反向存dep，effect 收集 依赖
    activeEffect.deps.push(dep);
}
// 优化
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    const dep = depsMap.get(key);
    triggerEffects(dep);
}
// 抽离
function triggerEffects(dep) {
    for (const effect of dep) {
        // set update 不执行fn 执行scheduler
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // 抽离object.assign
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect); // 返回fn,this指向当前实例，这个不会执行，相当于_effect.run
    runner.effect = _effect;
    return runner;
}
function stop(runner) {
    runner.effect.stop();
}

// 初始化创建一次，不需要每次重复创建
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
// 抽离
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        // 判断逻辑直接return
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            // shallowReadonly 不需要嵌套响应式，也不需要收集依赖
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            // TODO 收集依赖
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // TODO 触发依赖
        trigger(target, key);
        return res;
    };
}
// 抽离对象
const mutableHandlers = {
    // get: createGetter(),  // 抽离get fn
    // set: createSetter()
    get,
    set
};
const readonlyHandles = {
    // get: createGetter(true),
    get: readonlyGet,
    set(target, key, value) {
        // 警告
        console.warn(`key: ${key} set 失败 因为 target 是 readonly`, target);
        return true;
    }
};
const shallowReadonlyHandles = extend({}, readonlyHandles, {
    get: shallowReadonlyGet
});

// 抽离 增加可读性
function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} 必须是一个对象`);
        return target;
    }
    return new Proxy(target, baseHandlers);
}
function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandles);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandles);
}
function isReactive(value) {
    //设置value 的key值，从而触发get get内部进行判断，判断后直接return  不进行操作
    return !!value["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */];
}
function isReadonly(value) {
    // 非reactive值 设置key不会调用get，所以返回 undefined，需要加！！转boolean
    return !!value["__v_isReadonly" /* ReactiveFlags.IS_READONLY */];
}
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}

class refImpl {
    constructor(value) {
        this._v_isRef = true;
        this._rawValue = value;
        // value --- reactive  看看value 是不是对象
        this._value = convert(value);
        // 初始化dep
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 一定先去修改了 value 的  
        // 前后值不一样，不set
        if (hasChanged(this._rawValue, newValue)) {
            this._rawValue = newValue;
            // newValue ——> this._value
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
// 抽离
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function ref(value) {
    return new refImpl(value);
}
function isRef(ref) {
    // 创建ref类的时候给一个值，判断是否有这个值
    return !!ref._v_isRef;
}
function unRef(ref) {
    // 是ref 返回value值
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    // 通过proxy 知道他调用了get set
    return new Proxy(objectWithRefs, {
        get(target, key) {
            //ref类型 直接返回.value 
            // not ref ——> value
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            // 原值 ref ，new not ref
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                Reflect.set(target, key, value);
            }
        }
    });
}

function emit(instance, event, ...args) {
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
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
    // attrs
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props
};
const PublicInstanceProxyHandlers = {
    // {_: instance} 别名
    get({ _: instance }, key) {
        // setupState 也就是 setup()的返回值;props 组件传入的值
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        // map 形式取值，后期还有有$data setup——> options data 等
        // if(key === '$el') {
        //     console.log(instance.vnode.el);
        //     return instance.vnode.el
        // }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance); // 执行
        }
    }
};

/**
 *
 * @param instance
 * @param children 为对象 key name value:function
 */
function initSlots(instance, children) {
    // instance.slots = Array.isArray(children) ? children : [children]
    // // instance.slots 直接传入引用，就不用对slots 赋值给instance
    // 判断是否是slot
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}
function normalizeObjectSlots(children, slots) {
    // const slots = {};
    for (const key in children) {
        const value = children[key]; // function
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
    // instance.slots = slots;
}

function createComponentInstance(vnode, parent) {
    console.log('createComponentInstance', parent);
    const component = {
        vnode,
        type: vnode.type,
        next: null,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: () => { }
    };
    // bind(null, component 第一个参数表示this，即用户不需要传instance，emit中就可以直接拿到this props
    component.emit = emit.bind(null, component);
    return component;
}
// setup 组件
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    // vue3中还有函数组件，是没有状态的
    // 初始化有状态的组件
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type; // type 也就是options
    // proxy 实现 render函数使用this，setup的实例绑定到render
    // 第一个参数 ctx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        // setupResult 是 function ——> 也是返回了render函数  object——>则注入到上下文中
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        }); // 返回setup的返回值，要执行
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
    else {
        finishComponentSetup(instance);
    }
}
function handleSetupResult(instance, setupResult) {
    // setup 返回值不一样的话，会有不同的处理
    // 1. 看看 setupResult 是个什么
    if (typeof setupResult === "function") {
        // 如果返回的是 function 的话，那么绑定到 render 上
        // 认为是 render 逻辑
        // setup(){ return ()=>(h("div")) }
        instance.render = setupResult;
    }
    else if (typeof setupResult === 'object') { // function ——> render函数  object——注入上下文
        instance.setupState = proxyRefs(setupResult); // ref包裹变量，this拿到其value值，非object
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    // 生成render函数
    if (compile && !Component.render) {
        if (Component.template) {
            Component.render = compile(Component.template);
        }
    }
    // if(Component.render) {
    // 先默认有render
    instance.render = Component.render;
    // }    
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
// 起中间层作用，更改instance 方便追踪，打断点
function setCurrentInstance(instance) {
    currentInstance = instance;
}
// 拿到compiler的引用
let compile;
function registerRuntimeCompiler(_compile) {
    compile = _compile;
}

function provide(key, value) {
    // 存
    // 把传进来的key value值赋值到instance 的provides
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        // 通过object create将provides指向父级的provides
        // init操作 不应该每次都操作 初始component的时候 provides会等于父级的provides由此判断
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        // 值改变了，就不会再init
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 取
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            // 根节点
            mount(rootContainer) {
                // component——> vnode 转为虚拟节点
                // 所有逻辑操作 都会基于vnode 做处理
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            }
        };
    };
}

function shouldUpdateComponent(n1, n2) {
    const { props: prevProps } = n1;
    const { props: nextProps } = n2;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

const queue = []; // 微任务队列
const activePreFlushCbs = []; // watchEffect fn队列，在组件渲染前调用
let isFlushPending = false;
const p = Promise.resolve(); // 创建一次promise即可
// 执行微任务 返回prromise
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    // 执行一次
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    // component render before TODO 为什么这里是渲染前，是因为还没有调用微任务队列吗
    flushPreFlushCbs();
    // component render
    while ((job = queue.shift())) {
        job && job();
    }
}
function flushPreFlushCbs() {
    for (let i = 0; i < activePreFlushCbs.length; i++) {
        activePreFlushCbs[i]();
    }
}

// createRenderer 闭包的形式，传入渲染接口，让渲染是依赖function，而不是具体的渲染实现，实现自定义渲染器
function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null, null);
    }
    // n1 旧的vnode   n2 新的vnode
    function patch(n1, n2, container, parentComponent = null, anchor) {
        const { type, shapeFlag } = n2; // type 为节点标签名
        // TODO 判断vnode 是不是一个element
        // 是 element 那么就应该处理 element
        // 思考题：如何去区分 element 还是 component 类型呢，因为element没有render，会导致后面instance加入render undefined
        // console.log(vnode.type, '9999');
        // ShapeFlags 虚拟节点的类型  Fragment 只渲染所有的children
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // element
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                    // STATEFUL_COMPONENT
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 去处理组件
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            // init
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log('n1', n1);
        console.log('n2', n2);
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el); // n1的el赋值给n2，让新n2有el
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapeFlag = n1.shapeFlag;
        const { shapeFlag } = n2;
        const c1 = n1.children;
        const c2 = n2.children;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 1）.old array, new text
                // 1、把老的 children 清空
                unmountChildren(n1.children);
                // 2、设置 text
            }
            // 2) old text new text,如果两个值相等不修改；1）2）新值均为text
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
            //     hostSetElementText(container, c2);
            // } else {
            //     // 2) old text new text,如果两个值相等不修改
            //     if (c1 !== c2 ) {
            //         hostSetElementText(container, c2);
            //     }
            // }
        }
        else {
            // if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(container, '');
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // array diff array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        const l2 = c2.length;
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        function isSomeVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor); // 递归更改，比对后，并改值
            }
            else {
                break;
            }
            i++;
        }
        console.log(i, 'iiiiiii');
        // 右侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor); // 递归更改，比对后，并改值
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 新的比老的长，长的部分在右侧 or 左侧
        if (i > e1) {
            if (i <= e2) {
                // 锚点位置以e2+1为准，因为新增的可能有多个
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                // 新增的可能有多个
                while (i <= e2) {
                    // 锚点不变 新增
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
            // 老的比新的长
        }
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 比对中间
            let s1 = i;
            let s2 = i;
            const toBePatched = e2 - s2 + 1; // new乱序 total
            let patched = 0; // 已经比对处理的个数
            const keyToNewIndexMap = new Map(); // 新值key和index的映射
            const newIndexToOldIndexMap = new Array(toBePatched); // 定长
            // 定义变量 记录newIndex 的最大值，如果当前的值，小于上一次的值，则表示需要移动
            let moved = false; // TODO 后面不需要重新初始化吗
            let maxNewIndexSoFar = 0;
            // 初始化，为0
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            for (let index = s2; index <= e2; index++) {
                const nextChild = c2[index];
                keyToNewIndexMap.set(nextChild.key, index);
            }
            for (let index = s1; index <= e1; index++) {
                const prevChild = c1[index];
                // 如果处理完了new乱序的个数，则跳过以下处理逻辑 进入下一个循环
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex; // 新的key是否存在旧的里，有的话值为新值的index
                // 有设置key时
                if (prevChild.key !== null) { // null or undefined
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // TODO 这里为什么不 小于等于  估计写错了 还是要的,因为都是索引两个值
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                // 新的key不再旧的里
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    // 移动位置，有key时映射 
                    newIndexToOldIndexMap[newIndex - s2] = index + 1; // 下标0开始;值不能为0，+1 不对应下标
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            // 获取最长递增子序列
            const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
            let j = increasingNewIndexSequence.length - 1;
            // 倒叙，因为需要移动的值，要获取锚点插入，正序的话，这个锚点不好找，e前面的值，都可能不稳定
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = s2 + i;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                // 新增的插入
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
        console.log(e1, e2, 'eee');
    }
    function unmountChildren(children) {
        for (let index = 0; index < children.length; index++) {
            const el = children[index].el;
            // remove
            hostRemove(el);
        }
    }
    // 比对props
    function patchProps(el, oldProps, newProps) {
        // 优化点 两个对象不相等时再循环
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                // 是否有 key 去掉
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        // vnode.el 这里赋值，拿不到，element还没有mount完
        // 处理type props children
        const el = (vnode.el = hostCreateElement(vnode.type));
        // children  string 或 array
        const { children } = vnode;
        // text_child
        if (vnode.shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
            // array_child
        }
        else if (vnode.shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        console.log(vnode.shapeFlag, 'vnode.shapeFlag----');
        // props
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            // 具体的click一种情况 —— 抽离通用
            // on + eventname
            // -------patchProp-------
            // const isOn = (key: string) => /^on[A-Z]/.test(key)
            // if(isOn(key)) {
            //     const event = key.slice(2).toLocaleLowerCase();
            //     el.addEventListener(event, val)
            // } else {
            //     el.setAttribute(key, val);
            // }
            hostPatchProp(el, key, null, val);
        }
        hostInsert(el, container, anchor);
        // container.append(el);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach(v => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    // TODO n1 n2是vnode，把他们的component指向新的instance 还可以把next准确赋值给真instance 不太理解，不过或者component指向的就是instance的内容
    function updateComponent(n1, n2) {
        // 判断组件是否更新，否则其他无关props的更新也会进入此逻辑
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            // 非props更新，也需要去更新el和虚拟节点
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        // 初始化的时候给component 赋值
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        // 初始化组件
        setupComponent(instance);
        // 初始化组件render
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        // 依赖收集
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                // vnode ——> patch
                // vnode ——> element ——> mountElement
                // instance 也就是parent
                patch(null, subTree, container, instance, anchor);
                // subTree完成 赋值el
                // element ——> mount完成
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log('update');
                // 更新props 1、找到之前的vnode,vnode:更新之前的节点，next:下次要更新的节点
                const { next, vnode } = instance;
                if (next) {
                    // el 赋值,因为el为空
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const { proxy } = instance;
                const subTree = instance.render.call(proxy, proxy);
                const preSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(preSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                console.log('update -- schedule');
                queueJobs(instance.update);
            }
        });
    }
    function updateComponentPreRender(instance, nextVNode) {
        instance.vnode = nextVNode;
        instance.next = null; // 清空
        instance.props = nextVNode.props;
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    return {
        createApp: createAppAPI(render)
    };
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, parent, anchor) {
    // parent.append(el)
    parent.insertBefore(child, anchor || null);
}
// child:要清空的el
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
});
function createApp(...args) {
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    h: h,
    renderSlots: renderSlots,
    crateTextVNode: crateTextVNode,
    createElementVNode: createVNode,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    provide: provide,
    inject: inject,
    createRenderer: createRenderer,
    nextTick: nextTick,
    toDisplayString: toDisplayString,
    ref: ref,
    proxyRefs: proxyRefs,
    unRef: unRef,
    isRef: isRef,
    reactive: reactive,
    readonly: readonly,
    shallowReadonly: shallowReadonly,
    isReactive: isReactive,
    isReadonly: isReadonly,
    isProxy: isProxy,
    ReactiveEffect: ReactiveEffect,
    effect: effect,
    stop: stop
});

const TO_DISPLAY_STRING = Symbol('toDisplayString');
const CREATE_ELEMENT_VNODE = Symbol('createElementVNode');
const helpersMapName = {
    [TO_DISPLAY_STRING]: 'toDisplayString',
    [CREATE_ELEMENT_VNODE]: 'createElementVNode'
};

function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    genFunctionPreamble(ast, context);
    const functionName = 'render';
    const args = ["_ctx", "_cache"];
    const signature = args.join(', ');
    push(`function ${functionName}(${signature}){`);
    push('return ');
    // const node = ast.children[0]  // 把这个逻辑放到transform
    genNode(ast.codegenNode, context);
    push('}');
    return {
        code: context.code,
    };
}
function genNode(node, context) {
    switch (node === null || node === void 0 ? void 0 : node.type) {
        case 3 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 0 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    console.log(children.children[2], 'children');
    // const child = children[0] // 为组合+  在transformElement 已处理
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    // for (let i = 0; i < children.length; i++) {
    //     const child = children[i];
    //     genNode(child, context)
    // }
    // genNode(children, context)
    genNodeList(genNullable([tag, props, children]), context);
    push(')');
}
/**
 * 把数组处理成字符串
 * @param nodes 返回数组
 * @param context
 */
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            console.log(nodes[2].children, 'nodes');
            genNode(node, context);
        }
        // 除了最后一个，都需要，
        if (i < nodes.length - 1) {
            push(", ");
        }
    }
}
function genNullable(args) {
    return args.map((arg) => arg || "null");
}
function genExpression(node, context) {
    const { push } = context;
    // ctx.写成插件
    push(`${node.content}`);
}
function createCodegenContext() {
    const context = {
        code: '',
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helpersMapName[key]}`;
        }
    };
    return context;
}
/**
 * 前导码 function类型，生成的代码还有可能是module
 * @param push
 * @param ast
 */
function genFunctionPreamble(ast, context) {
    const { push } = context;
    // push('const { toDisplayString: _toDisplayString } = Vue ')
    const VueBinging = 'vue';
    // const helpers = ['toDisplayString'] // 写在transform
    const aliasHelper = (s) => `${helpersMapName[s]}:_${helpersMapName[s]}`;
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging}`);
    }
    push('\n');
    push('return ');
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(')');
}

function baseParse(content) {
    const context = createParserContent(content);
    return createRoot(parseChildren(context, []));
}
/**
 *
 * @param context 上下文
 * @param ancestors 祖先节点
 * @returns
 */
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        // TODO 为啥定义变量在里面
        let node;
        const s = context.source;
        if (s.startsWith('{{')) {
            node = parseInterpolation(context);
        }
        else if (s.startsWith('<')) {
            // TODO 检测可见源码
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    const s = context.source;
    // 2、结束tag 时 结束
    // if (parentTag && s.startsWith(`</${parentTag}>`)) {
    //     return true
    // }
    // 结束tag在栈里，则结束
    if (s.startsWith('</')) {
        // 优化点，栈要拿的是最外面的那个，所以这个可以倒着循环,更快一些
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            // endIndex 2 + tag.length
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    // 1、有值继续循环
    return !s;
}
function parseText(context) {
    // 找到文本的最后一位下标
    let endIndex = context.source.length;
    let endToken = ["<", "{{"];
    for (let i = 0; i < endToken.length; i++) {
        const index = context.source.indexOf(endToken[i]);
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* NodeTypes.TEXT */,
        content
    };
}
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    // 删除处理完的 推进
    advanceBy(context, content.length);
    console.log(context.source);
    return content;
}
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* TagType.Start */);
    ancestors.push(element); // tag 入栈
    element.children = parseChildren(context, ancestors);
    ancestors.pop(); // 处理完的出栈
    console.log(element.tag); // 出栈的tag span
    console.log(context.source); // 被删完后剩余的
    // 有结束标签
    if (startsWithEndTagOpen(context.source, element.tag)) {
        // 处理右</div>
        parseTag(context, 1 /* TagType.End */);
    }
    else {
        throw new Error(`缺少结束标签：${element.tag}`);
    }
    return element;
}
// 是否有结束标签，对应标签
function startsWithEndTagOpen(source, tag) {
    return source.slice(2, 2 + tag.length) === tag;
}
function parseTag(context, type) {
    // 匹配 <div  及()内的tag
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    // 2.删除处理完的字符串
    advanceBy(context, match[0].length);
    // 删除右>
    advanceBy(context, 1);
    if (type === 1 /* TagType.End */)
        return;
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag: tag
    };
}
function parseInterpolation(context) {
    const openDelimiter = "{{";
    const closeDelimiter = "}}";
    // 处理插值 对处理的字符串往前推，处理完的抛弃
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    advanceBy(context, openDelimiter.length);
    // 插值名长度
    const rawContentLength = closeIndex - closeDelimiter.length;
    // 插值
    // const rawContent = context.source.slice(0, rawContentLength)
    const rawContent = parseTextData(context, rawContentLength);
    // 去除空格
    const content = rawContent.trim();
    // 清除context source
    advanceBy(context, closeDelimiter.length);
    // 返回对象ast
    return {
        type: 0 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
            content: content
        }
    };
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function createParserContent(content) {
    return {
        source: content
    };
}
function createRoot(children) {
    return {
        children,
        type: 4 /* NodeTypes.ROOT */
    };
}

function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    // 1.深度优先遍历
    traverseNode(root, context);
    // 2.修改 text content
    // root.codegenNode 用于generate 拿到content
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode; // 拿到transformElement 处理后的element
    }
    else {
        root.codegenNode = root.children[0];
    }
}
function traverseNode(node, context) {
    // if(node.type === NodeTypes.TEXT) {
    //     node.content = node.content + 'mini-vue'
    // }
    // 变动的
    // 改变transform  插件执行顺序，先存储起来
    const exitFns = [];
    const nodeTransforms = context.nodeTransforms;
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context); // 执行插件  transformElement transformText return fn，后执行
        if (onExit)
            exitFns.push(onExit);
    }
    // 插值
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* NodeTypes.ROOT */:
        case 2 /* NodeTypes.ELEMENT */:
            // 稳定的
            traverseChildren(node, context);
            break;
    }
    // 后执行
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(node, context) {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (node) {
            traverseNode(node, context);
        }
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        }
    };
    return context;
}

function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        // 放在transformExpression后面执行
        return () => {
            // 中间层处理
            // tag
            const vnodeTag = `'${node.tag}'`;
            // props
            let vnodeProps;
            // children
            const children = node.children;
            let vnodeChildren = children[0];
            // const vnodeElement = {
            //     type: NodeTypes.ELEMENT,
            //     tag: vnodeTag,
            //     props: vnodeProps,
            //     children: vnodeChildren
            // }
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function transformExpression(node) {
    if (node.type === 0 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content);
        console.log(node.content, 'node.content');
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === 3 /* NodeTypes.TEXT */ || node.type === 0 /* NodeTypes.INTERPOLATION */;
}

function transformText(node) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            const { children } = node;
            let currentContainer; // 新的节点
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child]
                                };
                            }
                            currentContainer.children.push(" + ");
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--; // 数量减一
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText]
    });
    return generate(ast);
}

// mini-vue 出口
function compileToFunction(template) {
    const { code } = baseCompile(template);
    // 把runtime-dom 包装
    const render = new Function("vue", code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);

export { ReactiveEffect, crateTextVNode, createApp, createVNode as createElementVNode, createRenderer, effect, getCurrentInstance, h, inject, isProxy, isReactive, isReadonly, isRef, nextTick, provide, proxyRefs, reactive, readonly, ref, registerRuntimeCompiler, renderSlots, shallowReadonly, stop, toDisplayString, unRef };
