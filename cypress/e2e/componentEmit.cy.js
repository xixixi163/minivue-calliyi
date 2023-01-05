describe("componentEmit", () => {
    it("render", () => {
      cy.visit("http://127.0.0.1:5500/example/componentEmit/");
  
      cy.window()
      .its("console")
      .then((console) => cy.spy(console, "log").as("log"));
  
  
      cy.contains("foo1")
      cy.contains("emitAdd")
  
      cy.get("button").click()
      cy.get("@log").should("have.been.calledWith","emit add");
      cy.get("@log").should("have.been.calledWith","on add", 1 , 2);
      cy.get("@log").should("have.been.calledWith","onAddFoo");
    });
  });
  