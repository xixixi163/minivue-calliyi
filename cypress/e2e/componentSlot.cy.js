describe("componentSlots", () => {
    it("render", () => {
      cy.visit("http://127.0.0.1:5500/example/componentSlot/");
      cy.contains("App");
        cy.contains("Header18");
        cy.contains("你好呀");
        cy.contains("Hello");
        cy.contains("Footer");
    });
  });
  