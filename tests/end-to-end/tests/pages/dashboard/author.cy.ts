
describe('Dashboard Page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/section/dashboard/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/pages/dashboard::editor'
    );
  });
  it('Has Dashboard', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/pages/dashboard::editor'
    );

    cy.get('.center').should('have.text','Dashboard')

  }) 
});
