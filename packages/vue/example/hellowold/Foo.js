import { h } from "../../dist/guide-mini-vue.esm.js"

export const Foo = {
    // emit 传入触发
    setup(props, { emit }) {
        // props.count
        console.log(props, 'props')
        // shallow readonly
        props.count++
        console.log(props, '++')
        // 返回的是对象
        return {
            
        }
    },
    render() {
        const foo = h('p', {}, 'foo:'+this.count)
        // 两个子组件
        return h('div', {}, [foo])
    }
}