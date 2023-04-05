describe('Map Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in preview mode', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/widgets/map.html'
    );
  });
  it('Has Map Component', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/widgets/map.html'
    );

    cy.get('[component="map"]');
    cy.screenshot()
  });
 
  });