describe("patchChildrenArrayToArray4", () => {
  it("新的比老的长 创建新的 右侧", () => {
    cy.visit("http://localhost:5500/example/patchChildrenArrayToArray4/");
    
    cy.get("#arrayToArray").contains("AB")
    cy.get("button").click()
    cy.get("#arrayToArray").contains("CAB")
  });
});
