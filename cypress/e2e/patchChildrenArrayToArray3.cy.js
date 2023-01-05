describe("patchChildrenArrayToArray2", () => {
  it("新的比老的长 创建新的 左侧", () => {
    cy.visit("http://localhost:5500/example/patchChildrenArrayToArray3/");
    
    cy.get("#arrayToArray").contains("AB")
    cy.get("button").click()
    cy.get("#arrayToArray").contains("ABCD")
  });
});
