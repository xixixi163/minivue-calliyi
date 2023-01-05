import { h, ref } from "../../lib/guide-mini-vue.esm.js";

import TextToText from "./TextToText.js";

export default {
  name: "App",
  setup() {
    const isChange = ref(false)
    const handleChange = function(){
      isChange.value = true
    }
     
    return {
      handleChange,
      isChange
    }
  },

  render() {
    return h("div", { tId: 1 }, [
      h("p", {}, "主页"),
      h("button", {
        onClick: this.handleChange
      }, "change"),
      h(TextToText, {isChange: this.isChange})
    ]);
  },
};
