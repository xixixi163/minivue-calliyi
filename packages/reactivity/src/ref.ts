import { isObject, hasChanged } from '@mini-vue-calliyi/shared';
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from './reactive';

class refImpl {
    private _value: any;
    public dep;
    private _rawValue: any;
    public _v_isRef = true;
    constructor(value) {
        this._rawValue = value
        // value --- reactive  看看value 是不是对象
        this._value = convert(value)
        // 初始化dep
        this.dep = new Set()
    }
    get value() {
        trackRefValue(this)
        return this._value
    }
    set value(newValue) {
        // 一定先去修改了 value 的  
        // 前后值不一样，不set
        if(hasChanged(this._rawValue, newValue)) {
            this._rawValue = newValue;
            // newValue ——> this._value
            this._value = convert(newValue)
            triggerEffects(this.dep)
        }
    }
}

// 抽离
function convert(value) {
    return isObject(value) ? reactive(value) : value
}

function trackRefValue(ref) {
    if(isTracking()) {
        trackEffects(ref.dep)
    }
}
export function ref(value) {
    return new refImpl(value)
}

export function isRef(ref) {
    // 创建ref类的时候给一个值，判断是否有这个值
    return !!ref._v_isRef;
}

export function unRef(ref) {
    // 是ref 返回value值
    return isRef(ref) ? ref.value : ref
}

export function proxyRefs(objectWithRefs) {
    // 通过proxy 知道他调用了get set
    return new Proxy(objectWithRefs, {
        get(target, key) {
            //ref类型 直接返回.value 
            // not ref ——> value
            return unRef(Reflect.get(target, key))
        },
        set(target, key, value) {
            // 原值 ref ，new not ref
            if(isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value)
            } else {
                Reflect.set(target, key, value)
            }
        }
    })
}

