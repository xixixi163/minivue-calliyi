describe("patchChildrenArrayToArray6", () => {
  it("老的比新的长 删除老的 右侧", () => {
    cy.visit("http://localhost:5500/example/patchChildrenArrayToArray6/");
    
    cy.get("#arrayToArray").contains("ABC")
    cy.get("button").click()
    cy.get("#arrayToArray").contains("BC")
  });
});
