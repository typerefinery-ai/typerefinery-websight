import { selectors, testIds } from '../../../../../support/const';
const paths = {
  pieChart: 'ComponentOverlay_rootcontainer/maincontainer/pagesection/chart'
}

describe('pieChart Component', () => {
  beforeEach(() => {
    cy.login();
  });

  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/pagesection/piechart/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/chart/piechart::editor'
    );
  });
  it('Has pie Chart', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/chart/piechart::editor'
    );
    cy.getByTestId(paths.pieChart)
      .find(selectors.overlayName)
      .should('contain.text', 'Chart');
    cy.getByTestId(paths.pieChart).click();
    cy.getByTestId(testIds.editIcon).click();
    cy.getByTestId(testIds.dialogSubmitButton).click();
    cy.reload()
    cy.get('.css-7uss0q').click();
    cy.screenshot()

  });
});
