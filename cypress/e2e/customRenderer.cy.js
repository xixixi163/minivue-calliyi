describe("customRenderer", () => {
    it("render", () => {
      cy.visit("http://127.0.0.1:5500/example/customRenderer/");
      cy.get("canvas").should("exist")
    });
  });
  