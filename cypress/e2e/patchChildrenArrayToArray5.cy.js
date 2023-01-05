describe("patchChildrenArrayToArray5", () => {
  it("老的比新的长 删除老的 左侧", () => {
    cy.visit("http://localhost:5500/example/patchChildrenArrayToArray5/");
    
    cy.get("#arrayToArray").contains("ABC")
    cy.get("button").click()
    cy.get("#arrayToArray").contains("AB")
  });
});
