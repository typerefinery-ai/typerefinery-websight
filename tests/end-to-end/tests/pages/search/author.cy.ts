
describe('Search Page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/section/search/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/pages/search::editor'
    );
  });
  it('Has Search', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/pages/search::editor'
    );

    cy.get('.center').should('have.text','Search')
  });
});
