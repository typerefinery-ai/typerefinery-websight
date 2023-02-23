describe('d3Graph Component', () => {
  beforeEach(() => {
    cy.login();
  });

  it('renders correctly in preview mode', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/graphs/d3graph.html'
    );
  });
  it('Has D3Graph Component', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/graphs/d3graph.html'
    );

    cy.get('.hl-title__heading').contains('D3Graph component');
    cy.screenshot()
  });

});