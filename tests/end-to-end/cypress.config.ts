/*
 * Copyright (C) 2023 Typerefinery.io
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

// import { defineConfig } from 'cypress';

// export default defineConfig({
//   chromeWebSecurity: false,
//   screenshotsFolder: 'build/screenshots',
//   videosFolder: 'build/video',
//   fixturesFolder: false,
//   video: false,
//   viewportWidth: 1280,
//   viewportHeight: 1024,
//   e2e: {
//     setupNodeEvents(on, config) {},
//     baseUrl: 'http://localhost:8080',
//     specPattern: 'tests/**/*.cy.{js,jsx,ts,tsx}',
//     supportFile: 'support/index.ts',
//     experimentalSessionAndOrigin: true,
//     defaultCommandTimeout: 6000
//   }
// });

const { defineConfig } = require("cypress")

module.exports = defineConfig({
  chromeWebSecurity: false,
  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos',
  fixturesFolder: false,
  video: true,
  viewportWidth: 1280,
  viewportHeight: 1024,
  reporter: "cypress-multi-reporters",
  reporterOptions: {
    configFile: "reporter-config.json",
    overwrite: false,
    html: false,
    json: true
  },
  e2e: {
    setupNodeEvents(on, config) {},
    baseUrl: 'http://localhost:8113',
    specPattern: 'tests/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'support/index.ts',
    experimentalSessionAndOrigin: true,
    defaultCommandTimeout: 20000
  },
})
