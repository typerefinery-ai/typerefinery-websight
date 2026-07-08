package ai.typerefinery.websight.models.dialog;

import javax.annotation.PostConstruct;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;
import org.jetbrains.annotations.Nullable;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ai.typerefinery.websight.services.flow.FlowSyncStorageService;
import ai.typerefinery.websight.utils.ComponentUtil;
import lombok.Getter;

/**
 * Sling Model for Flow OpenUrl dialog component.
 * Reads Flow service properties from /var resource and provides them to the dialog component.
 */
@Component
@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class FlowOpenUrlModel {
    
    private static final Logger LOG = LoggerFactory.getLogger(FlowOpenUrlModel.class);
    
    private static final String WS_RESOURCE_TYPE_COMPONENT = "ws:Component";
    
    @SlingObject
    private Resource resource;

    @SlingObject
    private SlingHttpServletRequest request;
    
    @SlingObject
    private ResourceResolver resourceResolver;
    
    @OSGiService
    private FlowSyncStorageService flowSyncStorage;
    
    @ValueMapValue
    @Getter
    @Nullable
    private String propertyName;
    
    @Getter
    @Nullable
    private String value;
    
    @PostConstruct
    private void init() {
        if (propertyName == null || propertyName.isEmpty()) {
            LOG.warn("FlowOpenUrlModel.init: propertyName is null or empty. resource={}", 
                resource != null ? resource.getPath() : "null");
            return;
        }
        
        if (flowSyncStorage == null) {
            LOG.warn("FlowOpenUrlModel.init: FlowSyncStorageService is not available. resource={}", 
                resource != null ? resource.getPath() : "null");
            return;
        }
        
        Resource component = resolveEditedComponent();
        
        if (component == null) {
            LOG.warn("FlowOpenUrlModel.init: Could not find component resource. resource={}", 
                resource != null ? resource.getPath() : "null");
            return;
        }
        
        // Get var resource using FlowSyncStorageService
        String componentPath = component.getPath();
        Resource varResource = flowSyncStorage.getOrCreateVarResource(componentPath, resourceResolver);
        
        if (varResource != null) {
            ValueMap varProps = varResource.getValueMap();
            this.value = varProps.get(propertyName, String.class);
            LOG.debug("FlowOpenUrlModel.init: Read property from var resource. componentPath={}, varPath={}, propertyName={}, value={}", 
                componentPath, varResource.getPath(), propertyName, value);
        } else {
            LOG.debug("FlowOpenUrlModel.init: Var resource not found or could not be created. componentPath={}, propertyName={}", 
                componentPath, propertyName);
        }
    }

    private Resource resolveEditedComponent() {
        Resource component = resolveFromRequest();
        if (component != null) {
            return component;
        }

        return ComponentUtil.getResourceAncestorByResourceType(
            resource,
            WS_RESOURCE_TYPE_COMPONENT
        );
    }

    private Resource resolveFromRequest() {
        if (request == null || resourceResolver == null) {
            return null;
        }

        String[] parameterNames = {
            "resource",
            "resourcePath",
            "path",
            "componentPath",
            "contentPath",
            "item"
        };

        for (String parameterName : parameterNames) {
            Resource candidate = getContentResource(request.getParameter(parameterName));
            if (candidate != null) {
                return candidate;
            }
        }

        if (request.getRequestPathInfo() != null) {
            Resource candidate = getContentResource(request.getRequestPathInfo().getSuffix());
            if (candidate != null) {
                return candidate;
            }
        }

        return null;
    }

    private Resource getContentResource(String path) {
        if (StringUtils.isBlank(path) || !path.startsWith("/content/")) {
            return null;
        }

        Resource candidate = resourceResolver.getResource(path);
        if (candidate != null) {
            return candidate;
        }

        int extensionIndex = path.indexOf('.');
        if (extensionIndex > 0) {
            return resourceResolver.getResource(path.substring(0, extensionIndex));
        }

        return null;
    }
}
