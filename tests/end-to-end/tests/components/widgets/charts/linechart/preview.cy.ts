describe('lineChart Component', () => {
  beforeEach(() => {
    cy.login();
  });

  it('renders correctly in preview mode', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/widgets/chart/linechart.html'
    );
  });
  it('Has lineChart Component', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/widgets/chart/linechart.html'
    );

    cy.get('.hl-title__heading').contains('Linechart with default values');
    // eslint-disable-next-line no-useless-escape
    cy.get('.chart');
    cy.screenshot()
  });
});