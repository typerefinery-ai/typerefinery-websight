# User Guide - AI-Powered CMS Interaction

## Overview

This guide explains how end-users can interact with the Typerefinery CMS through AI assistants powered by MCP tools. This enables natural language interaction for content management tasks.

## Introduction

### What is AI-Powered CMS?

AI-powered CMS allows you to interact with the content management system using natural language through AI assistants like ChatGPT or Claude. Instead of using a traditional UI, you can describe what you want, and the AI will execute the operations.

### Benefits

- **Natural Language**: Use plain English to describe tasks
- **Faster Workflows**: Complete tasks with simple prompts
- **Learning Assistant**: AI helps you understand the system
- **Consistent Results**: AI follows best practices automatically

## Getting Started

### Prerequisites

- Access to AI assistant (ChatGPT Plus, Claude, etc.)
- MCP tools configured for Typerefinery CMS
- User account with appropriate permissions

### First Steps

1. **Connect to CMS**: Configure AI assistant with CMS credentials
2. **Test Connection**: Ask AI to list available pages
3. **Try Simple Task**: Create a test page to verify setup

## Basic Operations

### Viewing Content

**Example Prompts:**

```
Show me all pages in the typerefinery site
```

```
What pages exist under /content/typerefinery/pages?
```

```
Find pages with "dashboard" in the title
```

**What You Get:**
- List of pages matching your criteria
- Page titles and paths
- Basic page information

### Understanding Content Structure

**Example Prompts:**

```
Explain the structure of /content/typerefinery/pages/home
```

```
What components are used on the home page?
```

```
Show me how the contact page is organized
```

**What You Get:**
- Detailed page structure
- Component hierarchy
- Organization explanation

### Creating Content

**Example Prompts:**

```
Create a new page called "About Us" at /content/typerefinery/pages/about
```

```
Add a title "Welcome" to the main section of the home page
```

```
Create a contact form with name, email, and message fields
```

**What You Get:**
- New content created
- Confirmation of creation
- Path to created content

### Updating Content

**Example Prompts:**

```
Update the title of /content/typerefinery/pages/home to "Welcome Home"
```

```
Change the text in the hero section to "New Hero Text"
```

```
Update the contact form to make email field required
```

**What You Get:**
- Content updated
- Confirmation of changes
- Updated content information

## Common Use Cases

### Use Case 1: Creating a Blog Post

**User Request:**
```
Create a new blog post page at /content/typerefinery/pages/blog/my-first-post with:
- Title: "My First Blog Post"
- A title component with the post title
- A text component with the post content
- An image component for a featured image
```

**AI Actions:**
1. Creates page structure
2. Adds title component
3. Adds text component
4. Adds image component
5. Configures all components

**Result:**
- Complete blog post page ready for content

### Use Case 2: Updating Site Navigation

**User Request:**
```
Find all pages that should be in the main navigation and update them 
to show in navigation
```

**AI Actions:**
1. Searches for relevant pages
2. Updates hideInNav property for each
3. Confirms all updates

**Result:**
- All pages configured for navigation

### Use Case 3: Adding a New Section

**User Request:**
```
Add a new "Services" section to the home page with:
- A title "Our Services"
- Three service cards with titles and descriptions
```

**AI Actions:**
1. Analyzes home page structure
2. Adds new section
3. Creates service cards
4. Configures content

**Result:**
- New services section added to home page

### Use Case 4: Finding and Reusing Content

**User Request:**
```
Find a page similar to what I need for a product page and show me 
how to create one like it
```

**AI Actions:**
1. Searches for product-related pages
2. Analyzes page structures
3. Explains how to create similar page
4. Offers to create it for you

**Result:**
- Understanding of product page patterns
- Option to create similar page

## Advanced Features

### Learning About Components

**Example Prompts:**

```
What is the form component and how do I use it?
```

```
Show me examples of how the card component is used
```

```
What properties can I set on a title component?
```

**What You Get:**
- Component capabilities explanation
- Usage examples
- Property documentation
- Best practices

### Understanding Patterns

**Example Prompts:**

```
What are common patterns for landing pages?
```

```
How are forms typically structured?
```

```
Show me examples of dashboard page layouts
```

**What You Get:**
- Pattern identification
- Examples from reference content
- Best practices
- Reusable patterns

### Content Analysis

**Example Prompts:**

```
Analyze all pages in the marketing section and suggest improvements
```

```
Find pages that don't have proper SEO metadata
```

```
Identify pages with broken image references
```

**What You Get:**
- Content analysis results
- Recommendations
- Issues identified
- Improvement suggestions

## Best Practices

### Writing Effective Prompts

**Be Specific:**
- ✅ "Create a page at /content/typerefinery/pages/about with title 'About Us'"
- ❌ "Make an about page"

**Include Context:**
- ✅ "Add a title component to the main section of the home page"
- ❌ "Add a title"

**Provide Details:**
- ✅ "Create a form with name (required), email (required), and message fields"
- ❌ "Make a form"

### Iterative Refinement

1. **Start Simple**: Begin with basic request
2. **Review Results**: Check what AI created
3. **Refine**: Ask for adjustments
4. **Iterate**: Continue until satisfied

**Example:**
```
User: Create a contact page
AI: [Creates basic page]
User: Add a form with name and email fields
AI: [Adds form]
User: Make both fields required
AI: [Updates form]
```

### Understanding Limitations

**What AI Can Do:**
- Create and update content
- Understand content structure
- Learn component capabilities
- Follow patterns and best practices

**What AI Cannot Do:**
- Make design decisions (needs your input)
- Understand business context (needs explanation)
- Access external systems (limited to CMS)
- Bypass security (respects permissions)

## Troubleshooting

### Common Issues

**Issue**: AI doesn't understand my request
- **Solution**: Be more specific and provide context
- **Solution**: Break complex requests into smaller steps

**Issue**: AI creates something different than expected
- **Solution**: Review what was created
- **Solution**: Ask AI to explain its approach
- **Solution**: Request adjustments

**Issue**: Operation fails with permission error
- **Solution**: Check your user permissions
- **Solution**: Verify you have access to the path
- **Solution**: Contact administrator for access

**Issue**: Content not appearing as expected
- **Solution**: Ask AI to analyze the page structure
- **Solution**: Verify component properties
- **Solution**: Check for errors in component configuration

### Getting Help

1. **Ask AI**: AI can explain what it did and why
2. **Review Documentation**: Check component documentation
3. **Analyze Examples**: Study reference content
4. **Contact Support**: Reach out for assistance

## Tips and Tricks

### Efficient Workflows

1. **Plan Ahead**: Think about what you want before asking
2. **Use Templates**: Reference existing pages as templates
3. **Batch Operations**: Group related tasks together
4. **Learn Patterns**: Understand common patterns for reuse

### Learning from AI

1. **Ask Questions**: AI can explain how things work
2. **Request Examples**: See how components are used
3. **Understand Patterns**: Learn from reference content
4. **Best Practices**: AI follows best practices automatically

### Collaboration

1. **Share Prompts**: Share effective prompts with team
2. **Document Patterns**: Document successful patterns
3. **Learn Together**: Collaborate on learning
4. **Improve Workflows**: Continuously improve processes

## Example Workflows

### Complete Workflow: New Product Page

```
1. User: "Create a new product page for 'Widget Pro'"
2. AI: Creates page structure
3. User: "Add a hero section with title and product image"
4. AI: Adds hero section
5. User: "Add feature sections for key features"
6. AI: Adds feature sections
7. User: "Add a call-to-action button"
8. AI: Adds CTA button
9. User: "Review the page structure"
10. AI: Shows complete page structure
```

### Complete Workflow: Form Creation

```
1. User: "Create a contact form page"
2. AI: Creates page with form container
3. User: "Add name, email, and message fields"
4. AI: Adds form fields
5. User: "Make all fields required"
6. AI: Updates field validation
7. User: "Configure form to send to contact@example.com"
8. AI: Configures form submission
```

## Security and Permissions

### Understanding Permissions

- **Viewer**: Can view content but not modify
- **Author**: Can create and edit content
- **Editor**: Can publish content
- **Admin**: Full system access

### What You Can Do

Your permissions determine what operations you can perform:
- Creating content (Author+)
- Updating content (Author+)
- Publishing content (Editor+)
- Managing sites (Admin only)

### Security Best Practices

1. **Verify Requests**: Review what AI will do before confirming
2. **Check Permissions**: Understand your access level
3. **Review Changes**: Check changes before publishing
4. **Report Issues**: Report any security concerns

## Next Steps

1. Review author/designer guide (see `07-author-designer-guide.md`)
2. Understand component learning (see `09-component-learning.md`)
3. Learn page composition (see `10-page-composition.md`)




