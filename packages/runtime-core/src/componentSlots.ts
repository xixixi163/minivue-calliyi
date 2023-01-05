import { ShapeFlags } from "@mini-vue-calliyi/shared";

/**
 * 
 * @param instance 
 * @param children 为对象 key name value:function
 */
export function initSlots(instance, children) {
    // instance.slots = Array.isArray(children) ? children : [children]
    // // instance.slots 直接传入引用，就不用对slots 赋值给instance
    // 判断是否是slot
    const { vnode } = instance;
    if(vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
        normalizeObjectSlots(children, instance.slots)
    }
}

function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value]
}

function normalizeObjectSlots(children: any, slots: any) {
    // const slots = {};
    for (const key in children) {
       const value = children[key]; // function
       slots[key] = (props) => normalizeSlotValue(value(props));
    }

    // instance.slots = slots;
}
