describe("patchChildrenArrayToText", () => {
  it("render", () => {
    cy.visit("http://localhost:5500/example/patchChildrenArrayToText/");

    cy.get("#arrayToText").contains("AB")
    cy.get("button").click()
    cy.contains("newChildren")
  });
});
