describe("componentUpdate", () => {
  it("render", () => {
    cy.visit("http://localhost:5500/example/componentUpdate/");
    cy.contains("你好");

    cy.contains("child - props - msg: 123");
    cy.contains("change child props").click()
    cy.contains("child - props - msg: 456");
    
    cy.contains("count: 1")  
    cy.contains("change self count").click().as("changeSelfCountBtn")
    cy.contains("count: 2")  
    cy.get("@changeSelfCountBtn").click()
    cy.contains("count: 3")  
  });
});
