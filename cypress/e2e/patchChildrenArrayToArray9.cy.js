describe("patchChildrenArrayToArray9", () => {
  it("对比中间的部分 节点存在于新的和老的里面，但是位置变了", () => {
    cy.visit("http://localhost:5500/example/patchChildrenArrayToArray9/");
    
    cy.get("#arrayToArray").contains("ABCDEFG")
    cy.get("button").click()
    cy.get("#arrayToArray").contains("ABECDFG")
  });
});
