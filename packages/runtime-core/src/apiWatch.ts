import { ReactiveEffect } from '@mini-vue-calliyi/reactivity';
import { queuePreFlushCb } from './scheduler';

export function watchEffect(source) {
    function job() {
        effect.run();
    }
    let cleanup; // 初始化cleanup 不调用cleanup
    const onCleanup = function(fn) {
        cleanup = effect.onStop = () => {
            fn()
        }
    }

    function getter() {
        if(cleanup) {
            cleanup()
        }

        source(onCleanup);
    }
    // schedules 来添加fn 并调用fn
    const effect = new ReactiveEffect(getter, () => {
        queuePreFlushCb(job)
    })

    // 使用了 schedules  不会一开始就去调用fn，需要先手动调用
    effect.run()

    return () => {
        effect.stop();
    }
}