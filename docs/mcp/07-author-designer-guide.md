# Author & Designer Guide - Using MCP Tools for Content Creation

## Overview

This guide explains how content authors and designers can leverage AI assistants (via MCP tools) to create, update, and manage content in the Typerefinery CMS.

## Getting Started

### Prerequisites

- Access to AI assistant with MCP tools enabled (ChatGPT, Claude, etc.)
- Author or Editor role in the CMS
- Basic understanding of content structure

### Initial Setup

1. **Connect AI Assistant**: Configure your AI assistant to use MCP tools
2. **Authenticate**: Provide your CMS credentials
3. **Verify Access**: Test connection with a simple query

## Common Workflows

### Creating a New Page

**Scenario**: Create a new landing page for a product launch.

**AI Prompt:**
```
Create a new page at /content/typerefinery/pages/product-launch with:
- Title: "Product Launch 2024"
- Template: Standard page template
- Include header, main content area, and footer
```

**What Happens:**
1. AI uses `create_page` tool to create the page structure
2. AI uses `add_component` to add layout components
3. AI confirms page creation with path

**Result:**
- New page created at specified path
- Basic structure with header, main, footer
- Ready for content addition

### Adding Content Components

**Scenario**: Add a title and text content to a page.

**AI Prompt:**
```
Add a title component with text "Welcome to Our Product" and a text component 
with a paragraph about the product to the main section of 
/content/typerefinery/pages/product-launch
```

**What Happens:**
1. AI uses `get_page_structure` to understand page layout
2. AI uses `add_component` to add title component
3. AI uses `add_component` to add text component
4. AI sets appropriate properties for each component

**Result:**
- Title component with specified text
- Text component with content
- Components properly nested in main section

### Creating a Form

**Scenario**: Create a contact form.

**AI Prompt:**
```
Create a contact form on /content/typerefinery/pages/contact with fields:
- Name (text input, required)
- Email (text input, required)
- Message (textarea, required)
- Submit button
```

**What Happens:**
1. AI uses `learn_component` to understand form component
2. AI uses `add_component` to add form container
3. AI adds input components with labels and fields
4. AI configures form properties

**Result:**
- Complete form with all specified fields
- Proper validation setup
- Submit button configured

### Uploading and Using Assets

**Scenario**: Add an image to a page.

**AI Prompt:**
```
Upload the image file logo.png to /content/typerefinery/assets/images/ 
and then add it to the header of /content/typerefinery/pages/product-launch
```

**What Happens:**
1. AI uses `upload_asset` to upload the file
2. AI uses `add_component` to add image component
3. AI sets image component to reference uploaded asset

**Result:**
- Asset uploaded to assets space
- Image component added to page
- Image displayed in header

## Advanced Workflows

### Learning Component Capabilities

**Scenario**: Understand what a component can do.

**AI Prompt:**
```
Tell me about the form component - what properties does it have, 
what can it do, and show me examples of how it's used
```

**What Happens:**
1. AI uses `learn_component` to get comprehensive component information
2. AI analyzes component definition, dialog, and documentation
3. AI finds usage examples from reference content
4. AI provides detailed explanation

**Result:**
- Complete understanding of component capabilities
- Examples of component usage
- Best practices for using the component

### Analyzing Page Structure

**Scenario**: Understand how an existing page is structured.

**AI Prompt:**
```
Analyze the structure of /content/typerefinery-showcase/pages/components/content 
and explain how it's organized
```

**What Happens:**
1. AI uses `analyze_page_structure` to get page hierarchy
2. AI identifies component layers and patterns
3. AI explains the structure and organization

**Result:**
- Detailed page structure analysis
- Component hierarchy visualization
- Pattern identification

### Finding and Reusing Content

**Scenario**: Find similar pages to use as a template.

**AI Prompt:**
```
Find all pages with "dashboard" in the title and show me their structure
```

**What Happens:**
1. AI uses `find_pages` to search for matching pages
2. AI uses `get_page_structure` for each found page
3. AI presents results with structure information

**Result:**
- List of matching pages
- Structure information for each
- Ability to use as templates

### Bulk Operations

**Scenario**: Update multiple pages at once.

**AI Prompt:**
```
Update all pages in /content/typerefinery/pages/marketing to hide them 
from navigation
```

**What Happens:**
1. AI uses `find_pages` to find all pages in the space
2. AI uses `update_page` for each page
3. AI confirms all updates

**Result:**
- All pages updated with new property
- Consistent changes across multiple pages

## Component Patterns

### Layout Patterns

**Standard Page Layout:**
```
rootcontainer
├── header
├── main
│   └── container
│       └── section
│           └── [content components]
└── footer
```

**Full-Width Layout:**
```
rootcontainer
└── main
    └── [content components]
```

**Multi-Column Layout:**
```
rootcontainer
└── main
    └── container
        ├── section (left column)
        └── section (right column)
```

### Content Patterns

**Article Page:**
- Title component
- Text component (multiple)
- Image components
- Embed components

**Landing Page:**
- Hero section (title + image)
- Feature sections
- Call-to-action sections
- Footer

**Form Page:**
- Form container
- Input fields with labels
- Submit button

## Best Practices

### Content Organization

1. **Use Consistent Structure**: Follow established patterns
2. **Naming Conventions**: Use clear, descriptive names
3. **Component Hierarchy**: Maintain proper nesting
4. **Reusability**: Create reusable component patterns

### Component Selection

1. **Understand Components**: Learn component capabilities before use
2. **Check Allowed Components**: Verify component compatibility
3. **Use Appropriate Types**: Choose right component for content
4. **Follow Patterns**: Use established component patterns

### Page Design

1. **Start with Layout**: Establish page structure first
2. **Add Content Gradually**: Build content incrementally
3. **Test Responsiveness**: Verify on different screen sizes
4. **Optimize Performance**: Minimize component count

## Troubleshooting

### Common Issues

**Issue**: Component not appearing
- **Solution**: Check component is allowed in parent
- **Solution**: Verify component path is correct

**Issue**: Page not found
- **Solution**: Verify page path is correct
- **Solution**: Check user has access to path

**Issue**: Asset not loading
- **Solution**: Verify asset path is correct
- **Solution**: Check asset exists and is accessible

### Getting Help

1. **Ask AI**: Use AI assistant for guidance
2. **Check Documentation**: Review component documentation
3. **Analyze Examples**: Study reference content
4. **Contact Support**: Reach out to development team

## Tips and Tricks

### Efficient Workflows

1. **Batch Requests**: Group related operations
2. **Use Templates**: Start from existing pages
3. **Learn Patterns**: Understand common patterns
4. **Reuse Components**: Create reusable component sets

### AI Prompt Optimization

**Good Prompts:**
- Specific and clear
- Include paths and details
- Specify component types
- Provide context

**Poor Prompts:**
- Vague or ambiguous
- Missing important details
- Unclear requirements
- No context provided

### Example Good Prompt:
```
Create a new page at /content/typerefinery/pages/services with:
- Title: "Our Services"
- Template: Standard page template
- Add a title component in the main section with text "Services We Offer"
- Add a text component below with a paragraph describing services
- Add an image component referencing /content/typerefinery/assets/images/services-hero.png
```

## Workflow Examples

### Example 1: Complete Landing Page

```
1. Create page structure
2. Add header with logo
3. Add hero section (title + image)
4. Add feature sections
5. Add call-to-action
6. Add footer
7. Review and refine
```

### Example 2: Form Creation

```
1. Create page
2. Add form container
3. Learn form component capabilities
4. Add input fields
5. Configure validation
6. Add submit button
7. Test form
```

### Example 3: Content Update

```
1. Find pages to update
2. Analyze page structure
3. Identify components to update
4. Update component properties
5. Verify changes
6. Publish if needed
```

## Next Steps

1. Review user guide (see `08-user-guide.md`)
2. Understand component learning (see `09-component-learning.md`)
3. Learn page composition (see `10-page-composition.md`)




