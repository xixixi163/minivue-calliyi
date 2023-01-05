import { NodeTypes } from "./ast";
export interface Node {
    type: NodeTypes;
    tag: string;
}
export interface ElementNode extends Node {
    children: any;
}

const enum TagType {
    Start,
    End
}

export function baseParse(content) {
    const context = createParserContent(content) 
    return createRoot(parseChildren(context, []))
}

/**
 * 
 * @param context 上下文
 * @param ancestors 祖先节点 
 * @returns 
 */
function parseChildren(context, ancestors) {
    const nodes: any = [];

    while(!isEnd(context, ancestors)) {
        // TODO 为啥定义变量在里面
        let node;
        const s = context.source;
        if (s.startsWith('{{')) {
            node = parseInterpolation(context);
        } else if (s.startsWith('<')) {
            // TODO 检测可见源码
            if(/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors)
            }
        }
    
        if(!node) {
            node = parseText(context) 
        }
        nodes.push(node);
    }

    return nodes;
}

function isEnd(context, ancestors) {
    const s = context.source;
    // 2、结束tag 时 结束
    // if (parentTag && s.startsWith(`</${parentTag}>`)) {
    //     return true
    // }
    // 结束tag在栈里，则结束
    if(s.startsWith('</')) {
        // 优化点，栈要拿的是最外面的那个，所以这个可以倒着循环,更快一些
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            // endIndex 2 + tag.length
            if(startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    // 1、有值继续循环
    return !s
}

function parseText(context) {
    // 找到文本的最后一位下标
    let endIndex = context.source.length;
    let endToken = ["<", "{{"];
    for(let i = 0; i < endToken.length; i++) {
        const index = context.source.indexOf(endToken[i])
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    
    const content = parseTextData(context, endIndex)
    
    return {
        type: NodeTypes.TEXT,
        content
    }
}

function parseTextData(context, length) {
    const content = context.source.slice(0, length)
    // 删除处理完的 推进
    advanceBy(context, content.length)
    console.log(context.source);
    
    return content;
}

function parseElement(context, ancestors) {
    const element: any = parseTag(context, TagType.Start)
    ancestors.push(element) // tag 入栈
    element.children = parseChildren(context, ancestors)
    ancestors.pop(); // 处理完的出栈
    console.log(element.tag); // 出栈的tag span
    console.log(context.source); // 被删完后剩余的
    // 有结束标签
    if(startsWithEndTagOpen(context.source, element.tag)) {
        // 处理右</div>
        parseTag(context, TagType.End)
    } else {
        throw new Error(`缺少结束标签：${element.tag}`)
    }
    
    
    return element
}
// 是否有结束标签，对应标签
function startsWithEndTagOpen(source, tag) {
    return source.slice(2, 2 + tag.length) === tag
}
function parseTag(context, type: TagType) {
    // 匹配 <div  及()内的tag
    const match: any = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    // 2.删除处理完的字符串
    advanceBy(context, match[0].length)
    // 删除右>
    advanceBy(context, 1);

    if(type === TagType.End) return 
    
    return {
        type: NodeTypes.ELEMENT,
        tag: tag
    }
}
function parseInterpolation(context: any) {
    const openDelimiter = "{{";
    const closeDelimiter = "}}";
    // 处理插值 对处理的字符串往前推，处理完的抛弃
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length)
    advanceBy(context, openDelimiter.length);
    // 插值名长度
    const rawContentLength = closeIndex - closeDelimiter.length
    // 插值
    // const rawContent = context.source.slice(0, rawContentLength)
    const rawContent = parseTextData(context, rawContentLength)
    // 去除空格
    const content = rawContent.trim();
    

    // 清除context source
    advanceBy(context, closeDelimiter.length);
    
    // 返回对象ast
    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: content
        }
    }
}

function advanceBy(context: any, length: number) {
    context.source = context.source.slice(length);
}

function createParserContent(content: string) {
    return {
        source: content
    }
}

function createRoot(children: any) {
    return {
        children,
        type: NodeTypes.ROOT
    }
}

