// const ShapeFlags = {
//     element: 0,
//     stateful_component: 0,
//     text_children: 0,
//     array_children: 0
// }

// vnode ——> stateful_component ——>
// 1.可以设置 修改
// ShapeFlags.stateful_component = 1;

// 2.查看
// if(ShapeFlags.element)

// 不够高效 ——> 用位运算的方式来

// 0000
// 0001 ——> element
// 0010 ——> stateful_component
// 0100 ——> text_children
// 1000 ——> array_children

// 1010 ——> array_children stateful_component

// | （两位都没0， 才为0）
// & （两位都为1， 才为1）

// 修改 通过 |
// 0000
// |(或)
// 0001
// ————(结果)
// 0001

// 查找 &
// 0001 &
// 0001
// 0001

// 0010 &
// 0001
// 0000