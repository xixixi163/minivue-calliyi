import { h } from "../../lib/guide-mini-vue.esm.js"

export const Foo = {
    // emit 传入触发
    setup(props, { emit }) {
        const emitAdd = () => {
            console.log('emit add');
            // 发送emit
            emit('add', 1, 2)
            emit('add-foo')
        }
        // props.count
        console.log(props, 'props')
        // shallow readonly
        // props.count++
        // console.log(props, '++')
        // 返回的是对象
        return {
            emitAdd
        }
    },
    render() {
        const btn = h(
            'button',
            {
                onClick: this.emitAdd
            },
            'emitAdd'
        )
        const foo = h('p', {}, 'foo'+this.count)
        // 两个子组件
        return h('div', {}, [foo, btn])
    }
}