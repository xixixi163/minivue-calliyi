import { Fragment, Text } from './vnode';
import { EMPTY_OBJ, ShapeFlags } from '@mini-vue-calliyi/shared';
import { createComponentInstance, setupComponent } from './component'
import { createAppAPI } from './createApp';
import { effect } from '@mini-vue-calliyi/reactivity';
import { shouldUpdateComponent } from './updateComponentUtils';
import { queueJobs } from './scheduler';

// createRenderer 闭包的形式，传入渲染接口，让渲染是依赖function，而不是具体的渲染实现，实现自定义渲染器
export function createRenderer(options) {

    const { 
        createElement: hostCreateElement, 
        patchProp: hostPatchProp, 
        insert: hostInsert,
        remove: hostRemove,
        setElementText: hostSetElementText
    } = options

    function render(vnode, container) {
        patch(null, vnode, container, null, null)
    }

    // n1 旧的vnode   n2 新的vnode
    function patch(n1, n2, container, parentComponent = null, anchor) {
        const { type, shapeFlag } = n2; // type 为节点标签名
        // TODO 判断vnode 是不是一个element
        // 是 element 那么就应该处理 element
        // 思考题：如何去区分 element 还是 component 类型呢，因为element没有render，会导致后面instance加入render undefined
        // console.log(vnode.type, '9999');

        // ShapeFlags 虚拟节点的类型  Fragment 只渲染所有的children
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor)
                break;
            case Text:
                processText(n1, n2, container)
                break;
            default:
                // element
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, parentComponent, anchor);
                    // STATEFUL_COMPONENT
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    // 去处理组件
                    processComponent(n1, n2, container, parentComponent, anchor)
                }
                break;
        }
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            // init
            mountElement(n2, container, parentComponent, anchor)
        } else {
            patchElement(n1, n2, container, parentComponent, anchor)
        }
    }
    function patchElement (n1, n2, container, parentComponent, anchor) {
        console.log('n1', n1);
        console.log('n2', n2)
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el); // n1的el赋值给n2，让新n2有el
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps)
        
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapeFlag = n1.shapeFlag;
        const { shapeFlag } = n2;
        const c1 = n1.children;
        const c2 = n2.children;
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 1）.old array, new text
                // 1、把老的 children 清空
                unmountChildren(n1.children);
                // 2、设置 text
            }
            // 2) old text new text,如果两个值相等不修改；1）2）新值均为text
            if (c1 !== c2 ) {
                hostSetElementText(container, c2);
            }
            //     hostSetElementText(container, c2);
            // } else {
            //     // 2) old text new text,如果两个值相等不修改
            //     if (c1 !== c2 ) {
            //         hostSetElementText(container, c2);
            //     }
            // }
        } else {
        // if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                hostSetElementText(container, '')
                mountChildren(c2, container, parentComponent, anchor)
            } else {
                // array diff array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor)
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        const l2 = c2.length;
        let i = 0;
        let e1 = c1.length -1;
        let e2 = l2 -1;
        function isSomeVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key
        }
        // 左侧
        while(i <= e1 && i <= e2) {
            const n1 = c1[i]
            const n2 = c2[i]
            if(isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor) // 递归更改，比对后，并改值
            } else {
                break
            }
            i++;
        }
        console.log(i, 'iiiiiii');
        // 右侧
        while(i <= e1 && i <= e2) {
            const n1 = c1[e1]
            const n2 = c2[e2]
            if(isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor) // 递归更改，比对后，并改值
            } else {
                break
            }
            e1--;
            e2--;
        }
        // 新的比老的长，长的部分在右侧 or 左侧
        if(i > e1) {
            if (i <= e2) {
                // 锚点位置以e2+1为准，因为新增的可能有多个
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                
                // 新增的可能有多个
                while(i <= e2) {
                    // 锚点不变 新增
                    patch(null, c2[i], container, parentComponent, anchor)
                    i++;
                }
            }
            // 老的比新的长
        } else if (i > e2) {
            while( i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        } else {
            // 比对中间
            let s1 = i;
            let s2 = i;

            const toBePatched = e2 - s2 + 1 // new乱序 total
            let patched = 0; // 已经比对处理的个数

            const keyToNewIndexMap = new Map(); // 新值key和index的映射
            const newIndexToOldIndexMap = new Array(toBePatched); // 定长
            // 定义变量 记录newIndex 的最大值，如果当前的值，小于上一次的值，则表示需要移动
            let moved = false; // TODO 后面不需要重新初始化吗
            let maxNewIndexSoFar = 0;
            // 初始化，为0
            for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;

            for (let index = s2; index <= e2; index++) {
                const nextChild = c2[index];
                keyToNewIndexMap.set(nextChild.key, index)
            }

            for (let index = s1; index <= e1; index++) {
                const prevChild = c1[index];

                // 如果处理完了new乱序的个数，则跳过以下处理逻辑 进入下一个循环
                if(patched >= toBePatched) {
                    hostRemove(prevChild.el)
                    continue;
                }

                let newIndex; // 新的key是否存在旧的里，有的话值为新值的index
                // 有设置key时
                if (prevChild.key !== null) { // null or undefined
                    newIndex = keyToNewIndexMap.get(prevChild.key)
                } else {
                    // TODO 这里为什么不 小于等于  估计写错了 还是要的,因为都是索引两个值
                    for (let j = s2; j <= e2; j++) {
                        if(isSomeVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                } 

                // 新的key不再旧的里
                if(newIndex === undefined) {
                    hostRemove(prevChild.el)
                } else {
                    if(newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex
                    } else {
                        moved = true;
                    }
                    // 移动位置，有key时映射 
                    newIndexToOldIndexMap[newIndex - s2] = index + 1 // 下标0开始;值不能为0，+1 不对应下标
                    patch(prevChild, c2[newIndex], container, parentComponent, null)
                    patched++;
                }
            }
            // 获取最长递增子序列
            const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap): [];
            let j = increasingNewIndexSequence.length -1;
            // 倒叙，因为需要移动的值，要获取锚点插入，正序的话，这个锚点不好找，e前面的值，都可能不稳定
            for (let i = toBePatched - 1; i >=  0; i--) {
                const nextIndex = s2 + i;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                // 新增的插入
                if(newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor)
                }
                if(moved) {
                    if(j < 0 || i !== increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor)
                        
                    } else {
                        j--;
                    }
                }
            }
        }
        console.log(e1, e2, 'eee');
        
    }
    function unmountChildren(children) {
        for (let index = 0; index < children.length; index++) {
            const el = children[index].el;
            // remove
            hostRemove(el)
        }
    }
    // 比对props
    function patchProps(el,oldProps, newProps) {
        // 优化点 两个对象不相等时再循环
        if(oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if(prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp)
                }
            }
            if(oldProps !== EMPTY_OBJ) {
                // 是否有 key 去掉
                for (const key in oldProps) {
                    if(!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null)
                    }
                }
            }
        }
    }
    function mountElement(vnode: any, container: any, parentComponent, anchor) {
        // vnode.el 这里赋值，拿不到，element还没有mount完
        // 处理type props children
        const el = (vnode.el = hostCreateElement(vnode.type));

        // children  string 或 array
        const { children } = vnode;
        // text_child
        if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = children;
            // array_child
        } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(vnode.children, el, parentComponent, anchor)
        }
        console.log(vnode.shapeFlag, 'vnode.shapeFlag----');


        // props
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            // 具体的click一种情况 —— 抽离通用
            // on + eventname
            // -------patchProp-------
            // const isOn = (key: string) => /^on[A-Z]/.test(key)
            // if(isOn(key)) {
            //     const event = key.slice(2).toLocaleLowerCase();
            //     el.addEventListener(event, val)
            // } else {
            //     el.setAttribute(key, val);
            // }
            hostPatchProp(el, key, null, val)
        }
        hostInsert(el, container, anchor)
        // container.append(el);
    }

    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach(v => {
            patch(null, v, container, parentComponent, anchor)
        })
    }

    function processComponent(n1, n2, container, parentComponent, anchor) {
        if(!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        } else {
            updateComponent(n1, n2)
        }
        
    }

    // TODO n1 n2是vnode，把他们的component指向新的instance 还可以把next准确赋值给真instance 不太理解，不过或者component指向的就是instance的内容
    function updateComponent (n1, n2) {
        // 判断组件是否更新，否则其他无关props的更新也会进入此逻辑
        const instance = (n2.component = n1.component)
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update()
        } else {
            // 非props更新，也需要去更新el和虚拟节点
            n2.el = n1.el;
            instance.vnode = n2
        }
    }

    function mountComponent(initialVNode, container, parentComponent, anchor) {
        // 初始化的时候给component 赋值
        const instance =  (initialVNode.component = createComponentInstance(initialVNode, parentComponent))

        // 初始化组件
        setupComponent(instance)
        // 初始化组件render
        setupRenderEffect(instance, initialVNode, container, anchor,)
    }

    function setupRenderEffect(instance: any, initialVNode, container: any, anchor) {
        // 依赖收集
        instance.update = effect(() => {
            if(!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree =  instance.render.call(proxy, proxy));
                // vnode ——> patch
                // vnode ——> element ——> mountElement
                // instance 也就是parent
                patch(null, subTree, container, instance, anchor)

                // subTree完成 赋值el
                // element ——> mount完成
                initialVNode.el = subTree.el
                instance.isMounted = true;
            } else {
                console.log('update');
                // 更新props 1、找到之前的vnode,vnode:更新之前的节点，next:下次要更新的节点
                const { next, vnode } = instance
                if (next) {
                    // el 赋值,因为el为空
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next)
                }
                
                const { proxy } = instance;
                const subTree = instance.render.call(proxy, proxy);
                const preSubTree = instance.subTree
                instance.subTree = subTree;

                patch(preSubTree, subTree, container, instance, anchor)
            }
        }, {
            scheduler() {
                console.log('update -- schedule');
                queueJobs(instance.update);
                
            }
        })
    }

    function updateComponentPreRender(instance, nextVNode) {
        instance.vnode = nextVNode;
        instance.next = null; // 清空
        instance.props = nextVNode.props;
    }

    function processFragment(n1, n2: any, container: any, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor)
    }

    function processText(n1, n2: any, container: any) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children))
        container.append(textNode)
    }

    return {
        createApp: createAppAPI(render)
    }

}
function getSequence(arr: number[]): number[] {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
      const arrI = arr[i];
      if (arrI !== 0) {
        j = result[result.length - 1];
        if (arr[j] < arrI) {
          p[i] = j;
          result.push(i);
          continue;
        }
        u = 0;
        v = result.length - 1;
        while (u < v) {
          c = (u + v) >> 1;
          if (arr[result[c]] < arrI) {
            u = c + 1;
          } else {
            v = c;
          }
        }
        if (arrI < arr[result[u]]) {
          if (u > 0) {
            p[i] = result[u - 1];
          }
          result[u] = i;
        }
      }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
      result[u] = v;
      v = p[v];
    }
    return result;
  }