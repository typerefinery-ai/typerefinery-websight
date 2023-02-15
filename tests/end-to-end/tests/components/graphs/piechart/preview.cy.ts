describe('pieChart Component', () => {
  beforeEach(() => {
    cy.login();
  });

  it('renders correctly in preview mode', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/graphs/piechart.html'
    );
  });
  it('Has pieChart Component', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/graphs/piechart.html'
    );

    cy.get('.hl-title__heading').contains('PieChart component');
    cy.get('.piechart');
    cy.screenshot('Piechart Preview')
  });
});