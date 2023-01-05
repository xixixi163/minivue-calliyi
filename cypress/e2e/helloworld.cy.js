describe("helloworld", () => {
    it("render", () => {
      cy.visit("http://127.0.0.1:5500/example/hellowold/");
      cy.contains("hi,mini-vue");
      cy.contains("foo:1");
    });
  });
  