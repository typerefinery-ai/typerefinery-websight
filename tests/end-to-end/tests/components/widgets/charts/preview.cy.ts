describe('Chart Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in preview mode', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/widgets/chart.html'
    );
    cy.get('[component="chart"]');
  });
});
