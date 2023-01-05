describe("currentInstance", () => {
    it("render", () => {
      cy.visit("http://127.0.0.1:5500/example/getCurrentInstance/");
      cy.contains("currentInstance demo")
      cy.contains("foo instance")
    });
  });
  