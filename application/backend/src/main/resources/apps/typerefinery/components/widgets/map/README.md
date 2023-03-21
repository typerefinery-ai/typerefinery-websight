Component
============

Map component

# Overview

Component for adding map to pages

## Information
* **group**:Typerefinery - Widgets
* **sling:resourceType**: ws:Component
* **description**: Map component"
* **title**: "Map"
* **sling:resourceSuperType**: 
* **Vendor**: Typerefinery
* **Version**: 1.0
* **Compatibility**: CMS
* **Status**: Ready
* **Showcase**: [/typerefinery/components/widgets/map](http://localhost:8080/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/map::editor)
* **Local Code**: [/apps/typerefinery/components/widgets/map]
* **Source**: [github/typerefinery-websight](https://github.com/typerefinery-ai/typerefinery-websight/tree/feature/%23203-map-flow-enabled/application/backend/src/main/resources/apps/typerefinery/components/widgets/map)
* **Readme**: [/typerefinery/components/widgets/map/readme](https://github.com/typerefinery-ai/typerefinery-websight/tree/feature/%23203-map-flow-enabled/application/backend/src/main/resources/apps/typerefinery/components/widgets/map/README.md)


# Authoring

Following section covers authoring features

## Design Dialog Tab

These fields are available for input by the authors. These fields are used in templates

<table style="border-spacing: 1px;border-collapse: separate;width: 100.0%;text-align: left;background-color: black; text-indent: 4px;">
    <thead style="background-color: white;font-size: larger;">
        <tr>
            <th style="width: 8%;">Tab</th>
            <th style="width: 8%;">Field Name</th>
            <th style="width: 8%;">Default Value</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody style="background-color: #b0e0e6;">
        <tr>
            <td rowspan="2"> General</td>
            <td>latitude</td>
            <td></td>
            <td>Consists of Map latitude </td>
        </tr>
        <tr>
            <td>longitude</td>
            <td></td>
            <td>Consists of Map Longitude</td>
        </tr>
        <tr>
            <td>Tiles Layer</td>
            <td>Template Url,Copyright Url,Layer zoom</td>
            <td></td>
            <td>Consists of tiles template,copyright Url, zoom level</td>
        </tr>
        <tr>
            <td>Marker</td>
            <td>Latitude,Longitude,popup-text</td>
            <td></td>
            <td>Creates a marker on map</td>
        </tr>
        <tr>
            <td>Data</td>
            <td>DataSource Url</td>
            <td></td>
            <td>Creates marker's data from datasource JSON</td>
        </tr>
        <tr>
            <td>Flow</td>
            <td>Topics,flowId etc</td>
            <td></td>
            <td>Creates marker's data from tms connected</td>
        </tr>
        <tr>
            <td>Grid</td>
            <td>Grids</td>
            <td></td>
            <td>COntrols grids system</td>
        </tr>
        <tr>
            <td>Style</td>
            <td>Id, Classnames</td>
            <td></td>
            <td>Controls the css and styling</td>
        </tr>
    </tbody>
</table>

# Variants

This component has the following variants

<table style="border-spacing: 1px;border-collapse: separate;width: 100.0%;text-align: left;background-color: black; text-indent: 4px;">
    <thead style="background-color: white;font-size: larger;">
        <tr>
            <th style="width: 8%;">Name</th>
            <th>Description</th>
            <th>Example</th>
        </tr>
    </thead>
    <tbody style="background-color: #b0e0e6;">
        <tr>
            <td>Marker</td>
            <td>Map that display clickable/draggable icons on the map</td>
            <th>![Alt text]( ./templates/image/map.png?raw=true "Title")</th>
        </tr>
    </tbody>
</table>

<!-- # Example
<img width="800px" src="./templates/image/map.png" /> -->



<p></p>