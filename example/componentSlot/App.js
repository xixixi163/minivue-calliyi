import { h, crateTextVNode } from "../../lib/guide-mini-vue.esm.js"
import {Foo} from './Foo.js'
window.self =null
export const App = {
    // 也就是template
    // render vnode
    render() {
        window.self = this;
        // ----slot
        const app = h('div', {}, 'App')
        // 希望children（也就是在子组件标签内写的slot内容） 可以在子组件hello中显示
        // 实现：Hello组件的vnode children 加入到子组件render return的children
        // 考虑children 数组 或 一个单独vnode情况
        // 具名插槽： slots有name的情况,把组件的children改成对象key value形式
        // 作用域插槽：传参
        // slot中除了存在标签节点，还有存在text文本，如何渲染？ 父组件中给text包裹 crateTextVNode 函数
        const foo = h(Foo, {}, {
            header: ({age}) => [h('p', {}, 'Header' + age), crateTextVNode('你好呀')], 
            footer: () => h('p', {}, 'Footer')
        })
        // const HelloV = h(Hello, {}, h('p', {}, 'slot'))
        return h('div', {}, [app, foo])
    },
    setup() {
        return {
            msg: 'mini-vue'
        }
    }
}