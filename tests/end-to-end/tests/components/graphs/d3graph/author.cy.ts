import { selectors, testIds } from '../../../../support/const';
const paths = {
  d3Graph: 'ComponentOverlay_rootcontainer/maincontainer/pagesection/d3graph'
};

describe('D3Graph Component', () => {
  beforeEach(() => {
    cy.login();
  });

  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/pagesection/d3graph/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/graphs/d3graph::editor'
    );
  });
    it('Has D3Graph', () => {
      cy.visit(
        '/apps/websight/index.html/content/typerefinery-showcase/pages/components/graphs/d3graph::editor'
      );
      cy.getByTestId(paths.d3Graph)
        .find(selectors.overlayName)
        .should('contain.text', 'D3 Graph');
      cy.getByTestId(paths.d3Graph).click();
      cy.getByTestId(testIds.editIcon).click();
      cy.reload();
      cy.get('.css-7uss0q').click();
      cy.screenshot();
    });

});