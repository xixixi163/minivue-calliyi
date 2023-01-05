import { h, renderSlots } from "../../lib/guide-mini-vue.esm.js"

export const Foo = {
    render() {
        const foo = h('p', {}, 'Hello')
        // slot实现：Hello组件的children 加入到第三个参数
        // slot由多个标签组成时，为数组，处理成renderSlots返回
        // 作用域插槽
        const age = 18
        return h('p', {}, [ renderSlots(this.$slots, 'header', {age}), foo, renderSlots(this.$slots, 'footer')])
    },
    setup() {
        return {}
    }
}