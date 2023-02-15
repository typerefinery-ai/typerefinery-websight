describe('Ticker Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in preview mode', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/widgets/table.html'
    );
  });
  it('Has Table Component', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/widgets/table.html'
    );
    cy.get('.table')
    cy.screenshot()
  });
});