package io.typerefinery.websight.utils;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.PersistenceException;
import org.apache.sling.api.resource.Resource;
import static java.text.MessageFormat.format;

import java.text.MessageFormat;
import java.util.Objects;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.jetbrains.annotations.NotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import pl.ds.websight.cm.core.api.WebsightException;
import pl.ds.websight.components.core.api.Component;
import pl.ds.websight.components.core.api.ComponentManager;

public class ComponentUtil {
    
    /***
     * get or generate component id.
     * @param componentNode component node
     * @return component id
     */
    public static String getComponentId(Resource componentResource) {

        String componentId = UUID.randomUUID().toString();
        if (componentResource == null) {
            return componentId;
        }
        String path = StringUtils.EMPTY;

        path = componentResource.getPath();

        String prefix = componentResource.getName();

        //cleanup prefix
        prefix = prefix.replaceAll("[^a-zA-Z0-9-_]", "_");

        componentId = format(
            "{0}_{1}",
            prefix,
            RandomStringUtils.randomAlphanumeric(9).toUpperCase());
            
        final String updateId = componentId;
        HashMap<String, Object> props = new HashMap<String, Object>(){{
            put("id", updateId);
        }};
        
        PageUtil.updatResourceProperties(componentResource, props);

        return componentId;
    }

    public static String getComponentTitle(@NotNull Resource resource) {
        ComponentManager componentManager = getComponentManager(resource.getResourceResolver());
        Component component = componentManager.getComponentOfResource(resource.getPath());
        if (component != null)
          return component.getTitle(); 
        return null;
      }
    
    @NotNull
    private static ComponentManager getComponentManager(@NotNull ResourceResolver resourceResolver) {
        return Objects.<ComponentManager>requireNonNull((ComponentManager)resourceResolver.adaptTo(ComponentManager.class), "Cannot cannot adapt to ComponentManager");
    }
    
    public static boolean isDirectlyInContainer(@NotNull Resource resource) {
        Resource parent = resource.getParent();
        if (parent == null)
            return false; 
        return isContainer(parent);
    }
    
    public static boolean isContainer(@NotNull Resource componentResource) {
        // ComponentManager componentManager = getComponentManager(resource.getResourceResolver());
        Component component = componentResource.adaptTo(Component.class);
        if (component == null)
            return false; 
        return component.isContainer();
    }
    
    public static Component getComponentOfResource(@NotNull Resource componentResource) {
        return componentResource.adaptTo(Component.class);
        // ComponentManager componentManager = Objects.<ComponentManager>requireNonNull((ComponentManager)resource
        //     .getResourceResolver().adaptTo(ComponentManager.class), "Cannot convert to ComponentManager");
        // return componentManager.getComponentOfResource(resource.getPath());
    }

    public static String getComponentPlacehodler(@NotNull String path, @NotNull String placeHolderCss, @NotNull Resource componentResource) {

        try {
            ValueMap componentProperties = componentResource.getValueMap();
            String[] allowedComponents = componentProperties.get("allowedComponents", String[].class);

            ObjectMapper mapper = new ObjectMapper().configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);

            ObjectNode componentNode = new ObjectMapper().createObjectNode();
            componentNode.put("path", path);

            ObjectNode dropTarget = componentNode.putArray("dropTarget").addObject();
            dropTarget.put("type", "component");

            ArrayNode allowedComponentsNode = dropTarget.putArray("allowedComponents");
            for (String allowedComponent : allowedComponents) {
                allowedComponentsNode.add(allowedComponent);
            }
            
            ObjectNode componentDefinition = componentNode.putObject("componentDefinition");
            componentDefinition.put("name", componentProperties.get("title", String.class));
            componentDefinition.put("group", componentProperties.get("group", String.class));
            componentDefinition.put("path", componentResource.getPath());
            componentDefinition.put("isContainer", componentProperties.get("isContainer", Boolean.class));


            String componentJson = mapper.writeValueAsString(componentNode);

            ObjectNode className = new ObjectMapper().createObjectNode();
            className.put("class", placeHolderCss);

            String classNameJson = mapper.writeValueAsString(className);
            

            StringBuilder sb = new StringBuilder();
            sb.append(MessageFormat.format("<!--ws-component-start{0}-->\n", componentJson));
            sb.append(MessageFormat.format("<!--ws-placeholder-data {0} -->\n", classNameJson));
            sb.append("<!--ws-component-end-->\n");
            return sb.toString();
        } catch (Exception e) {
            return StringUtils.EMPTY;
        }

    }


    
    public static Resource addComponent(ResourceResolver resourceResolver, Resource targetParent,
            pl.ds.websight.components.core.api.Component component) throws PersistenceException, WebsightException {
        return addComponent(resourceResolver, targetParent, component, component.getName());
    }

    public static Resource addComponent(ResourceResolver resourceResolver, Resource targetParent,
            pl.ds.websight.components.core.api.Component component, String componentName)
            throws PersistenceException, WebsightException {
        String uniqueComponentName = ResourceUtils.uniqueName(targetParent, componentName);
        String componentResourceType = component.getInstanceResourceType();
        Resource template = component.getTemplateResource();
        if (template != null)
            return copyTemplate(template, targetParent, componentResourceType, uniqueComponentName, resourceResolver);
        return resourceResolver.create(targetParent, uniqueComponentName,
                Collections.singletonMap("sling:resourceType", componentResourceType));
    }

    private static Resource copyTemplate(Resource template, Resource targetParent, String componentResourceType,
            String uniqueComponentName, ResourceResolver resourceResolver) throws PersistenceException {
        Map<String, Object> properties = (Map<String, Object>) template.getValueMap().entrySet().stream()
                .filter(entry -> TemplateUtil.isCopyableProperty((String) entry.getKey()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        properties.put("sling:resourceType", componentResourceType);
        Resource resource = resourceResolver.create(targetParent, uniqueComponentName, properties);
        for (Resource child : template.getChildren())
            resourceResolver.copy(child.getPath(), resource.getPath());
        return resource;
    }

}
