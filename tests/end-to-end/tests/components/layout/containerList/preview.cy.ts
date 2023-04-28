describe('Container List Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in preview mode', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/layout/containerlist.html'
    );
    cy.get('[component="containerlist"]');
    cy.screenshot();
  });
});
