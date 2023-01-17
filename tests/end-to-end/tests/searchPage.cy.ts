describe('Search Page', ()=>{
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in preview mode', ()=> {
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/search.html'
    );
   
  });
  it("Has sidebar", () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/search.html'
    );
    cy.get(".p-tree").contains('Menu')
    cy.get('.p-tree-toggler-icon').click() 
  })
 
  it("Has search-box", () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/search.html'
    );
    cy.get('#inputtext-width').type('Hello')
  })
  it("Has search-button", () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/search.html'
    );
    cy.get('.p-button').eq(0).contains('Search')
  })
  it("Has radio-button", () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/search.html'
    );
    cy.get('.p-radiobutton').eq(0).click()
  })
  it("Has d3GraphSvg", () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/search.html'
    );
    cy.get('#d3GraphSvg')
  })

})