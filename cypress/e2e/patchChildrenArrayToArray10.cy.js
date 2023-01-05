describe("patchChildrenArrayToArray10", () => {
  it("对比中间的部分 创建新的节点", () => {
    cy.visit("http://localhost:5500/example/patchChildrenArrayToArray10/");
    
    cy.get("#arrayToArray").contains("ABCEFG")
    cy.get("button").click()
    cy.get("#arrayToArray").contains("ABECDFG")
  });
});
