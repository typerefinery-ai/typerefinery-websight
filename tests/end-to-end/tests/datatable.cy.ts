import { selectors, testIds } from '../support/const';
const paths = {
dataTable: 'ComponentOverlay_rootcontainer/maincontainer/pagesection/datatable'
};

describe('DataTable Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in preview mode', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/content/datatable.html'
    );
  });
  it('Has dataTable Component', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/content/datatable.html'
    );
    cy.get('#dataTable');
  });
  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/pagesection/datatable/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/content/datatable::editor'
    );
  });
  it('Has Data Table', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/content/datatable::editor'
    );
    cy.getByTestId(paths.dataTable)
      .find(selectors.overlayName)
      .should('contain.text', 'Datatable');
   
  });
  it('Has Editable GeneralTab In dialog', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/content/datatable::editor'
    );
    cy.getByTestId(paths.dataTable).click();
    cy.getByTestId(testIds.editIcon).click();
    cy.getByTestId('Input_DataSource').type(
      'http://localhost:8080/apps/typerefinery/components/content/datatable/dataSource_1.json'
    );
    cy.getByTestId(testIds.dialogSubmitButton).click();
    cy.reload()
    cy.get('.css-7uss0q').click();
  })
});
