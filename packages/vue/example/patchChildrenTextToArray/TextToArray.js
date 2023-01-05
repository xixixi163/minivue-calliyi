// 新的是 array
// 老的是 text
import { ref, h } from "../../lib/guide-mini-vue.esm.js";

const prevChildren = "oldChild";
const nextChildren = [h("div", {}, "A"), h("div", {}, "B")];

export default {
  name: "TextToArray",
  setup() {
  },
  render() {
    return this.$props.isChange === true
      ? h("div", {id:"textToArray"}, nextChildren)
      : h("div", {id:"textToArray"}, prevChildren);
  },
};
