import { selectors, testIds } from '../../../../support/const';
const paths = {
  title:
    'ComponentOverlay_/content/typerefinery-showcase/pages/components/content/title/jcr:content/rootcontainer/container/section/title'
};

describe('tittle Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/section/title/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/content/title::editor'
    );
  });
  it('Has title Component ', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/content/title::editor'
    );
    cy.getByTestId(paths.title)
      .find(selectors.overlayName)
      .should('contain.text', 'Title');
  });

  it('Has Editabe Tb In dialog', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/content/title::editor'
    );
    cy.getByTestId(paths.title).click();
    cy.getByTestId(testIds.gearIcon).click({ force: true });
    cy.getByTestId('Input_Headingtext').clear().type('Hello');
    cy.getByTestId(testIds.dialogSubmitButton).click();
  });
});
