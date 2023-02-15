import { selectors, testIds } from '../../../../../../../support/const';
const paths = {
  barChart: 'ComponentOverlay_rootcontainer/maincontainer/pagesection/barchart'
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
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/graphs/barchart::editor'
    );
  });
  it('Has Bar Chart', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/graphs/barchart::editor'
    );
    cy.getByTestId(paths.barChart)
      .find(selectors.overlayName)
      .should('contain.text', 'Bar Chart');
    cy.getByTestId(paths.barChart).click();
    cy.percySnapshot('bar dialog');
    cy.getByTestId(testIds.editIcon).click();
    cy.getByTestId('dialogTab_JSONDataSource').click();
    cy.getByTestId('Input_DataSource').type(
      'http://localhost:8080/apps/typerefinery/components/graphs/barChart/dataSource_1.json'
    );
    cy.reload();
    cy.get('.css-7uss0q').click();
    cy.screenshot('Barchart Edited');
  });
});
