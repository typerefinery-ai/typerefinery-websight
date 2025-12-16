# MCP Tool Specifications

## Overview

This document provides detailed specifications for all MCP tools required to enable AI assistants to interact with the Typerefinery CMS.

## Tool Categories

### 1. Page Management Tools

#### `create_page`

Creates a new page in the specified location.

**Parameters:**
- `path` (string, required): Full JCR path where page should be created (e.g., `/content/typerefinery/pages/new-page`)
- `title` (string, required): Page title
- `template` (string, optional): Template path (default: `/apps/typerefinery/templates/page`)
- `properties` (object, optional): Additional page properties

**Returns:**
- `success` (boolean): Operation success status
- `path` (string): Created page path
- `resource` (object): Page resource information

**Example:**
```json
{
  "path": "/content/typerefinery/pages/my-page",
  "title": "My New Page",
  "template": "/apps/typerefinery/templates/page",
  "properties": {
    "description": "Page description",
    "hideInNav": false
  }
}
```

#### `create_site`

Creates a new page space (site) in the repository.

**Parameters:**
- `path` (string, required): Full JCR path for the site (e.g., `/content/my-site`)
- `title` (string, required): Site title
- `description` (string, optional): Site description

**Returns:**
- `success` (boolean): Operation success status
- `path` (string): Created site path
- `pagesPath` (string): Path to pages space
- `assetsPath` (string): Path to assets space

**Example:**
```json
{
  "path": "/content/my-new-site",
  "title": "My New Site",
  "description": "Site description"
}
```

#### `update_page`

Updates page properties and metadata.

**Parameters:**
- `path` (string, required): Page path
- `properties` (object, required): Properties to update
- `updateContent` (boolean, optional): Whether to update jcr:content node (default: true)

**Returns:**
- `success` (boolean): Operation success status
- `path` (string): Updated page path
- `updatedProperties` (array): List of updated property names

**Example:**
```json
{
  "path": "/content/typerefinery/pages/my-page",
  "properties": {
    "jcr:title": "Updated Title",
    "description": "Updated description",
    "hideInNav": true
  }
}
```

#### `find_pages`

Searches and filters pages based on criteria.

**Parameters:**
- `space` (string, optional): Page space path to search within
- `title` (string, optional): Filter by title (partial match)
- `template` (string, optional): Filter by template
- `limit` (number, optional): Maximum results (default: 50)
- `offset` (number, optional): Result offset (default: 0)

**Returns:**
- `pages` (array): Array of page objects
- `total` (number): Total matching pages
- `limit` (number): Applied limit
- `offset` (number): Applied offset

**Example:**
```json
{
  "space": "/content/typerefinery/pages",
  "title": "dashboard",
  "limit": 10
}
```

#### `get_page_structure`

Retrieves the complete component hierarchy of a page.

**Parameters:**
- `path` (string, required): Page path

**Returns:**
- `path` (string): Page path
- `structure` (object): Component tree structure
- `components` (array): Flat list of all components with paths

**Example:**
```json
{
  "path": "/content/typerefinery/pages/my-page"
}
```

### 2. Asset Management Tools

#### `upload_asset`

Uploads a file to the assets space.

**Parameters:**
- `path` (string, required): Target path in assets space
- `file` (file, required): File to upload
- `metadata` (object, optional): Asset metadata
- `generateRenditions` (boolean, optional): Generate renditions (default: true)

**Returns:**
- `success` (boolean): Operation success status
- `path` (string): Created asset path
- `renditions` (array): Generated rendition paths

**Example:**
```json
{
  "path": "/content/typerefinery/assets/images/logo.png",
  "file": "<file data>",
  "metadata": {
    "title": "Company Logo",
    "alt": "Company logo image"
  }
}
```

#### `find_assets`

Searches for assets in the repository.

**Parameters:**
- `space` (string, optional): Assets space path
- `mimeType` (string, optional): Filter by MIME type
- `name` (string, optional): Filter by name (partial match)
- `limit` (number, optional): Maximum results (default: 50)

**Returns:**
- `assets` (array): Array of asset objects
- `total` (number): Total matching assets

**Example:**
```json
{
  "space": "/content/typerefinery/assets",
  "mimeType": "image/png",
  "limit": 20
}
```

#### `get_asset_info`

Retrieves detailed information about an asset.

**Parameters:**
- `path` (string, required): Asset path

**Returns:**
- `path` (string): Asset path
- `metadata` (object): Asset metadata
- `renditions` (array): Available renditions
- `size` (number): File size in bytes
- `mimeType` (string): MIME type

**Example:**
```json
{
  "path": "/content/typerefinery/assets/images/logo.png"
}
```

#### `delete_asset`

Removes an asset from the repository.

**Parameters:**
- `path` (string, required): Asset path

**Returns:**
- `success` (boolean): Operation success status
- `path` (string): Deleted asset path

### 3. Component Discovery Tools

#### `find_components`

Searches for available components in the component registry.

**Parameters:**
- `group` (string, optional): Filter by component group
- `resourceType` (string, optional): Filter by resource type (partial match)
- `isContainer` (boolean, optional): Filter container components
- `isLayout` (boolean, optional): Filter layout components

**Returns:**
- `components` (array): Array of component definitions
- `total` (number): Total matching components

**Example:**
```json
{
  "group": "Typerefinery - Forms",
  "isContainer": true
}
```

#### `get_component_info`

Retrieves basic information about a component.

**Parameters:**
- `resourceType` (string, required): Component resource type

**Returns:**
- `resourceType` (string): Component resource type
- `title` (string): Component title
- `description` (string): Component description
- `group` (string): Component group
- `isContainer` (boolean): Whether component is a container
- `isLayout` (boolean): Whether component is a layout component
- `allowedComponents` (array): Allowed child components

**Example:**
```json
{
  "resourceType": "typerefinery/components/forms/form"
}
```

#### `learn_component`

Comprehensive component learning that retrieves all available information.

**Parameters:**
- `resourceType` (string, required): Component resource type
- `includeExamples` (boolean, optional): Include usage examples (default: true)

**Returns:**
- `resourceType` (string): Component resource type
- `metadata` (object): Component metadata
- `dialog` (object): Dialog configuration
- `documentation` (string): README content
- `usage` (object): Usage patterns
- `examples` (array): Usage examples from reference content
- `allowedChildren` (array): Allowed child components
- `properties` (object): Common properties and their types

**Example:**
```json
{
  "resourceType": "typerefinery/components/forms/form",
  "includeExamples": true
}
```

#### `get_component_dialog`

Retrieves the dialog configuration for a component.

**Parameters:**
- `resourceType` (string, required): Component resource type

**Returns:**
- `resourceType` (string): Component resource type
- `dialog` (object): Dialog structure
- `tabs` (array): Dialog tabs
- `fields` (array): Dialog fields with types and constraints

### 4. Content Learning Tools

#### `analyze_page_structure`

Analyzes a page to understand its composition and structure.

**Parameters:**
- `path` (string, required): Page path

**Returns:**
- `path` (string): Page path
- `structure` (object): Component hierarchy
- `layers` (array): Identified component layers
- `patterns` (array): Detected content patterns
- `componentCount` (object): Count of each component type

#### `learn_content_patterns`

Identifies common content patterns from reference pages.

**Parameters:**
- `space` (string, optional): Page space to analyze
- `patternType` (string, optional): Type of pattern to find

**Returns:**
- `patterns` (array): Identified patterns
- `frequency` (object): Pattern frequency statistics

#### `get_component_usage`

Finds examples of component usage in reference content.

**Parameters:**
- `resourceType` (string, required): Component resource type
- `limit` (number, optional): Maximum examples (default: 5)

**Returns:**
- `resourceType` (string): Component resource type
- `examples` (array): Usage examples with paths and context

#### `understand_layers`

Learns component layering rules and allowed combinations.

**Parameters:**
- `resourceType` (string, optional): Starting component type

**Returns:**
- `layers` (array): Layer definitions
- `rules` (object): Layering rules
- `allowedCombinations` (array): Valid layer combinations

### 5. Content Modification Tools

#### `add_component`

Adds a component to a page at the specified location.

**Parameters:**
- `pagePath` (string, required): Page path
- `parentPath` (string, required): Parent component path
- `componentType` (string, required): Component resource type
- `properties` (object, optional): Initial component properties
- `position` (string, optional): Position relative to siblings ("before", "after", "first", "last")

**Returns:**
- `success` (boolean): Operation success status
- `path` (string): Created component path
- `id` (string): Generated component ID

**Example:**
```json
{
  "pagePath": "/content/typerefinery/pages/my-page",
  "parentPath": "/content/typerefinery/pages/my-page/jcr:content/rootcontainer/main/container",
  "componentType": "typerefinery/components/content/title",
  "properties": {
    "title": "My Title"
  },
  "position": "last"
}
```

#### `update_component`

Updates component properties.

**Parameters:**
- `path` (string, required): Component path
- `properties` (object, required): Properties to update

**Returns:**
- `success` (boolean): Operation success status
- `path` (string): Updated component path
- `updatedProperties` (array): List of updated property names

#### `remove_component`

Removes a component from a page.

**Parameters:**
- `path` (string, required): Component path

**Returns:**
- `success` (boolean): Operation success status
- `path` (string): Removed component path

#### `move_component`

Moves a component to a new location.

**Parameters:**
- `path` (string, required): Component path
- `targetParentPath` (string, required): New parent path
- `position` (string, optional): Position in new parent

**Returns:**
- `success` (boolean): Operation success status
- `newPath` (string): New component path

### 6. Search & Discovery Tools

#### `search_content`

Performs full-text search across content.

**Parameters:**
- `query` (string, required): Search query
- `type` (string, optional): Filter by node type
- `path` (string, optional): Limit search to path
- `limit` (number, optional): Maximum results (default: 50)

**Returns:**
- `results` (array): Search results
- `total` (number): Total matching results

#### `find_by_path`

Locates a resource by its JCR path.

**Parameters:**
- `path` (string, required): Resource path

**Returns:**
- `exists` (boolean): Whether resource exists
- `resource` (object): Resource information if exists
- `type` (string): Resource type

#### `find_by_type`

Finds all resources of a specific type.

**Parameters:**
- `type` (string, required): Node type (e.g., "ws:Page", "ws:PageContent")
- `path` (string, optional): Limit search to path
- `limit` (number, optional): Maximum results (default: 100)

**Returns:**
- `resources` (array): Array of resource paths
- `total` (number): Total matching resources

#### `get_content_tree`

Retrieves hierarchical content structure.

**Parameters:**
- `path` (string, required): Root path
- `depth` (number, optional): Maximum depth (default: 5)
- `includeProperties` (boolean, optional): Include node properties (default: false)

**Returns:**
- `tree` (object): Hierarchical tree structure
- `depth` (number): Actual depth retrieved

## Tool Implementation Requirements

### Error Handling

All tools must:
- Return consistent error format
- Include error codes and messages
- Provide context for debugging
- Log errors for audit purposes

### Validation

All tools must:
- Validate input parameters
- Check authorization before operations
- Validate resource existence where applicable
- Enforce business rules and constraints

### Response Format

All tools return responses in this format:

```json
{
  "success": true,
  "data": { /* tool-specific data */ },
  "errors": [],
  "warnings": []
}
```

Or on error:

```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "ERROR_CODE",
      "message": "Human-readable error message",
      "details": { /* additional context */ }
    }
  ],
  "warnings": []
}
```

## Tool Registration

Tools should be registered with the MCP server using standard MCP tool registration format, including:
- Tool name
- Description
- Parameter schema (JSON Schema)
- Return type schema
- Examples

## Next Steps

1. Review content structure analysis (see `03-content-structure-analysis.md`)
2. Understand security requirements (see `04-security-evaluation.md`)
3. Review architecture patterns (see `05-architecture-evaluation.md`)




