# Skills Inventory - Required Skills for MCP Integration

## Overview

This document provides a comprehensive inventory of all skills needed for the MCP tools integration, organized by priority and category. These skills enable AI assistants to perform complex content management tasks efficiently.

## Priority Levels

- **P0 (Critical)**: Essential for basic functionality - must have for MVP
- **P1 (High)**: Important for common workflows - needed for production
- **P2 (Medium)**: Useful for advanced scenarios - nice to have
- **P3 (Low)**: Specialized use cases - future enhancement

## Skills by Category

### 1. Content Creation Skills (P0-P1)

#### P0: Essential Content Creation

**1.1 `create_standard_page_skill`** ⭐ CRITICAL
- **Purpose**: Create a standard content page with basic structure
- **Use Case**: Most common page creation scenario
- **Tools Used**: `create_page`, `add_component` (rootcontainer, main, container, section)
- **Inputs**: path, title, description, template
- **Outputs**: Complete page with basic structure
- **Pattern**: Standard page layout (header/main/footer optional)

**1.2 `create_form_page_skill`** ⭐ CRITICAL
- **Purpose**: Create a complete form page with fields
- **Use Case**: Contact forms, registration forms, surveys
- **Tools Used**: `create_page`, `add_component` (form, input fields), `configure_validation`
- **Inputs**: path, title, form fields (name, type, required, validation)
- **Outputs**: Complete form page with validation
- **Pattern**: Form page pattern from reference content

**1.3 `create_site_skill`** ⭐ CRITICAL
- **Purpose**: Create a new site (page space) with pages and assets spaces
- **Use Case**: Setting up new sites/projects
- **Tools Used**: `create_site`, `verify_structure`
- **Inputs**: path, title, description
- **Outputs**: Site with pages and assets spaces

#### P1: Advanced Content Creation

**1.4 `create_landing_page_skill`**
- **Purpose**: Create marketing landing page with hero, features, CTA
- **Use Case**: Marketing campaigns, product launches
- **Tools Used**: `create_page`, `add_component` (hero, feature sections, CTA), `update_page` (SEO)
- **Inputs**: path, title, hero content, features array, CTA config
- **Outputs**: Complete landing page

**1.5 `create_blog_post_skill`**
- **Purpose**: Create blog post with title, content, images, metadata
- **Use Case**: Blog content creation
- **Tools Used**: `create_page`, `add_component` (title, text, image), `update_page` (SEO, date)
- **Inputs**: path, title, content, featured image, author, date
- **Outputs**: Blog post page

**1.6 `create_dashboard_skill`**
- **Purpose**: Create dashboard page with widgets and data visualization
- **Use Case**: Admin dashboards, analytics pages
- **Tools Used**: `create_page`, `add_component` (widgets, charts, tables), `configure_data_sources`
- **Inputs**: path, title, widgets array
- **Outputs**: Dashboard page

**1.7 `create_product_page_skill`**
- **Purpose**: Create product page with images, description, features, pricing
- **Use Case**: E-commerce, product catalogs
- **Tools Used**: `create_page`, `add_component` (image gallery, text, features list)
- **Inputs**: path, title, product data
- **Outputs**: Product page

### 2. Form Building Skills (P0-P1)

#### P0: Essential Form Skills

**2.1 `build_contact_form_skill`** ⭐ CRITICAL
- **Purpose**: Create contact form with name, email, message fields
- **Use Case**: Standard contact forms
- **Tools Used**: `create_form_page_skill`, `add_component` (input fields), `configure_form_submission`
- **Inputs**: path, title, submission endpoint
- **Outputs**: Contact form with validation

**2.2 `build_registration_form_skill`**
- **Purpose**: Create user registration form
- **Use Case**: User signup
- **Tools Used**: `create_form_page_skill`, `add_component` (multiple input fields), `configure_validation`
- **Inputs**: path, title, required fields
- **Outputs**: Registration form

#### P1: Advanced Form Skills

**2.3 `build_survey_form_skill`**
- **Purpose**: Create survey with multiple question types
- **Use Case**: Surveys, questionnaires
- **Tools Used**: `create_form_page_skill`, `add_component` (various field types)
- **Inputs**: path, title, questions array
- **Outputs**: Survey form

**2.4 `build_multi_step_form_skill`**
- **Purpose**: Create multi-step form with navigation
- **Use Case**: Complex forms, wizards
- **Tools Used**: `create_form_page_skill`, `add_component` (form steps), `configure_navigation`
- **Inputs**: path, title, steps array
- **Outputs**: Multi-step form

**2.5 `build_flow_form_skill`** (Flow API Integration)
- **Purpose**: Create form integrated with Flow API
- **Use Case**: Flow-based forms (from reference content)
- **Tools Used**: `create_form_page_skill`, `configure_flow_properties` (flowapi_name, flowapi_color, flowapi_icon)
- **Inputs**: path, title, flow configuration
- **Outputs**: Flow-integrated form

### 3. Component Management Skills (P0-P1)

#### P0: Essential Component Skills

**3.1 `add_component_to_page_skill`** ⭐ CRITICAL
- **Purpose**: Add a component to a page at the correct location
- **Use Case**: Adding any component to a page
- **Tools Used**: `get_page_structure`, `find_parent_component`, `add_component`, `validate_structure`
- **Inputs**: pagePath, componentType, parentPath (or auto-detect), properties
- **Outputs**: Component added and validated

**3.2 `update_component_properties_skill`** ⭐ CRITICAL
- **Purpose**: Update component properties intelligently
- **Use Case**: Modifying component configuration
- **Tools Used**: `learn_component`, `get_component_info`, `update_component`, `validate_properties`
- **Inputs**: componentPath, properties
- **Outputs**: Updated component with validation

**3.3 `remove_component_skill`**
- **Purpose**: Remove component and clean up structure
- **Use Case**: Deleting components
- **Tools Used**: `get_component_info`, `remove_component`, `validate_structure`
- **Inputs**: componentPath
- **Outputs**: Component removed, structure validated

#### P1: Advanced Component Skills

**3.4 `move_component_skill`**
- **Purpose**: Move component to new location
- **Use Case**: Reorganizing page structure
- **Tools Used**: `get_component_info`, `validate_target_location`, `move_component`
- **Inputs**: componentPath, targetParentPath, position
- **Outputs**: Component moved

**3.5 `duplicate_component_skill`**
- **Purpose**: Duplicate component with all properties
- **Use Case**: Reusing component configurations
- **Tools Used**: `get_component_info`, `add_component` (with copied properties)
- **Inputs**: componentPath, targetParentPath
- **Outputs**: Duplicated component

**3.6 `replace_component_skill`**
- **Purpose**: Replace component with different type while preserving content
- **Use Case**: Component type migration
- **Tools Used**: `get_component_info`, `extract_content`, `remove_component`, `add_component`
- **Inputs**: componentPath, newComponentType
- **Outputs**: Replaced component

### 4. Content Learning Skills (P0-P1)

#### P0: Essential Learning Skills

**4.1 `learn_component_skill`** ⭐ CRITICAL
- **Purpose**: Comprehensive component learning
- **Use Case**: Understanding any component
- **Tools Used**: `get_component_info`, `get_component_dialog`, `get_component_usage`, `analyze_patterns`
- **Inputs**: resourceType
- **Outputs**: Complete component knowledge

**4.2 `analyze_page_structure_skill`** ⭐ CRITICAL
- **Purpose**: Understand page composition and structure
- **Use Case**: Analyzing existing pages
- **Tools Used**: `get_page_structure`, `identify_patterns`, `analyze_layers`
- **Inputs**: pagePath
- **Outputs**: Structure analysis with patterns

**4.3 `find_similar_pages_skill`**
- **Purpose**: Find pages similar to a given page or pattern
- **Use Case**: Finding templates, examples
- **Tools Used**: `analyze_page_structure_skill`, `search_content`, `compare_patterns`
- **Inputs**: pagePath or pattern
- **Outputs**: List of similar pages

#### P1: Advanced Learning Skills

**4.4 `learn_component_ecosystem_skill`**
- **Purpose**: Learn entire component ecosystem
- **Use Case**: Understanding all available components
- **Tools Used**: `find_components`, `learn_component_skill` (for each)
- **Inputs**: category (optional)
- **Outputs**: Complete component catalog

**4.5 `discover_content_patterns_skill`**
- **Purpose**: Discover common content patterns
- **Use Case**: Understanding best practices
- **Tools Used**: `analyze_page_structure_skill` (multiple pages), `identify_patterns`
- **Inputs**: spacePath (optional)
- **Outputs**: Pattern catalog

**4.6 `understand_component_relationships_skill`**
- **Purpose**: Understand component compatibility and relationships
- **Use Case**: Planning component composition
- **Tools Used**: `learn_component_skill`, `analyze_allowed_children`, `find_usage_examples`
- **Inputs**: resourceType
- **Outputs**: Relationship map

### 5. Content Optimization Skills (P1-P2)

#### P1: Essential Optimization

**5.1 `optimize_page_seo_skill`**
- **Purpose**: Optimize page for SEO
- **Use Case**: SEO improvements
- **Tools Used**: `analyze_page_structure_skill`, `check_seo_metadata`, `update_page`, `update_component`
- **Inputs**: pagePath
- **Outputs**: SEO optimization report

**5.2 `improve_accessibility_skill`**
- **Purpose**: Improve page accessibility
- **Use Case**: Accessibility compliance
- **Tools Used**: `analyze_page_structure_skill`, `check_accessibility`, `update_component` (alt text, ARIA)
- **Inputs**: pagePath
- **Outputs**: Accessibility improvements

#### P2: Advanced Optimization

**5.3 `optimize_performance_skill`**
- **Purpose**: Optimize page performance
- **Use Case**: Performance improvements
- **Tools Used**: `analyze_page_structure_skill`, `identify_performance_issues`, `optimize_components`
- **Inputs**: pagePath
- **Outputs**: Performance optimization report

**5.4 `enhance_content_quality_skill`**
- **Purpose**: Improve content quality
- **Use Case**: Content review and improvement
- **Tools Used**: `analyze_page_structure_skill`, `analyze_content`, `suggest_improvements`
- **Inputs**: pagePath
- **Outputs**: Quality improvement suggestions

### 6. Asset Management Skills (P0-P1)

#### P0: Essential Asset Skills

**6.1 `upload_and_use_asset_skill`** ⭐ CRITICAL
- **Purpose**: Upload asset and add to page
- **Use Case**: Adding images/media to pages
- **Tools Used**: `upload_asset`, `add_component` (image), `configure_asset_reference`
- **Inputs**: file, targetPath, pagePath, componentPath
- **Outputs**: Asset uploaded and added to page

**6.2 `find_and_reuse_asset_skill`**
- **Purpose**: Find existing asset and reuse it
- **Use Case**: Reusing assets across pages
- **Tools Used**: `find_assets`, `get_asset_info`, `add_component` (image)
- **Inputs**: searchCriteria, pagePath
- **Outputs**: Asset found and added

#### P1: Advanced Asset Skills

**6.3 `organize_assets_skill`**
- **Purpose**: Organize assets into folders
- **Use Case**: Asset management
- **Tools Used**: `find_assets`, `move_asset`, `create_folder`
- **Inputs**: organizationRules
- **Outputs**: Assets organized

**6.4 `optimize_assets_skill`**
- **Purpose**: Optimize asset sizes and formats
- **Use Case**: Performance optimization
- **Tools Used**: `get_asset_info`, `generate_renditions`, `update_asset`
- **Inputs**: assetPath, optimizationSettings
- **Outputs**: Optimized assets

### 7. Content Migration & Bulk Operations (P1-P2)

#### P1: Essential Bulk Operations

**7.1 `bulk_update_pages_skill`**
- **Purpose**: Update multiple pages with same changes
- **Use Case**: Site-wide updates
- **Tools Used**: `find_pages`, `update_page` (for each)
- **Inputs**: searchCriteria, updateProperties
- **Outputs**: Update report

**7.2 `migrate_content_structure_skill`**
- **Purpose**: Migrate content to new structure
- **Use Case**: Content restructuring
- **Tools Used**: `analyze_page_structure_skill`, `create_new_structure`, `migrate_content`
- **Inputs**: sourcePath, targetStructure
- **Outputs**: Migrated content

#### P2: Advanced Migration

**7.3 `transform_component_types_skill`**
- **Purpose**: Transform components to different types
- **Use Case**: Component migration
- **Tools Used**: `get_component_info`, `extract_content`, `replace_component_skill`
- **Inputs**: componentPath, newComponentType
- **Outputs**: Transformed component

**7.4 `clone_page_structure_skill`**
- **Purpose**: Clone page structure to new location
- **Use Case**: Template creation
- **Tools Used**: `get_page_structure`, `create_page`, `add_component` (recursive)
- **Inputs**: sourcePagePath, targetPath
- **Outputs**: Cloned page

### 8. Site Management Skills (P0-P1)

#### P0: Essential Site Skills

**8.1 `setup_new_site_skill`** ⭐ CRITICAL
- **Purpose**: Complete site setup with structure
- **Use Case**: New site creation
- **Tools Used**: `create_site_skill`, `create_standard_page_skill` (home page), `setup_navigation`
- **Inputs**: sitePath, siteTitle, homePageConfig
- **Outputs**: Complete site with home page

**8.2 `configure_site_navigation_skill`**
- **Purpose**: Configure site navigation structure
- **Use Case**: Setting up site navigation
- **Tools Used**: `find_pages`, `update_page` (hideInNav), `create_navigation_structure`
- **Inputs**: sitePath, navigationConfig
- **Outputs**: Navigation configured

#### P1: Advanced Site Skills

**8.3 `migrate_site_structure_skill`**
- **Purpose**: Migrate entire site structure
- **Use Case**: Site restructuring
- **Tools Used**: `analyze_site_structure`, `migrate_content_structure_skill` (recursive)
- **Inputs**: sitePath, newStructure
- **Outputs**: Migrated site

### 9. Flow Integration Skills (P1-P2)

#### P1: Flow Skills (Based on Reference Content)

**9.1 `create_flow_form_skill`**
- **Purpose**: Create form integrated with Flow API
- **Use Case**: Flow-based forms (from os-triage examples)
- **Tools Used**: `build_contact_form_skill`, `configure_flow_properties`
- **Inputs**: path, title, flowConfig (flowapi_name, flowapi_color, flowapi_icon, flowapi_template)
- **Outputs**: Flow-integrated form

**9.2 `configure_flow_metadata_skill`**
- **Purpose**: Configure Flow API metadata on forms
- **Use Case**: Flow form configuration
- **Tools Used**: `learn_component` (form), `update_component_properties_skill`
- **Inputs**: formPath, flowMetadata
- **Outputs**: Flow metadata configured

### 10. Validation & Quality Skills (P0-P1)

#### P0: Essential Validation

**10.1 `validate_page_structure_skill`** ⭐ CRITICAL
- **Purpose**: Validate page structure and components
- **Use Case**: Quality assurance
- **Tools Used**: `get_page_structure`, `validate_component_rules`, `check_required_components`
- **Inputs**: pagePath
- **Outputs**: Validation report

**10.2 `validate_form_skill`**
- **Purpose**: Validate form structure and configuration
- **Use Case**: Form quality assurance
- **Tools Used**: `analyze_page_structure_skill`, `validate_form_fields`, `check_form_submission`
- **Inputs**: formPath
- **Outputs**: Form validation report

#### P1: Advanced Validation

**10.3 `comprehensive_page_audit_skill`**
- **Purpose**: Complete page audit (structure, SEO, accessibility, performance)
- **Use Case**: Comprehensive quality check
- **Tools Used**: `validate_page_structure_skill`, `optimize_page_seo_skill`, `improve_accessibility_skill`
- **Inputs**: pagePath
- **Outputs**: Complete audit report

## Skills Priority Summary

### MVP (P0) - Must Have (12 skills)

1. `create_standard_page_skill`
2. `create_form_page_skill`
3. `create_site_skill`
4. `build_contact_form_skill`
5. `add_component_to_page_skill`
6. `update_component_properties_skill`
7. `learn_component_skill`
8. `analyze_page_structure_skill`
9. `upload_and_use_asset_skill`
10. `setup_new_site_skill`
11. `validate_page_structure_skill`
12. `validate_form_skill`

### Production (P1) - Important (20 skills)

All P0 skills plus:
- Content creation: landing page, blog post, dashboard, product page
- Form building: registration, survey, multi-step, flow forms
- Component management: move, duplicate, replace
- Learning: find similar pages, learn ecosystem, discover patterns
- Optimization: SEO, accessibility
- Asset management: find/reuse, organize, optimize
- Bulk operations: bulk update, migrate structure
- Site management: configure navigation, migrate site
- Flow integration: create flow form, configure metadata
- Validation: comprehensive audit

### Enhanced (P2-P3) - Nice to Have (10+ skills)

- Performance optimization
- Content quality enhancement
- Advanced migration
- Specialized use cases

## Skills Implementation Roadmap

### Phase 1: MVP (P0 Skills)
- **Timeline**: Initial release
- **Skills**: 12 P0 skills
- **Focus**: Core functionality

### Phase 2: Production (P1 Skills)
- **Timeline**: Production release
- **Skills**: All P0 + P1 skills (32 total)
- **Focus**: Common workflows

### Phase 3: Enhanced (P2-P3 Skills)
- **Timeline**: Future enhancements
- **Skills**: Advanced capabilities
- **Focus**: Specialized use cases

## Skills by User Persona

### Content Authors
- `create_standard_page_skill`
- `create_blog_post_skill`
- `add_component_to_page_skill`
- `upload_and_use_asset_skill`
- `build_contact_form_skill`

### Designers
- `create_landing_page_skill`
- `create_dashboard_skill`
- `optimize_page_seo_skill`
- `improve_accessibility_skill`

### Developers
- `learn_component_skill`
- `analyze_page_structure_skill`
- `migrate_content_structure_skill`
- `validate_page_structure_skill`

### Administrators
- `setup_new_site_skill`
- `bulk_update_pages_skill`
- `configure_site_navigation_skill`
- `comprehensive_page_audit_skill`

## Next Steps

1. Prioritize skills for MVP implementation
2. Design skill schemas (see `11-skills-architecture.md`)
3. Implement P0 skills first
4. Test skills with real workflows
5. Iterate based on usage patterns



