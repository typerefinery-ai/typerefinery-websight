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
  it('Feeds Screenshot',()=>{
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/feeds.html'
    );
    cy.viewport(1500,1200)
    cy.screenshot()
  })

})