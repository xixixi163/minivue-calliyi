describe("apiInject", () => {
    it("render", () => {
      cy.visit("http://127.0.0.1:5500/example/apiInject/");
      cy.contains("apiInject")
      cy.contains("Provider")
      cy.contains("ProviderTwo foo:fooVal")
      cy.contains("Consumer: - fooTwo - barVal - bazDefault")
    });
  });
  