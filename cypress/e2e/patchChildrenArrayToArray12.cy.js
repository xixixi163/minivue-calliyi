describe("patchChildrenArrayToArray12", () => {
  it("对比中间的部分 fix c 节点应该是 move 而不是删除之后重新创建的", () => {
    cy.visit("http://localhost:5500/example/patchChildrenArrayToArray12/");
    
    cy.get("#arrayToArray").contains("ACBD")
    cy.get("button").click()
    cy.get("#arrayToArray").contains("ABCD")
  });
});
