# Component

Table component

# Overview

Component for adding Table to page.

## Information

- **group**:Typerefinery - Widgets
- **sling:resourceType**: ws:Component
- **description**: Table component
- **title**: Table
- **sling:resourceSuperType**:
- **Vendor**: Typerefinery
- **Version**: 1.0
- **Compatibility**: CMS
- **Reference**: [Bootstrap table](https://getbootstrap.com/docs/5.0/content/tables/)
- **Status**: Ready
- **Showcase**: [/typerefinery/components/widgets/table](https://cms.typerefinery.localhost:8101/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/table::editor)
- **Local Code**: [/apps/typerefinery/components/widgets/table]
- **Source**: [github/typerefinery-websight](https://github.com/typerefinery-ai/typerefinery-websight/tree/feature/%23203-table-flow-enabled/application/backend/src/main/resources/apps/typerefinery/components/widgets/table)
- **Readme**: [/typerefinery/components/widgets/table/readme](https://github.com/typerefinery-ai/typerefinery-websight/tree/feature/%23203-table-flow-enabled/application/backend/src/main/resources/apps/typerefinery/components/widgets/table/README.md)

# Features

- Responsive web design
- Scrollable Table with fixed headers
- Fully configurable via data attributes
- Show/Hide columns
- Get data in JSON format
- Simple column sorting with a click
- Format column
- Single or multiple row selection
- Pagination

# Table with all the features selected.

# Authoring

Following section covers authoring features.

## Dialog Tabs

These fields are available for input by the authors. These fields are used in templates.

<table style="border-spacing: 1px;border-collapse: separate;width: 100.0%;text-align: left;background-color: black; text-indent: 4px;">
    <thead style="font-size: larger;">
        <tr>
            <th style="width: 8%;">Tab</th>
            <th style="width: 8%;">Field Name</th>
            <th style="width: 8%;">Default Value</th>
            <th>Description</th>
        </tr>
    </thead>
     <tbody style="background-color: gray;">
        <tr>
            <td rowspan="6"> General</td>
            <td>Show Action Buttons</td>
            <td>Disabled</td>
            <td>Enable to view action columns and Action tab.</td>
        </tr>
        <tr>
            <td>Simple Table search</td>
            <td>Disabled</td>
            <td>Enable to include Search box.</td>
        </tr>
        <tr>
            <td>Show Pagination</td>
            <td>Disabled</td>
            <td>Enable it to add pagination.</td>
        </tr>
         <tr>
            <td>Resizable Table</td>
            <td>Disabled</td>
            <td>Enable Resizable.</td>
        </tr>
        <tr>
            <td>Select Single Row
</td>
            <td>Disabled</td>
            <td>Enable to select Single Row.</td>
        </tr>
        <tr>
            <td>Multiple Select Row</td>
            <td>Disabled</td>
            <td>Enable is to Select Multiple Row.</td>
        </tr>
        <tr>
            <td rowspan="4">Action</td>
            <td>Icon</td>
            <td></td>
            <td>Put Icon for Action.</td>
        </tr>
        <tr>
            <td>Label</td>
            <td></td>
            <td>Will be displayed as a tooltip.</td>
        </tr>
        <tr>
            <td>Navigate To</td>
            <td></td>
            <td>Path to navigate to when action button is clicked.</td>
        </tr>
         <tr>
            <td>Open Model</td>
            <td></td>
            <td>URL of the modal content.</td>
        </tr>
        <tr>
            <td>Column</td>
            <td></td>
            <td></td>
            <td>Add label, Badge, Image, link in Column. Also, you can hide columns.</td>
        </tr>
        <tr>
            <td rowspan="12">Flow</td>
            <td>Topics</td>
            <td><em>Dynamic topics</em></td>
            <td>The topic set for this flow is used for sending and receiving messages to and from the flow.</td>
        </tr>
         <tr>
            <td>Title</td>
            <td>Table flow</td>
            <td>The title to be used for this flow should be updated in this component to change the title of the flow in Flow Designer</td>
        </tr>
        <tr>
            <td>Group</td>
            <td>/content/typerefinery-showcase/pages/components/widgets/table</td>
            <td>This is the group that the flow belongs to, its used to group relevant flows.</td>
        </tr>
        <tr>
            <td>Template</td>
            <td>/apps/typerefinery/components/widgets/table/templates/table.json</td>
            <td>This is the template that the flow is based on, its used to create new flows from a template.</td>
        </tr>
        <tr>
            <td>Design Template</td>
            <td><em>Dynamic template</em></td>
            <td>This is the design template that the flow is based on, its used to update the design of the flow.</td>
        </tr>
        <tr>
            <td>Sample Data</td>
            <td>/apps/typerefinery/components/widgets/table/templates/flowsample.json</td>
            <td>This is the sample data that is added to the flow to help to get started.</td>
        </tr>
        <tr>
            <td>HTTP Route</td>
            <td>/content/typerefinery-showcase/pages/components/widgets/table/*</td>
            <td>This is the HTTP route for REST API for this flow, where applicable, not used in all flow enabled components.</td>
        </tr>
        <tr>
            <td>Is Container</td>
            <td>false</td>
            <td>This is a flag to indicate if the flow is a container flow, where applicable, not used in all flow enabled components.</td>
        </tr>
        <tr>
            <td>Flow ID</td>
            <td><em>Dynamic flow-id</em></td>
            <td>This is the flow stream ID for this flow, this is used to identify the flow in the flow stream.</td>
        </tr>
        <tr>
            <td>Created On</td>
            <td><em>Dynamic time/date</em></td>
            <td>This is the date and time that the flow was created.</td>
        </tr>
        <tr>
            <td>Updated On</td>
            <td><em>Dynamic time/date</em></td>
            <td>This is the date and time that the flow was last updated.</td>
        </tr>
         <tr>
            <td>Flow Designer</td>
            <td>Link</td>
            <td>This is the URL to edit the flow in Flow Designer.</td>
        </tr>
        <tr>
            <td>Grid</td>
            <td>Grid</td>
            <td></td>
            <td>Controls grids system.</td>
        </tr>
        <tr>
            <td>Style</td>
            <td>Id</td>
            <td></td>
            <td>Controls the css and styling.</td>
        </tr>
    </tbody>
        
</table>
