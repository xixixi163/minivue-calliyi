describe("patchChildrenArrayToArray7", () => {
  it("对比中间的部分 删除老的 在老的里面存在，新的里面不存在", () => {
    cy.visit("http://localhost:5500/example/patchChildrenArrayToArray7/");
    
    cy.get("#arrayToArray").contains("ABCDFG")
    cy.get("button").click()
    cy.get("#arrayToArray").contains("ABECFG")
  });
});
