describe("patchChildrenArrayToArray11", () => {
  it("对比中间的部分 综合例子", () => {
    cy.visit("http://localhost:5500/example/patchChildrenArrayToArray11/");
    
    cy.get("#arrayToArray").contains("ABCDEZFG")
    cy.get("button").click()
    cy.get("#arrayToArray").contains("ABDCYEFG")
  });
});
