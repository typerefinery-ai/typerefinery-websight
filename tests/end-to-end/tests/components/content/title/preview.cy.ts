describe('Title Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in preview mode', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/content/title.html'
    );
    cy.get('[component="title"]');
  });
});
