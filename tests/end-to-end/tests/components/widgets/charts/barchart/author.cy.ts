import { selectors, testIds } from '../../../../../support/const';
const paths = {
  barChart: 'ComponentOverlay_rootcontainer/container/pagesection/chart'
};

describe('barChart Component', () => {
  beforeEach(() => {
    cy.login();
  });

  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/pagesection/barchart/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/chart/barchart::editor'
    );
  });
  it('Has Bar Chart', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/chart/barchart::editor'
    );
    cy.getByTestId(paths.barChart)
      .find(selectors.overlayName)
      .should('contain.text', 'Chart');
    cy.getByTestId(paths.barChart).click();
    cy.getByTestId(testIds.editIcon).click();
    cy.reload();
    cy.get('.css-7uss0q').click();
    cy.screenshot();
  });
});
