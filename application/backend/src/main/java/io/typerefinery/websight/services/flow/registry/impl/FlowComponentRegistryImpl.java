package io.typerefinery.websight.services.flow.registry.impl;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;
import org.apache.sling.api.SlingHttpServletRequest;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.typerefinery.websight.services.flow.registry.ConditionalFlowComponent;
import io.typerefinery.websight.services.flow.registry.FlowComponent;
import io.typerefinery.websight.services.flow.registry.FlowComponentRegistry;

@Component(immediate = true)
public class FlowComponentRegistryImpl implements FlowComponentRegistry {
    private static final Logger LOGGER = LoggerFactory.getLogger(FlowComponentRegistryImpl.class);

    private final Map<String, List<FlowComponent>> flowComponentsByKey = new ConcurrentHashMap<>();

    public FlowComponentRegistryImpl() {
    }

    @SuppressWarnings("unchecked")
    @Reference(
        service = FlowComponent.class,
        cardinality = ReferenceCardinality.MULTIPLE,
        policy = ReferencePolicy.DYNAMIC
    )
    private synchronized void bindFlowComponent(FlowComponent flowComponent) {
        this.log("Binding Flow Component", flowComponent);
        List<FlowComponent> flowComponents = (List)this.flowComponentsByKey.computeIfAbsent(flowComponent.getKey(), (k) -> {
            return new CopyOnWriteArrayList();
        });
        flowComponents.add(flowComponent);
        flowComponents.sort(Comparator.comparingInt(FlowComponent::getRanking));
    }

    private synchronized void unbindFlowComponent(FlowComponent flowComponent) {
        this.log("Unbinding Flow Component", flowComponent);
        ((List)this.flowComponentsByKey.get(flowComponent.getKey())).remove(flowComponent);
    }

    /**
     * get filtered list of components for given key
     */
    @SuppressWarnings("unchecked")
    public List<String> getComponents(String key, SlingHttpServletRequest request) {
        return (List)((List)this.flowComponentsByKey.getOrDefault(key, Collections.emptyList())).stream()
        .filter((flowComponent) -> {
            return this.isApplicable(flowComponent, request);
        })
        .map(flowComponent -> ((FlowComponent) flowComponent).getComponent())
        .collect(Collectors.toList());
    }

    /*
    * get list of components for given key
    */
    @SuppressWarnings("unchecked")
    public List<String> getComponents(String key) {
        return (List)((List)this.flowComponentsByKey.getOrDefault(key, Collections.emptyList())).stream()
        .map(flowComponent -> ((FlowComponent) flowComponent).getComponent())
        .collect(Collectors.toList());
    }

    private boolean isApplicable(Object flowComponent, SlingHttpServletRequest request) {
        return flowComponent instanceof ConditionalFlowComponent ? ((ConditionalFlowComponent)flowComponent).isApplicable(request) : true;
    }

    private void log(String message, FlowComponent flowComponent) {
        String logFormat = message + " type = {}, key = {}, fragment = {}, ranking = {}";
        LOGGER.info(logFormat, new Object[]{flowComponent.getClass().getName(), flowComponent.getKey(), flowComponent.getComponent(), flowComponent.getRanking()});
    }

}
