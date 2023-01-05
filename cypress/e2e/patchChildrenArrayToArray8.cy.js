describe("patchChildrenArrayToArray8", () => {
  it("对比中间的部分 老的比新的多， 那么多出来的直接就可以被干掉(优化删除逻辑)", () => {
    cy.visit("http://localhost:5500/example/patchChildrenArrayToArray8/");
    
    cy.get("#arrayToArray").contains("ABCEDFG")
    cy.get("button").click()
    cy.get("#arrayToArray").contains("ABECFG")
  });
});
