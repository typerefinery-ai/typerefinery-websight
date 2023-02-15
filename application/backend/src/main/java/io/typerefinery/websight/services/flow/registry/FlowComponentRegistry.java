package io.typerefinery.websight.services.flow.registry;

import java.util.List;
import org.apache.sling.api.SlingHttpServletRequest;

public interface FlowComponentRegistry {
    List<String> getComponents(String paramString, SlingHttpServletRequest paramSlingHttpServletRequest);
    List<String> getComponents(String paramString);
}
