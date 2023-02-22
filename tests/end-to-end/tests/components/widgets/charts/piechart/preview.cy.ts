describe('pieChart Component', () => {
  beforeEach(() => {
    cy.login();
  });

  it('renders correctly in preview mode', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/widgets/chart/piechart.html'
    );
  });
  it('Has pieChart Component', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/widgets/chart/piechart.html'
    );

    cy.get('.hl-title__heading').contains('Piechart with default values');
    cy.get('.chart');
    cy.screenshot()
  });
});