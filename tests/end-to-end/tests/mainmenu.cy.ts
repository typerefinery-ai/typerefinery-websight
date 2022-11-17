describe('Typerefinery MainMenu', function () {
  beforeEach(() => {
    cy.login();
  });

it('renders correctly in preview mode', function () {
  cy.visit('/content/typerefinery-showcase/pages/components/structure/mainmenu.html');
  cy.get(".hl-navigation__text")
  .contains('Guide')
})

});