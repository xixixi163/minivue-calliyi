import { h, crateTextVNode } from "../../lib/guide-mini-vue.esm.js"
import {Foo} from './Foo.js'
window.self =null
export const App = {
    // 也就是template
    // render vnode
    render() {
        window.self = this;
        // -----------props 事件注册
        return h('div', {
                id: 'root', class: ['red', 'hard'],
                onClick() {
                    console.log('click')
                },
                onMousedown() {
                    console.log('mousedown');
                }
            }, 
            // 'hi'+this.msg
            [
                h('div', {id: 'a', class: 'blue'}, 'hi,'+this.msg),
                // h('div', {id: 'b', class: 'red'}, 'children two'),
                h(Foo, {count: 1})
            ]
        )

    },
    setup() {
        return {
            msg: 'mini-vue'
        }
    }
}