describe("patchChildrenTextToText", () => {
  it("render", () => {
    cy.visit("http://localhost:5500/example/patchChildrenTextToText/");
    
    cy.contains("oldChild")
    cy.get("button").click()
    cy.contains("newChild")
  });
});
