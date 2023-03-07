describe('Feeds Page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/section/feeds/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/pages/feeds::editor'
    );
  });
  it('Has Feeds', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/pages/feeds::editor'
    );

    cy.get('.center').should('have.text','Feeds')
  });
});
