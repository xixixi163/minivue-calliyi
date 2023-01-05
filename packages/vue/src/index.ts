// mini-vue 出口

// export * from './runtime-core' // 放到runtime-dom中导出，dom比core更上层
export * from '@mini-vue-calliyi/runtime-dom'
import { baseCompile } from '@mini-vue-calliyi/compiler-core'
import * as runtimeDom from '@mini-vue-calliyi/runtime-dom'
import { registerRuntimeCompiler } from '@mini-vue-calliyi/runtime-dom'

function compileToFunction(template) {
    const { code } = baseCompile(template)
    // 把runtime-dom 包装
    const render = new Function("vue", code)(runtimeDom);

    return render;
}

registerRuntimeCompiler(compileToFunction)