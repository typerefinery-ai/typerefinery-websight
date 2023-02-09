import { selectors, testIds } from '../../../../../../support/const';
const paths = {
lineChart: 'ComponentOverlay_rootcontainer/twocols/container_1/container_1_2/container_1_2_2/linechart'
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/pagesection/dashboard/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/pages/dashboard::editor'
    );
  });
  it('Has Dashboard', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/pages/dashboard::editor'
    );

    cy.get('.center').should('have.text','Dashboard')

  }) 

  it('Has lineChart component', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/pages/dashboard::editor'
    );
    cy.getByTestId(paths.lineChart)
      .find(selectors.overlayName)
      .should('contain.text', 'Line Chart');
  });
});
