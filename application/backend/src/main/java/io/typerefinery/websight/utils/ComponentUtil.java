package io.typerefinery.websight.utils;

import java.util.HashMap;
import java.util.UUID;
import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import static java.text.MessageFormat.format;

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

}
