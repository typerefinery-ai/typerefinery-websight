describe('Feeds Page', ()=>{
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in preview mode', ()=> {
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/feeds.html'
    );
  });
  it('Has title Feeds',()=>{
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/feeds.html'
    );
    cy.get('.hl-title__heading').contains('Feeds')
  })
  it('Has Datatable',()=>{
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/feeds.html'
    );
    cy.get('#dataTable')
  })

})