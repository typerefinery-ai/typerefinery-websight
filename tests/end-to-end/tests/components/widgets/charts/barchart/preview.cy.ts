describe('barChart Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in preview mode', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/widgets/chart/barchart.html'
    );
  });
  it('Has BarChart Component', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/widgets/chart/barchart.html'
    );

    cy.get('.hl-title__heading').contains('Barchart with default values');
    cy.get('.chart');
    cy.screenshot()
  });
 
  });