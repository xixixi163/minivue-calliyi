import { isReadonly, readonly, isProxy } from '../src/index'
import { vi } from "vitest";
describe('readonly', () => {
    it('happy path', () => {
        // not set
        const original = { foo: 1, bar: {baz: 2}};
        const wrapped = readonly(original);
        expect(wrapped).not.toBe(original);
        expect(wrapped.foo).toBe(1);
        expect(isReadonly(original)).toBe(false)
        expect(isReadonly(wrapped)).toBe(true);
        expect(isReadonly(wrapped.bar)).toBe(true)
        expect(isReadonly(original.bar)).toBe(false)
        expect(isProxy(wrapped)).toBe(true)
        expect(wrapped.foo).toBe(1)
    })
    it('warn when call set', () => {
        console.warn = vi.fn();

        const user = readonly({
            age: 10
        })

        user.age = 11;
        expect(console.warn).toBeCalled()
    })
})