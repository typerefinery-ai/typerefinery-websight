// @ts-nocheck

//import json using sling
Cypress.Commands.add('slingImportJson', (url, namehint, contentJson) => {
  var formDataObject = {
    ':operation': 'import',
    ':contentType': 'json',
    ':nameHint': namehint,
    ':content': JSON.stringify(contentJson),
  };

  return cy.request({
    method: 'POST',
    url: url,
    form: true,
    bodyIsBase64Encoded: false,
    headers: {
      Authorization:
        'Basic ' +
        btoa(
          Cypress.env('AEM_ADMIN_USER') +
            ':' +
            Cypress.env('AEM_ADMIN_USER_PASSWORD')
        ),
      'User-Agent': 'curl',
      'Content-Type': 'multipart/form-data',
    },
    body: formDataObject,
  });
});

//import json using sling
Cypress.Commands.add('slingDeletePath', url => {
  var formDataObject = {
    ':operation': 'delete',
  };

  return cy.request({
    method: 'POST',
    url: url,
    form: true,
    bodyIsBase64Encoded: false,
    headers: {
      Authorization:
        'Basic ' +
        btoa(
          Cypress.env('AEM_ADMIN_USER') +
            ':' +
            Cypress.env('AEM_ADMIN_USER_PASSWORD')
        ),
      'User-Agent': 'curl',
    },
    body: formDataObject,
  });
});

Cypress.Commands.add('xhr', (method, auth, headers, url, formdata) => {
  // fixes lack of FormData (multipart/form-data) support in cy.request
  cy.window().then(win => {
    return new Promise((resolve, reject) => {
      const XHR = new win.XMLHttpRequest();
      XHR.onload = resolve;
      XHR.open(method, url);
      //set auth
      if (auth) {
        if (typeof auth === 'object' && auth['username'] && auth['password']) {
          XHR.setRequestHeader(
            'Authorization',
            'Basic ' + btoa(auth['username'] + ':' + auth['password'])
          );
        } else {
          XHR.setRequestHeader('Authorization', auth);
        }
      }
      //set headers
      if (headers) {
        for (var header in headers) {
          XHR.setRequestHeader(header, headers[header]);
        }
      }
      XHR.send(formdata);
    });
  });
});

//post sling command
Cypress.Commands.add('slingPost', (url, formContent) => {
  return cy.request({
    method: 'POST',
    url: url,
    form: true,
    bodyIsBase64Encoded: false,
    headers: {
      Authorization:
        'Basic ' +
        btoa(
          Cypress.env('AEM_ADMIN_USER') +
            ':' +
            Cypress.env('AEM_ADMIN_USER_PASSWORD')
        ),
      'User-Agent': 'curl',
      'Content-Type': 'multipart/form-data',
    },
    body: formContent,
  });
});
