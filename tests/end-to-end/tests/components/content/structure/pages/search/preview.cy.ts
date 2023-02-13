describe('Search Page', ()=>{
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in preview mode', ()=> {
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/search.html'
    );
  });
  it('Has title Search',()=>{
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/search.html'
    );
    cy.get('.hl-title__heading').contains('Search')
  })
  it('Has SearchBox',()=>{
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/search.html'
    );
    cy.get('.inputtext')
  })
  it('Has d3Graph',()=>{
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/search.html'
    );
    cy.get('.d3graph')
  })
  it('Search Screenshot',()=>{
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/search.html'
    );
    cy.viewport(1500,1200)
    cy.screenshot('Feeds')
  })
})