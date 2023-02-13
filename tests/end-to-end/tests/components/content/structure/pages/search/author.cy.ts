import { selectors, testIds } from '../../../../../../support/const';
const paths = {
graph: 'ComponentOverlay_rootcontainer/twocols/container_1/container_1_2/container_1_2_1/d3graph'
};

describe('Search Page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/pagesection/search/websight-dialogs-service.save-properties.action'
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
    cy.getByTestId(paths.graph)
      .find(selectors.overlayName)
      .should('contain.text', 'D3 Graph');
  });
});
