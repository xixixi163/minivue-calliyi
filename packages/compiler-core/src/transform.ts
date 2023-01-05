import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

export function transform(root, options = {}) {
    const context = createTransformContext(root, options)
    // 1.深度优先遍历
    traverseNode(root, context)
    // 2.修改 text content

    // root.codegenNode 用于generate 拿到content
    createRootCodegen(root);

    root.helpers = [...context.helpers.keys()]
}

function createRootCodegen(root: any) {
    const child = root.children[0]
    if(child.type === NodeTypes.ELEMENT) {
        root.codegenNode = child.codegenNode; // 拿到transformElement 处理后的element
    } else {
        root.codegenNode = root.children[0];
    }
    
}

function traverseNode(node: any, context: any) {
    // if(node.type === NodeTypes.TEXT) {
    //     node.content = node.content + 'mini-vue'
    // }
    // 变动的
    // 改变transform  插件执行顺序，先存储起来
    const exitFns: any = [];
    const nodeTransforms = context.nodeTransforms
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        
        const onExit = transform(node, context) // 执行插件  transformElement transformText return fn，后执行
        if(onExit) exitFns.push(onExit);
    }
    // 插值
    switch (node.type) {
        case NodeTypes.INTERPOLATION:
            context.helper(TO_DISPLAY_STRING)
            break;
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            // 稳定的
            traverseChildren(node, context)
            break;
        default:
            break;
    }

    // 后执行
    let i = exitFns.length;
    while(i--) {
        exitFns[i]();
    }
    
}
function traverseChildren(node, context) {
    const children = node.children
        for (let i = 0; i < children.length; i++) {
            const node = children[i]
            if(node) {
                traverseNode(node, context)
            }
            
        }
}
function createTransformContext(root: any, options: any) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1)
        }
    }
    return context;
}

