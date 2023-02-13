describe('Trends Page', ()=>{
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in preview mode', ()=> {
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/trends.html'
    );
  });
  it('Has title Trends',()=>{
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/trends.html'
    );
    cy.get('.hl-title__heading').contains('Trends')
  })
  it('Has Table',()=>{
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/trends.html'
    );
    cy.get('.table')
  })
  it('Trends Screenshot',()=>{
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/trends.html'
    );
    cy.viewport(1500,1200)
    cy.screenshot('Trends')
  })
})