import { effect } from '../src/effect';
import { reactive } from '../src/reactive';
import { ref, isRef, unRef, proxyRefs } from '../src/ref'
describe('ref', () => {
    it('happy path', () =>{
        const a = ref(1);
        expect(a.value).toBe(1)
    })
    it('should be reactive', () => {
        const a = ref(1);
        let dummy;
        let calls = 0;
        effect(() => {
            calls++;
            dummy = a.value
        })
        expect(calls).toBe(1);
        expect(dummy).toBe(1);
        a.value = 2;
        expect(calls).toBe(2)
        expect(dummy).toBe(2);
        // same value should not trigger
        a.value =2;
        expect(calls).toBe(2);
        expect(dummy).toBe(2)
    })
    it('should make nested propertied reactive', () => {
        // 属性值 对象reactive
        const a = ref({
            count: 1,
        })
        let dummy;
        effect(() => {
            dummy = a.value.count
        })
        expect(dummy).toBe(1);
        a.value.count = 2;
        expect(dummy).toBe(2)
    })
    it('isRef', () => {
        const a = ref(1);
        const user = reactive({
            age: 1
        });
        expect(isRef(a)).toBe(true)
        expect(isRef(1)).toBe(false)
        expect(isRef(user)).toBe(false)
    })
    it('unRef', () => {
        const a = ref(1);
        const user = reactive({
            age: 1
        });
        expect(unRef(a)).toBe(1)
        expect(unRef(1)).toBe(1)
    })
    it('proxyRefs', () => {
        // template 时， 拿值不需要.value 场景
        const user = {
            age: ref(10),
            name: 'aha'
        }
        const people = ref(10)
        // const proxyPeople = proxyRefs(people)
        // TODO 失败 isRef 处 undefined
        // expect(proxyPeople).toBe(10)
        const proxyUser = proxyRefs(user)
        expect(user.age.value).toBe(10)
        expect(proxyUser.age).toBe(10)
        expect(proxyUser.name).toBe('aha')
    })
})