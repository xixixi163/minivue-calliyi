describe("update", () => {
  it("render", () => {
    cy.visit("http://localhost:5500/example/compiler-base/");
    
    cy.contains("hi,1")
  });
});
