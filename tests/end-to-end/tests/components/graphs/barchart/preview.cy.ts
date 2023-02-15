describe('barChart Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in preview mode', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/graphs/barchart.html'
    );
  });
  it('Has BarChart Component', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/graphs/barchart.html'
    );

    cy.get('.hl-title__heading').contains('BarChart component');
    cy.get('.barChart');
    cy.screenshot('Barchart Preview')
  });
 
  });