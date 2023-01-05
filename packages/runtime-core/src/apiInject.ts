import { getCurrentInstance } from "./component";

export function provide(key, value) {
    // 存
    // 把传进来的key value值赋值到instance 的provides
    const currentInstance: any = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        // 通过object create将provides指向父级的provides
        // init操作 不应该每次都操作 初始component的时候 provides会等于父级的provides由此判断
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides)
        }
        // 值改变了，就不会再init
        provides[key] = value
    }

}
export function inject(key, defaultValue) {
    // 取
    const currentInstance: any = getCurrentInstance()
    if(currentInstance) {
        const parentProvides = currentInstance.parent.provides
        if (key in parentProvides) {
            return parentProvides[key];
        } else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue()
            }
            return defaultValue
        }
        
    }
}