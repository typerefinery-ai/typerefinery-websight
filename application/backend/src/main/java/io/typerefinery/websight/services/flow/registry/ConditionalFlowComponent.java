package io.typerefinery.websight.services.flow.registry;

import org.apache.sling.api.SlingHttpServletRequest;

public interface ConditionalFlowComponent extends FlowComponent {
    boolean isApplicable(SlingHttpServletRequest paramSlingHttpServletRequest);
}
