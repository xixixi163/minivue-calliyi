import { h, getCurrentInstance } from "../../lib/guide-mini-vue.esm.js"
import {FooInstance} from './foo.js'

export const App = {
    name: "App",
    render() {
        return h('div', {}, [h('p', {}, 'currentInstance demo'), h(FooInstance)])
    },
    setup() {
        const instance = getCurrentInstance()
        console.log('App: ', instance);
    }
}