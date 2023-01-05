import { h, getCurrentInstance } from "../../lib/guide-mini-vue.esm.js";

export const FooInstance = {
    name: 'FooInstance',
    setup() {
        const instance = getCurrentInstance();
        console.log('FooInstance:', instance);
        return {}
    },
    render() {
        return h('div', {}, 'foo instance')
    }
}