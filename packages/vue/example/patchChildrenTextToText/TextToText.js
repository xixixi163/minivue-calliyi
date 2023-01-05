// 新的是 text
// 老的是 text
import { h } from "../../lib/guide-mini-vue.esm.js";

const prevChildren = "oldChild";
const nextChildren = "newChild";

export default {
  name: "TextToText",
  setup() {
  },
  render() {
    return this.$props.isChange === true
      ? h("div", {}, nextChildren)
      : h("div", {}, prevChildren);
  },
};
