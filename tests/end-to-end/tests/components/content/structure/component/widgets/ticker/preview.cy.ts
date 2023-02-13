describe('Ticker Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in preview mode', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/widgets/ticker.html'
    );
cy.get('#ticker')
cy.get('.value').eq(0).contains('131.12K')
cy.screenshot('Ticker')
  });
});