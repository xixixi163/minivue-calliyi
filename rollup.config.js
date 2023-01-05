
import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json"
export default {
    input: './packages/vue/src/index.ts',
    output: [
        // 1、cjs ——> commonjs
        // 2、esm
        {
            format: 'cjs',
            file: pkg.main
        },
        {
            format: 'es',
            file: pkg.module
        }
    ],
    plugins: [typescript()]
}