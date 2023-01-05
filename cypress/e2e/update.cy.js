describe("update", () => {
  it("render", () => {
    cy.visit("http://localhost:5500/example/update/");
	  
    // click
    cy.contains("0")
    cy.contains("click").click()
    cy.contains("1")
	  
    // changeProps
    cy.get("#root").should("have.attr", "foo","foo")
    cy.contains("changeProps - 值改变了 - 修改").click()
    cy.get("#root").should("have.attr", "foo","new-foo")
	  

    // 值变成 undefined 删除
    cy.contains("changeProps - 值变成了 undefined - 删除").click()
    cy.get("#root").should("not.have.attr", "foo")
	  
    // key 在新的里面没有 删除
    cy.get("#root").should("have.attr", "bar")
    cy.contains("changeProps - key 在新的里面没有了 - 删除").click()
    cy.get("#root").should("not.have.attr", "bar")
  });
});
