/*
 * Copyright (C) 2022 Typerefinery.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// assertions: https://docs.cypress.io/guides/references/assertions
describe('Components - Content - Title', function () {
  beforeEach(() => {
    cy.login();
  });

  it('renders default text when blank', function () {
    cy.visit('/content/typerefinery-showcase/pages/components/content/title.html');

    cy.get("#title")
      .should('have.text', 'Add your heading here')
  });
  it('renders authored text', function () {
    cy.visit('/content/typerefinery-showcase/pages/components/content/title.html');

    cy.get("#title1")
      .should('have.text', 'test1')
  });
});

  
