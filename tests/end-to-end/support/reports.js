
//reporting after test failures add images into context
import addContext from 'mochawesome/addContext';

//generate screenshot name and add it to the result file attribute context
Cypress.on('test:after:run', (test, runnable) => {

    let item = runnable
    const nameParts = [runnable.title]

    // Iterate through all parents and grab the titles
    while (item.parent) {
        nameParts.unshift(item.parent.title)
        item = item.parent
    }

    const fullTestName = nameParts
        .filter(Boolean)
        .join(' -- ')           // this is how cypress joins the test title fragments

    console.log(Cypress.spec.relative)
    const assetPath = `${Cypress.spec.relative}`.replace("tests\\","").replaceAll("\\", "/")

    if (test.state === 'failed') {

        //attach images if any to the test report
        const imageUrl = `screenshots/${assetPath}/${fullTestName} (failed).png`
        addContext({ test }, imageUrl)
    }

    //attach video to the test report
    
    const videoUrl = `videos/${assetPath}.mp4`
    addContext({ test }, videoUrl)

})

Cypress.Screenshot.defaults({
    onAfterScreenshot($el, props) {
        // props has information about the screenshot,
        // including but not limited to the following:
        // {
        //   path: '/Users/janelane/project/screenshots/my-screenshot.png',
        //   size: '15 kb',
        //   dimensions: {
        //     width: 1000,
        //     height: 660,
        //   },
        //   scaled: true,
        //   blackout: ['.foo'],
        //   duration: 2300,
        // }
    },
})
