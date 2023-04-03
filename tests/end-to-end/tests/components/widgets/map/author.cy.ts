import { selectors, testIds } from '../../../../support/const';
const paths = {
  map: 'ComponentOverlay_/content/typerefinery-showcase/pages/components/widgets/map/jcr:content/rootcontainer/container/section/map'
};

describe('Map Component',() => {

  beforeEach(() => {
    cy.login();
  });

  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/section/button/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/map::editor'
    );
  });

  it('Has Map', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/map::editor'
    );
    cy.getByTestId(paths.map)
      .find(selectors.overlayName)
      .should('contain.text', 'Map');
    })

  it('Has Dialog Box with Editable Tabs', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/map::editor'
    );
    cy.getByTestId(paths.map).click();
    cy.getByTestId(testIds.gearIcon).click({force: true});
    cy.getByTestId('dialogTab_Style').click();
    cy.getByTestId('dialogTab_Flow').click();
})

});