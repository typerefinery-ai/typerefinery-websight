import { selectors, testIds } from '../../../../support/const';
const paths = {
  chart:
    'ComponentOverlay_/content/typerefinery-showcase/pages/components/widgets/chart/jcr:content/rootcontainer/container/section1/chart'
};

describe('Chart Component', () => {
  beforeEach(() => {
    cy.login();
  });

  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/section/chart/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/chart::editor'
    );
  });
  it('Has Chart', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/chart::editor'
    );
    cy.getByTestId(paths.chart)
      .find(selectors.overlayName)
      .should('contain.text', 'Chart');
  });
  it('It has Dialog box With authorable Tabs', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/chart::editor'
    );
    cy.getByTestId(paths.chart)
      .find(selectors.overlayName)
      .should('contain.text', 'Chart');
    cy.getByTestId(paths.chart).click();
    cy.getByTestId(testIds.gearIcon).click({ force: true });
  });

  it('It has Variants', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/chart::editor'
    );
    cy.getByTestId(paths.chart).click();
    cy.getByTestId(testIds.gearIcon).click({ force: true });
    cy.get('.Input_Variants__value-container').click({ force: true });
    cy.get('#react-select-3-option-2').click();
    cy.get('.Input_Variants__value-container').contains('Pie Chart');
  });
});
