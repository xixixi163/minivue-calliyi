describe("patchChildrenTextToArray", () => {
  it("render", () => {
    cy.visit("http://localhost:5500/example/patchChildrenTextToArray/");
    
    cy.contains("oldChild")
    cy.get("button").click()
    cy.get("#textToArray").contains("AB")
  });
});
