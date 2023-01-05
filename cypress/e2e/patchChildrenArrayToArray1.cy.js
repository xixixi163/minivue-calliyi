describe("patchChildrenArrayToArray1", () => {
  it("左侧的对比", () => {
    cy.visit("http://localhost:5500/example/patchChildrenArrayToArray1/");
    
    cy.get("#arrayToArray").contains("ABC")
    cy.get("button").click()
    cy.get("#arrayToArray").contains("ABDE")
  });
});
