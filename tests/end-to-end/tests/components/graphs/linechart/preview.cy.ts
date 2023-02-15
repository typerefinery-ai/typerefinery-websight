describe('lineChart Component', () => {
  beforeEach(() => {
    cy.login();
  });

  it('renders correctly in preview mode', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/content/linechart.html'
    );
  });
  it('Has lineChart Component', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/content/linechart.html'
    );

    cy.get('.hl-title__heading').contains('LineChart component');
    // eslint-disable-next-line no-useless-escape
    cy.get('.lineChart');
    cy.screenshot('Linechart Preview')
  });
});