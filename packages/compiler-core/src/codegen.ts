import { isString } from '@mini-vue-calliyi/shared';
import { NodeTypes } from "./ast";
import { CREATE_ELEMENT_VNODE, helpersMapName, TO_DISPLAY_STRING } from "./runtimeHelpers";

export function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;

    genFunctionPreamble(ast, context)

    const functionName = 'render';
    const args = ["_ctx", "_cache"];
    const signature = args.join(', ');

    push(`function ${functionName}(${signature}){`);
    push('return ');
    // const node = ast.children[0]  // 把这个逻辑放到transform
    genNode(ast.codegenNode, context);
    push('}');

    return {
        code: context.code,
    }
}

function genNode(node: any, context: any) {
    
    switch (node?.type) {
        case NodeTypes.TEXT:
            genText(node, context)
            break;
        case NodeTypes.INTERPOLATION:
            genInterpolation(node, context)
            break;
        case NodeTypes.SIMPLE_EXPRESSION:
            genExpression(node, context)
            break;
        case NodeTypes.ELEMENT:
            genElement(node, context)
            break;
        case NodeTypes.COMPOUND_EXPRESSION:
            genCompoundExpression(node, context)
            break;
        default:
            break;
    }
}
function genCompoundExpression(node, context: any) {
    const { push } = context
    const children = node.children
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if(isString(child)) {
            push(child)
        } else {
            genNode(child, context)
        }
        
    }
}
function genElement(node, context) {
    const { push, helper } =  context;
    const { tag, children, props } = node;
    console.log(children.children[2], 'children');
    // const child = children[0] // 为组合+  在transformElement 已处理
    push(`${helper(CREATE_ELEMENT_VNODE)}(`)
    // for (let i = 0; i < children.length; i++) {
    //     const child = children[i];
    //     genNode(child, context)
    // }
    // genNode(children, context)
    genNodeList(genNullable([tag, props, children]), context)
    push(')')
}
/**
 * 把数组处理成字符串
 * @param nodes 返回数组
 * @param context 
 */
function genNodeList(nodes, context) {
    
    
    const { push } =  context
     for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if(isString(node)) {
            
            push(node)
        }else {
            console.log(nodes[2].children, 'nodes');
            genNode(node, context)
        }

        // 除了最后一个，都需要，
        if(i < nodes.length -1) {
            push(", ")
        }
        
     }
}
function genNullable(args: any) {
    return args.map((arg) => arg || "null")
}
function genExpression(node: any, context: any) {
    const { push } = context;
    // ctx.写成插件
    push(`${node.content}`);
}


function createCodegenContext() {
    const context = {
        code: '',
        push(source) {
            context.code += source
        },
        helper(key) {
            return `_${helpersMapName[key]}`;
        }
    }

    return context;
}
/**
 * 前导码 function类型，生成的代码还有可能是module
 * @param push 
 * @param ast 
 */
function genFunctionPreamble(ast: any, context: any) {
    const { push } = context
    // push('const { toDisplayString: _toDisplayString } = Vue ')
    const VueBinging = 'vue'
    // const helpers = ['toDisplayString'] // 写在transform
    const aliasHelper = (s) => `${helpersMapName[s]}:_${helpersMapName[s]}`;
    if(ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging}`)
    }
    push('\n')
    push('return ');
}

function genText(node: any, context: any) {
    const { push } = context;
    push(`'${node.content}'`);
}

function genInterpolation(node: any, context: any) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`)
    genNode(node.content, context)
    push(')');
}

