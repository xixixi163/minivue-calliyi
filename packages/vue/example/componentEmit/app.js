import { h } from "../../lib/guide-mini-vue.esm.js"
import {Foo} from './Foo.js'
window.self =null
export const App = {
    // 也就是template
    // render vnode
    render() {
        window.self = this;
        // -----------props 事件注册  emit
        return h('div', {
            id: 'root', class: ['red', 'hard'],
            // onClick() {
            //     console.log('click')
            // },
            // onMousedown() {
            //     console.log('mousedown');
            // }
        }, 
        // 'hi'+this.msg
         [
            // h('div', {id: 'a', class: 'blue'}, 'hi'+this.msg),
            // h('div', {id: 'b', class: 'red'}, 'children two'),
            // 引入foo组件，props：count，emit：onAdd,foo emit出来，查看Add方法是否调用
            h(Foo, {
                count: 1,
                // on + event
                // 接收emit
                onAdd(a, b) {
                    console.log('on add', a, b)
                },
                onAddFoo() {
                    console.log('onAddFoo')
                }
            })
        ]
        )
    },
    setup() {
        return {
            msg: 'mini-vue'
        }
    }
}