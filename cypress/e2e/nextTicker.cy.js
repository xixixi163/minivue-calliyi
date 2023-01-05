describe("nextTick", () => {
  it("render", () => {
    cy.visit("http://localhost:5500/example/nextTicker/");
    cy.contains("1");
    cy.get('button').click();
    cy.contains("99");
  });
});
