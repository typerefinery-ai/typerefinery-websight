describe('Button Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in preview mode', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/forms/checkbox.html'
    );
    cy.get('[component="checkbox"]')
  });
});