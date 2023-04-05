import { selectors, testIds } from '../../../../../support/const';
const paths = {
  lineChart: 'ComponentOverlay_rootcontainer/container/section/chart'
}

describe('lineChart Component', () => {
  beforeEach(() => {
    cy.login();
  });

  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/section/linechart/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/chart/linechart::editor'
    );
  });
  it('Has line Chart', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/chart/linechart::editor'
    );
    cy.getByTestId(paths.lineChart)
      .find(selectors.overlayName)
      .should('contain.text', 'Chart');
    cy.getByTestId(paths.lineChart).click();
    cy.getByTestId(testIds.editIcon).click();
    cy.getByTestId('dialogTab_Data').click()
    // cy.getByTestId('Input_DataSource').type(
    //   'http://localhost:8080/apps/typerefinery/components//lineChart/dataSource_1.json'
    // );
    cy.getByTestId(testIds.dialogSubmitButton).click();
    cy.reload()
    cy.get('.css-7uss0q').click();
    cy.screenshot()

  });
});