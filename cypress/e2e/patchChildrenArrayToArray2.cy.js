describe("patchChildrenArrayToArray2", () => {
  it("右侧的对比", () => {
    cy.visit("http://localhost:5500/example/patchChildrenArrayToArray2/");
    
    cy.get("#arrayToArray").contains("ABC")
    cy.get("button").click()
    cy.get("#arrayToArray").contains("DEBC")
  });
});
