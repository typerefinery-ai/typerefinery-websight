describe('Ticker Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in preview mode', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/widgets/ticker.html'
    );
cy.get('[component="ticker"]')
cy.screenshot()
  });
});