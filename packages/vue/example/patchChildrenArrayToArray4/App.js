// import { h } from "../../lib/guide-mini-vue.esm.js";

// import ArrayToText from "./ArrayToText.js";
// import TextToText from "./TextToText.js";
// import TextToArray from "./TextToArray.js";
// import ArrayToArray from "./ArrayToArray.js";

// export default {
//   name: "App",
//   setup() {},

//   render() {
//     return h("div", { tId: 1 }, [
//       h("p", {}, "主页"),
//       // 老的是 array 新的是 text
//       // h(ArrayToText),
//       // 老的是 text 新的是 text
//       // h(TextToText),
//       // 老的是 text 新的是 array
//       h(TextToArray)
//       // 老的是 array 新的是 array
//       // h(ArrayToArray),
//     ]);
//   },
// };
import { h, ref } from "../../lib/guide-mini-vue.esm.js";
import ArrayToArray from "./ArrayToArray.js";

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
      h(ArrayToArray, {isChange: this.isChange})
    ]);
  },
};
