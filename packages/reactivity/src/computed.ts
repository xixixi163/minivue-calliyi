import { ReactiveEffect } from './effect';
class computedImpl {
    private _getter: any;
    private _dirty: Boolean = true
    private _value: any;
    private _effect: any;
    constructor(getter: Function) {
        this._getter = getter
        this._effect = new ReactiveEffect(getter, () => {
            if(!this._dirty) {
                this._dirty = true
            }
        })
    }
    get value() {
        // 锁 住缓存 
        // 当依赖的响应式的值发生改变 effect 收集依赖
        // set后 执行run 会重新执行get，所以会调用两次依赖，这样就不缓存了，使用schedule 
        if(this._dirty) {
            this._dirty = false
            this._value = this._effect.run(); 
            // return this._getter()
        }
       return this._value
    }
}
export function computed(getter) {
    return new computedImpl(getter)
}