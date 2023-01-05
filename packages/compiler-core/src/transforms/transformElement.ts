import { createVNodeCall, NodeTypes } from "../ast";

export function transformElement(node, context) {

    if (node.type === NodeTypes.ELEMENT) {
        // 放在transformExpression后面执行
        return () => {
            
            // 中间层处理
            // tag
            const vnodeTag = `'${node.tag}'`;
            // props
            let vnodeProps;
            // children
            const children = node.children;
            let vnodeChildren = children[0];

            // const vnodeElement = {
            //     type: NodeTypes.ELEMENT,
            //     tag: vnodeTag,
            //     props: vnodeProps,
            //     children: vnodeChildren
            // }

            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren)
        }
    }
}