// 老的是 array
// 新的是 text
import { h } from "../../lib/guide-mini-vue.esm.js";
const nextChildren = "newChildren";
const prevChildren = [h("div", {}, "A"), h("div", {}, "B")];

export default {
  name: "ArrayToText",
  setup() {
  },
  render() {
    return this.$props.isChange === true
      ? h("div", {id:"arrayToText"}, nextChildren)
      : h("div", {id:"arrayToText"}, prevChildren);
  },
};
