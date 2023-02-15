import { selectors, testIds } from '../../../../../../../support/const';
const paths = {
  lineChart: 'ComponentOverlay_rootcontainer/maincontainer/pagesection/linechart'
}

describe('lineChart Component', () => {
  beforeEach(() => {
    cy.login();
  });

  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/pagesection/linechart/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/graphs/linechart::editor'
    );
  });
  it('Has line Chart', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/graphs/linechart::editor'
    );
    cy.getByTestId(paths.lineChart)
      .find(selectors.overlayName)
      .should('contain.text', 'Line Chart');
    cy.getByTestId(paths.lineChart).click();
    cy.getByTestId(testIds.editIcon).click();
    cy.getByTestId('dialogTab_Data').click()
    cy.getByTestId('Input_DataSource').type(
      'http://localhost:8080/apps/typerefinery/components/graphs/lineChart/dataSource_1.json'
    );
    cy.getByTestId(testIds.dialogSubmitButton).click();
    cy.reload()
    cy.get('.css-7uss0q').click();
    cy.screenshot()

  });
});
