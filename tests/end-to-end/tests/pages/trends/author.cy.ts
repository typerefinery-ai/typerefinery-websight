describe('Trends Page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/section/search/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/pages/trends::editor'
    );
  });
  it('Has Search', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/pages/trends::editor'
    );

    cy.get('.center').should('have.text','Trends')
  //   cy.getByTestId(paths.lineChart)
  //     .find(selectors.overlayName)
  //     .should('contain.text', 'Line Chart');
  //   cy.getByTestId(paths.lineChart).click();
  //   cy.getByTestId(testIds.editIcon).click();
  //   cy.getByTestId('dialogTab_Data').click()
  //   cy.getByTestId('Input_DataSource').type(
  //     'http://localhost:8080/apps/typerefinery/components/graphs/lineChart/dataSource_1.json'
  //   );
  //   cy.getByTestId(testIds.dialogSubmitButton).click();
  //   cy.reload()
  //   cy.get('.css-7uss0q').click();
  //   cy.screenshot()

  });
});
