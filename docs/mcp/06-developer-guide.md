# Developer Guide - MCP Tools Implementation

## Overview

This guide provides detailed instructions for developers implementing and extending MCP tools for the Typerefinery CMS integration.

## Prerequisites

### Required Knowledge

- Java development
- Apache Sling framework
- JCR (Java Content Repository)
- REST API design
- MCP (Model Context Protocol) basics

### Development Environment

- Java JDK 11+
- Maven 3.6+
- IDE (IntelliJ IDEA or Eclipse)
- Local CMS instance
- MCP server setup

## Project Structure

### Directory Layout

```
typerefinery-websight/
├── application/
│   └── backend/
│       └── src/
│           └── main/
│               ├── java/
│               │   └── ai/typerefinery/websight/
│               │       ├── mcp/              # MCP tool implementations
│               │       │   ├── tools/         # Individual tool classes
│               │       │   ├── services/     # Service layer
│               │       │   └── models/        # Data models
│               │       └── ...
│               └── resources/
│                   └── ...
└── docs/
    └── mcp/                    # Documentation
```

## MCP Tool Implementation

### Tool Interface

All MCP tools implement a common interface:

```java
public interface MCPTool {
    String getName();
    String getDescription();
    JSONSchema getParameterSchema();
    ToolResult execute(ToolContext context) throws ToolException;
}
```

### Example Tool Implementation

```java
@Component(service = MCPTool.class)
public class CreatePageTool implements MCPTool {
    
    @Reference
    private PageManager pageManager;
    
    @Reference
    private ResourceResolverFactory resourceResolverFactory;
    
    @Override
    public String getName() {
        return "create_page";
    }
    
    @Override
    public String getDescription() {
        return "Creates a new page in the specified location";
    }
    
    @Override
    public JSONSchema getParameterSchema() {
        return JSONSchema.builder()
            .addProperty("path", JSONSchema.string()
                .description("Full JCR path where page should be created")
                .required())
            .addProperty("title", JSONSchema.string()
                .description("Page title")
                .required())
            .addProperty("template", JSONSchema.string()
                .description("Template path")
                .defaultValue("/apps/typerefinery/templates/page"))
            .build();
    }
    
    @Override
    public ToolResult execute(ToolContext context) throws ToolException {
        try {
            // Validate authentication
            validateAuth(context);
            
            // Extract parameters
            String path = context.getParameter("path", String.class);
            String title = context.getParameter("title", String.class);
            String template = context.getParameter("template", String.class, 
                "/apps/typerefinery/templates/page");
            
            // Validate path
            validatePath(path);
            
            // Get resource resolver
            ResourceResolver resolver = resourceResolverFactory
                .getServiceResourceResolver(Collections.emptyMap());
            
            try {
                // Create page
                Page page = pageManager.createPage(
                    resolver.getResource(getParentPath(path)),
                    getPageName(path),
                    template,
                    createPageProperties(title)
                );
                
                return ToolResult.success()
                    .addData("path", page.getPath())
                    .addData("title", page.getTitle());
                    
            } finally {
                resolver.close();
            }
            
        } catch (Exception e) {
            throw new ToolException("Failed to create page", e);
        }
    }
    
    private void validatePath(String path) throws ValidationException {
        if (path == null || path.isEmpty()) {
            throw new ValidationException("Path is required");
        }
        if (!path.startsWith("/content/")) {
            throw new ValidationException("Path must be under /content");
        }
        if (path.contains("..")) {
            throw new ValidationException("Path traversal not allowed");
        }
    }
}
```

## Service Layer Implementation

### Page Service

```java
@Service
public class PageService {
    
    @Reference
    private PageManager pageManager;
    
    public Page createPage(CreatePageRequest request) throws PageException {
        // Implementation
    }
    
    public Page updatePage(String path, UpdatePageRequest request) 
            throws PageException {
        // Implementation
    }
    
    public Page findPage(String path) throws PageException {
        // Implementation
    }
    
    public List<Page> searchPages(SearchCriteria criteria) {
        // Implementation
    }
}
```

### Component Service

```java
@Service
public class ComponentService {
    
    public ComponentDefinition getComponent(String resourceType) {
        // Read component .content.json
        // Read dialog configuration
        // Read README.md
        // Return complete definition
    }
    
    public List<ComponentDefinition> findComponents(
            ComponentSearchCriteria criteria) {
        // Search component registry
        // Filter by criteria
        // Return matching components
    }
    
    public ComponentKnowledge learnComponent(String resourceType) {
        // Get component definition
        // Find usage examples
        // Analyze patterns
        // Return comprehensive knowledge
    }
}
```

## REST API Endpoints

### Endpoint Implementation

```java
@Path("/api/mcp")
public class MCPResource {
    
    @Reference
    private MCPToolRegistry toolRegistry;
    
    @POST
    @Path("/tools/{toolName}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response executeTool(
            @PathParam("toolName") String toolName,
            Map<String, Object> parameters) {
        
        try {
            // Get tool
            MCPTool tool = toolRegistry.getTool(toolName);
            if (tool == null) {
                return Response.status(404)
                    .entity(errorResponse("Tool not found"))
                    .build();
            }
            
            // Create context
            ToolContext context = new ToolContext(parameters);
            
            // Execute tool
            ToolResult result = tool.execute(context);
            
            // Return result
            return Response.ok(result.toJson()).build();
            
        } catch (ToolException e) {
            return Response.status(400)
                .entity(errorResponse(e.getMessage()))
                .build();
        }
    }
}
```

## Error Handling

### Custom Exceptions

```java
public class ToolException extends Exception {
    private final String errorCode;
    private final Map<String, Object> details;
    
    public ToolException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
        this.details = new HashMap<>();
    }
    
    // Getters and setters
}

public class ValidationException extends ToolException {
    public ValidationException(String message) {
        super(message, "VALIDATION_ERROR");
    }
}

public class AuthorizationException extends ToolException {
    public AuthorizationException(String message) {
        super(message, "AUTHORIZATION_ERROR");
    }
}
```

### Error Response Format

```java
public class ErrorResponse {
    private boolean success = false;
    private String errorCode;
    private String message;
    private Map<String, Object> details;
    
    // Constructors and getters
}
```

## Testing

### Unit Tests

```java
@ExtendWith(MockitoExtension.class)
class CreatePageToolTest {
    
    @Mock
    private PageManager pageManager;
    
    @Mock
    private ResourceResolverFactory resourceResolverFactory;
    
    @InjectMocks
    private CreatePageTool tool;
    
    @Test
    void testCreatePageSuccess() throws Exception {
        // Setup
        CreatePageRequest request = new CreatePageRequest();
        request.setPath("/content/test/pages/new-page");
        request.setTitle("New Page");
        
        // Execute
        ToolResult result = tool.execute(createContext(request));
        
        // Verify
        assertTrue(result.isSuccess());
        assertEquals("/content/test/pages/new-page", 
            result.getData("path"));
    }
    
    @Test
    void testCreatePageInvalidPath() {
        // Test path validation
    }
}
```

### Integration Tests

```java
@ExtendWith(SlingContextExtension.class)
class PageServiceIntegrationTest {
    
    @Test
    void testCreatePageIntegration() {
        // Test with real Sling context
    }
}
```

## Configuration

### OSGi Configuration

```java
@ObjectClassDefinition(name = "MCP Tools Configuration")
public @interface MCPToolsConfig {
    
    @AttributeDefinition(name = "Enable MCP Tools")
    boolean enabled() default true;
    
    @AttributeDefinition(name = "Rate Limit (requests per minute)")
    int rateLimit() default 100;
    
    @AttributeDefinition(name = "Allowed Paths")
    String[] allowedPaths() default {"/content"};
}
```

### Configuration File

```properties
# MCP Tools Configuration
mcp.tools.enabled=true
mcp.tools.rateLimit=100
mcp.tools.allowedPaths=/content
```

## Logging

### Logging Implementation

```java
@Component(service = MCPTool.class)
public class CreatePageTool implements MCPTool {
    
    private static final Logger log = LoggerFactory
        .getLogger(CreatePageTool.class);
    
    @Override
    public ToolResult execute(ToolContext context) {
        log.info("Creating page: {}", context.getParameter("path"));
        
        try {
            // Implementation
            log.debug("Page created successfully");
            return ToolResult.success();
        } catch (Exception e) {
            log.error("Failed to create page", e);
            throw new ToolException("Creation failed", e);
        }
    }
}
```

## Security Implementation

### Authentication

```java
public class ToolContext {
    
    private final AuthenticationToken token;
    private final Map<String, Object> parameters;
    
    public void validateAuth() throws AuthorizationException {
        if (token == null || !token.isValid()) {
            throw new AuthorizationException("Invalid token");
        }
    }
    
    public boolean hasPermission(String permission) {
        return token.hasPermission(permission);
    }
}
```

### Authorization

```java
@Component(service = MCPTool.class)
public class CreatePageTool implements MCPTool {
    
    @Override
    public ToolResult execute(ToolContext context) {
        // Validate authentication
        context.validateAuth();
        
        // Check authorization
        if (!context.hasPermission("pages:create")) {
            throw new AuthorizationException(
                "Insufficient permissions");
        }
        
        // Proceed with operation
    }
}
```

## Performance Optimization

### Caching

```java
@Component(service = ComponentService.class)
public class ComponentService {
    
    @Reference
    private CacheManager cacheManager;
    
    private Cache<String, ComponentDefinition> componentCache;
    
    @Activate
    protected void activate() {
        componentCache = cacheManager.getCache("components");
    }
    
    public ComponentDefinition getComponent(String resourceType) {
        return componentCache.get(resourceType, () -> {
            return loadComponentFromRepository(resourceType);
        });
    }
}
```

### Async Processing

```java
@Component(service = MCPTool.class)
public class BulkUpdateTool implements MCPTool {
    
    @Reference
    private ExecutorService executorService;
    
    @Override
    public ToolResult execute(ToolContext context) {
        // Submit async task
        CompletableFuture<Result> future = CompletableFuture
            .supplyAsync(() -> processUpdates(context), executorService);
        
        return ToolResult.async(future);
    }
}
```

## Documentation

### Tool Documentation

Each tool should include:
- Name and description
- Parameter documentation
- Return value documentation
- Example usage
- Error conditions

### Code Documentation

```java
/**
 * Creates a new page in the specified location.
 * 
 * @param path Full JCR path where page should be created
 * @param title Page title
 * @param template Template path (optional)
 * @return Created page information
 * @throws ValidationException if path is invalid
 * @throws AuthorizationException if user lacks permissions
 */
public ToolResult createPage(String path, String title, String template) {
    // Implementation
}
```

## Deployment

### Build Configuration

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-bundle-plugin</artifactId>
    <configuration>
        <instructions>
            <Bundle-SymbolicName>ai.typerefinery.websight.mcp</Bundle-SymbolicName>
            <Export-Package>ai.typerefinery.websight.mcp.*</Export-Package>
        </instructions>
    </configuration>
</plugin>
```

### Deployment Steps

1. Build the bundle: `mvn clean install`
2. Deploy to CMS: Copy bundle to deploy folder
3. Verify installation: Check OSGi console
4. Test tools: Execute test requests
5. Monitor: Check logs for errors

## Best Practices

### Code Quality

- Follow Java coding standards
- Use meaningful variable names
- Write comprehensive tests
- Document complex logic
- Handle exceptions properly

### Performance

- Cache frequently accessed data
- Use connection pooling
- Optimize database queries
- Implement pagination
- Use async processing for heavy operations

### Security

- Validate all input
- Sanitize output
- Check permissions
- Log security events
- Use parameterized queries

## Troubleshooting

### Common Issues

1. **Tool not found**: Check tool registration
2. **Authentication failures**: Verify token validity
3. **Permission errors**: Check user permissions
4. **Path validation errors**: Verify path format
5. **Performance issues**: Check caching and queries

### Debugging

- Enable debug logging
- Use breakpoints in IDE
- Check OSGi console
- Review audit logs
- Monitor performance metrics

## Next Steps

1. Review architecture evaluation (see `05-architecture-evaluation.md`)
2. Understand user guides (see `07-author-designer-guide.md`, `08-user-guide.md`)
3. Review component learning (see `09-component-learning.md`)
4. Understand page composition (see `10-page-composition.md`)




