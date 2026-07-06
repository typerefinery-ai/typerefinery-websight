package ai.typerefinery.websight.services.flow;

import java.util.HashMap;
import java.util.Map;

import org.apache.sling.api.resource.ModifiableValueMap;
import org.apache.sling.api.resource.PersistenceException;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.api.resource.ValueMap;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ai.typerefinery.websight.services.ContentAccess;

/**
 * Service to manage Flow service data storage in /var/typerefinery/flow/.
 * 
 * This service handles:
 * - Mapping /content paths to /var paths
 * - Creating /var resources when needed
 * - Syncing component metadata to /var
 * - Syncing /var data to Flow API
 * - Syncing Flow API responses back to /var
 */
@Component(
    service = FlowSyncStorageService.class,
    immediate = true
)
public class FlowSyncStorageService {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(FlowSyncStorageService.class);
    
    /**
     * Base path for Flow service data in /var
     */
    public static final String VAR_BASE_PATH = "/var/typerefinery/flow";
    
    @Reference
    private ContentAccess contentAccess;
    
    @Reference
    private FlowService flowService;
    
    /**
     * Maps a /content component path to its corresponding /var path.
     * 
     * Example: /content/site/page/jcr:content/root/container/component
     *          -> /var/typerefinery/flow/content/site/page/jcr:content/root/container/component
     * 
     * If the path already starts with VAR_BASE_PATH, it is returned as-is to prevent duplication.
     * 
     * @param componentPath The /content path (or already a /var path)
     * @return The /var path
     */
    public String getVarPath(@NotNull String componentPath) {
        if (componentPath == null || componentPath.isEmpty()) {
            LOGGER.error("FlowSyncStorageService.getVarPath: componentPath is null or empty");
            return null;
        }
        
        // If path already starts with VAR_BASE_PATH, return as-is (prevents duplication)
        if (componentPath.startsWith(VAR_BASE_PATH)) {
            LOGGER.debug("FlowSyncStorageService.getVarPath: Path already is a var path, returning as-is. componentPath={}", 
                componentPath);
            return componentPath;
        }
        
        // Remove leading slash if present, then add /var base
        String normalizedPath = componentPath.startsWith("/") 
            ? componentPath.substring(1) 
            : componentPath;
        
        String varPath = VAR_BASE_PATH + "/" + normalizedPath;
        LOGGER.debug("FlowSyncStorageService.getVarPath: Mapped component path to var path. componentPath={}, varPath={}", 
            componentPath, varPath);
        return varPath;
    }

    /**
     * Maps a /var flow resource path back to its corresponding component path.
     *
     * Example: /var/typerefinery/flow/content/site/page/jcr:content/root/container/component
     *          -> /content/site/page/jcr:content/root/container/component
     *
     * If the path is not under {@link #VAR_BASE_PATH}, it is returned as-is.
     *
     * @param resourcePath The /var path (or already a component path)
     * @return The component path
     */
    public String getComponentPath(@NotNull String resourcePath) {
        if (resourcePath == null || resourcePath.isEmpty()) {
            LOGGER.error("FlowSyncStorageService.getComponentPath: resourcePath is null or empty");
            return null;
        }

        if (!resourcePath.startsWith(VAR_BASE_PATH)) {
            return resourcePath;
        }

        String componentPath = resourcePath.substring(VAR_BASE_PATH.length());
        if (componentPath.isEmpty()) {
            componentPath = "/";
        }

        LOGGER.debug("FlowSyncStorageService.getComponentPath: Mapped var path to component path. varPath={}, componentPath={}",
            resourcePath, componentPath);
        return componentPath;
    }
    
    /**
     * Gets or creates the /var resource for a component path.
     * 
     * @param componentPath The /content component path
     * @param resourceResolver The resource resolver to use
     * @return The /var resource, or null if creation failed
     */
    @Nullable
    public Resource getOrCreateVarResource(@NotNull String componentPath, @NotNull ResourceResolver resourceResolver) {
        if (componentPath == null || componentPath.isEmpty()) {
            LOGGER.error("FlowSyncStorageService.getOrCreateVarResource: componentPath is null or empty");
            return null;
        }
        
        if (resourceResolver == null) {
            LOGGER.error("FlowSyncStorageService.getOrCreateVarResource: resourceResolver is null");
            return null;
        }
        
        String varPath = getVarPath(componentPath);
        if (varPath == null) {
            return null;
        }
        
        Resource varResource = resourceResolver.getResource(varPath);
        
        if (varResource == null) {
            // Create the resource and all parent nodes
            try {
                varResource = ResourceUtil.getOrCreateResource(
                    resourceResolver,
                    varPath,
                    new HashMap<String, Object>(),
                    "sling:Folder",
                    false
                );
                
                LOGGER.info("FlowSyncStorageService.getOrCreateVarResource: Created var resource. varPath={}", varPath);
            } catch (PersistenceException e) {
                LOGGER.error("FlowSyncStorageService.getOrCreateVarResource: Failed to create var resource. varPath={}", 
                    varPath, e);
                return null;
            }
        }
        
        return varResource;
    }
    
    /**
     * Syncs user-controlled metadata from component resource to /var resource.
     * This copies properties that users can edit in dialogs.
     * 
     * @param componentResource The /content component resource
     * @return true if sync succeeded, false otherwise
     */
    public boolean syncComponentToVar(@NotNull Resource componentResource) {
        if (componentResource == null) {
            LOGGER.error("FlowSyncStorageService.syncComponentToVar: componentResource is null");
            return false;
        }
        
        ResourceResolver resolver = componentResource.getResourceResolver();
        if (resolver == null) {
            LOGGER.error("FlowSyncStorageService.syncComponentToVar: resourceResolver is null. path={}", 
                componentResource.getPath());
            return false;
        }
        
        String componentPath = componentResource.getPath();
        Resource varResource = getOrCreateVarResource(componentPath, resolver);
        if (varResource == null) {
            LOGGER.error("FlowSyncStorageService.syncComponentToVar: Failed to get or create var resource. path={}", 
                componentPath);
            return false;
        }
        
        try {
            ValueMap componentProps = componentResource.getValueMap();
            ModifiableValueMap varProps = varResource.adaptTo(ModifiableValueMap.class);
            
            if (varProps == null) {
                LOGGER.error("FlowSyncStorageService.syncComponentToVar: Cannot adapt var resource to ModifiableValueMap. path={}", 
                    varResource.getPath());
                return false;
            }
            
            // Copy user-controlled properties from component to var
            // These are properties that users can edit in dialogs
            Map<String, Object> propsToSync = new HashMap<>();
            
            // User metadata properties
            String[] userProps = {
                FlowService.prop(FlowService.PROPERTY_ENABLE),
                FlowService.prop(FlowService.PROPERTY_TEMPLATE),
                FlowService.prop(FlowService.PROPERTY_TEMPLATE_DESIGN),
                FlowService.prop(FlowService.PROPERTY_TITLE),
                FlowService.prop(FlowService.PROPERTY_ICON),
                FlowService.prop(FlowService.PROPERTY_COLOR),
                FlowService.prop(FlowService.PROPERTY_NAME),
                FlowService.prop(FlowService.PROPERTY_GROUP),
                FlowService.prop(FlowService.PROPERTY_REFERENCE),
                FlowService.prop(FlowService.PROPERTY_VERSION),
                FlowService.prop(FlowService.PROPERTY_SAMPLEDATA),
                FlowService.prop(FlowService.PROPERTY_README)
            };
            
            for (String propName : userProps) {
                Object value = componentProps.get(propName);
                if (value != null) {
                    propsToSync.put(propName, value);
                }
            }
            
            // Update var resource properties
            for (Map.Entry<String, Object> entry : propsToSync.entrySet()) {
                varProps.put(entry.getKey(), entry.getValue());
            }
            
            resolver.commit();
            
            LOGGER.info("FlowSyncStorageService.syncComponentToVar: Synced {} properties from component to var. componentPath={}, varPath={}", 
                propsToSync.size(), componentPath, varResource.getPath());
            
            return true;
        } catch (PersistenceException e) {
            LOGGER.error("FlowSyncStorageService.syncComponentToVar: Failed to sync component to var. path={}", 
                componentPath, e);
            return false;
        }
    }
    
    /**
     * Syncs /var resource data to Flow API via FlowService.
     * The /var resource is only the persistence layer for computed Flow metadata, so this method
     * resolves the original component resource before invoking FlowService. That preserves the
     * authored /content path for route and group/category generation while still storing results in /var.
     * 
     * @param varResource The /var resource containing Flow data
     * @param changeType The type of change (ADDED, CHANGED, REMOVED)
     * @return true if sync succeeded, false otherwise
     */
    public boolean syncVarToFlow(@NotNull Resource varResource, @NotNull org.apache.sling.api.resource.observation.ResourceChange.ChangeType changeType) {
        if (varResource == null) {
            LOGGER.error("FlowSyncStorageService.syncVarToFlow: varResource is null");
            return false;
        }
        
        if (changeType == null) {
            LOGGER.error("FlowSyncStorageService.syncVarToFlow: changeType is null");
            return false;
        }
        
        String componentPath = getComponentPath(varResource.getPath());
        if (componentPath == null) {
            LOGGER.error("FlowSyncStorageService.syncVarToFlow: Could not map var path to component path. varPath={}",
                varResource.getPath());
            return false;
        }

        ResourceResolver resolver = varResource.getResourceResolver();
        if (resolver == null) {
            LOGGER.error("FlowSyncStorageService.syncVarToFlow: resourceResolver is null. varPath={}",
                varResource.getPath());
            return false;
        }

        Resource componentResource = resolver.getResource(componentPath);
        if (componentResource == null) {
            LOGGER.error("FlowSyncStorageService.syncVarToFlow: Component resource not found for var resource. varPath={}, componentPath={}",
                varResource.getPath(), componentPath);
            return false;
        }

        LOGGER.info("FlowSyncStorageService.syncVarToFlow: Syncing var resource to Flow API. varPath={}, componentPath={}, changeType={}",
            varResource.getPath(), componentPath, changeType);
        
        // Call FlowService.doProcessFlowResource with the original component resource so route generation
        // and default Flow group/category resolution always use the authored /content path rather than
        // the /var mirror path.
        boolean result = flowService.doProcessFlowResource(componentResource, changeType);
        
        if (result) {
            LOGGER.info("FlowSyncStorageService.syncVarToFlow: Successfully synced var resource to Flow API. varPath={}, componentPath={}",
                varResource.getPath(), componentPath);
        } else {
            LOGGER.error("FlowSyncStorageService.syncVarToFlow: Failed to sync var resource to Flow API. varPath={}, componentPath={}",
                varResource.getPath(), componentPath);
        }
        
        return result;
    }
    
    /**
     * Deletes the /var resource for a component path.
     * Used for cleanup when a component is deleted (REMOVED change type).
     * 
     * @param componentPath The /content component path
     * @param resourceResolver The resource resolver to use
     * @return true if deletion succeeded, false otherwise
     */
    public boolean deleteVarResource(@NotNull String componentPath, @NotNull ResourceResolver resourceResolver) {
        if (componentPath == null || componentPath.isEmpty()) {
            LOGGER.error("FlowSyncStorageService.deleteVarResource: componentPath is null or empty");
            return false;
        }
        
        if (resourceResolver == null) {
            LOGGER.error("FlowSyncStorageService.deleteVarResource: resourceResolver is null");
            return false;
        }
        
        String varPath = getVarPath(componentPath);
        if (varPath == null) {
            return false;
        }
        
        Resource varResource = resourceResolver.getResource(varPath);
        if (varResource == null) {
            LOGGER.debug("FlowSyncStorageService.deleteVarResource: Var resource does not exist, nothing to delete. varPath={}", 
                varPath);
            return true; // Not an error if it doesn't exist
        }
        
        try {
            resourceResolver.delete(varResource);
            resourceResolver.commit();
            
            LOGGER.info("FlowSyncStorageService.deleteVarResource: Deleted var resource. componentPath={}, varPath={}", 
                componentPath, varPath);
            return true;
        } catch (PersistenceException e) {
            LOGGER.error("FlowSyncStorageService.deleteVarResource: Failed to delete var resource. componentPath={}, varPath={}", 
                componentPath, varPath, e);
            return false;
        }
    }
    
    /**
     * Syncs Flow API response data back to /var resource.
     * This is called by FlowService after successful API calls to store response data.
     * 
     * @param varResource The /var resource to update
     * @param flowResponseData Map of Flow API response properties to store
     * @return true if sync succeeded, false otherwise
     */
    public boolean syncFlowToVar(@NotNull Resource varResource, @NotNull Map<String, Object> flowResponseData) {
        if (varResource == null) {
            LOGGER.error("FlowSyncStorageService.syncFlowToVar: varResource is null");
            return false;
        }
        
        if (flowResponseData == null || flowResponseData.isEmpty()) {
            LOGGER.warn("FlowSyncStorageService.syncFlowToVar: flowResponseData is null or empty. varPath={}", 
                varResource.getPath());
            return true; // Not an error, just no data to sync
        }
        
        ResourceResolver resolver = varResource.getResourceResolver();
        if (resolver == null) {
            LOGGER.error("FlowSyncStorageService.syncFlowToVar: resourceResolver is null. varPath={}", 
                varResource.getPath());
            return false;
        }
        
        try {
            ModifiableValueMap varProps = varResource.adaptTo(ModifiableValueMap.class);
            if (varProps == null) {
                LOGGER.error("FlowSyncStorageService.syncFlowToVar: Cannot adapt var resource to ModifiableValueMap. varPath={}", 
                    varResource.getPath());
                return false;
            }
            
            // Update var resource with Flow API response data
            for (Map.Entry<String, Object> entry : flowResponseData.entrySet()) {
                varProps.put(entry.getKey(), entry.getValue());
            }
            
            resolver.commit();
            
            LOGGER.info("FlowSyncStorageService.syncFlowToVar: Synced {} properties from Flow API to var. varPath={}", 
                flowResponseData.size(), varResource.getPath());
            
            return true;
        } catch (PersistenceException e) {
            LOGGER.error("FlowSyncStorageService.syncFlowToVar: Failed to sync Flow API response to var. varPath={}", 
                varResource.getPath(), e);
            return false;
        }
    }
}
