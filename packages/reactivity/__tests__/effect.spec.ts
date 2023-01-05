import {
    effect,
    stop
} from '../src/effect'
import {
    reactive
} from '../src/reactive'
import { vi } from "vitest";
describe("effect", () => {
    // skip 分步走
    it("effect reactive:", () => {
        const user = reactive({
            age: 18
        })

        let nextAge;
        effect(() => {
            nextAge = user.age + 1;
        })
        expect(nextAge).toBe(19)

        // update
        user.age++

        expect(nextAge).toBe(20)

    })
    it('should return runner when call effect', () => {
        // effect(fn) ——> 也就是function(runner)   ——> 返回fn ——>fn有返回值方便测试
        // effect 返回fn
        let foo = 100
        const runner = effect(() => {
            foo++
            return 'foo'
        })
        expect(foo).toBe(101)
        const r = runner()
        expect(foo).toBe(102)
        expect(r).toBe('foo')

    })
    it('scheduler', () => {
        // 1.effect第二个参数 options，给定一个scheduler 的fn
        // 2.effect第一次执行的时候 还会执行 fn，scheduler不会调用
        // 3.当 响应式对象 set  update 不会执行fn 而是执行 scheduler
        // 4.手动执行 runner （effect返回的fn），会再次执行 fn
        let dummy;
        let run;
        const scheduler = vi.fn(() => {
            run = runner;
        })
        const obj = reactive({
            foo: 1
        });
        const runner = effect(
            () => {
                dummy = obj.foo
            }, {
                scheduler
            }
        );
        expect(scheduler).not.toHaveBeenCalled();
        expect(dummy).toBe(1);
        // should be called on first trigger
        obj.foo++;
        expect(scheduler).toHaveBeenCalledTimes(1);
        // should not run yet
        expect(dummy).toBe(1);
        // manually run
        run();
        // should have run
        expect(dummy).toBe(2)
    })
    it('stop', () => {
        // stop后，effect不调用
        let dummy;
        const obj = reactive({foo: 1})
        const runner = effect(() => {
            dummy = obj.foo
        })
        obj.foo = 2
        expect(dummy).toBe(2)
        stop(runner);
        // obj.foo = 3
        // TODO ++测试用例失败
        // 走了 get set，get——>再次收集依赖，set 触发依赖，stop失效
        // 本质 obj.foo = obj.foo + 1
        obj.foo++
        expect(dummy).toBe(2)
        runner()
        expect(dummy).toBe(3)
    })
    it('onStop', () => {
        // 执行了stop后，额外用户传进来的执行方法
        const obj = reactive({
            foo: 1
        })
        const onStop = vi.fn();
        let dummy;
        const runner = effect(() => {
            dummy = obj.foo;
        }, {
            onStop
        })
        stop(runner)
        expect(onStop).toBeCalledTimes(1)
    })
})