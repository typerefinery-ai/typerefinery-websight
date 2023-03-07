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
import io.typerefinery.websight.services.flow.registry.FlowComponentRegister;
import io.typerefinery.websight.services.flow.registry.FlowComponentRegistry;

@Component(immediate = true)
public class FlowComponentRegistryImpl implements FlowComponentRegistry {
    private static final Logger LOGGER = LoggerFactory.getLogger(FlowComponentRegistryImpl.class);

    private final Map<String, List<FlowComponentRegister>> flowComponentsByKey = new ConcurrentHashMap<>();

    public FlowComponentRegistryImpl() {
    }

    @SuppressWarnings("unchecked")
    @Reference(
        service = FlowComponentRegister.class,
        cardinality = ReferenceCardinality.MULTIPLE,
        policy = ReferencePolicy.DYNAMIC
    )
    private synchronized void bindFlowComponent(FlowComponentRegister flowComponentRegister) {
        this.log("Binding Flow Component", flowComponentRegister);
        List<FlowComponentRegister> flowComponents = (List)this.flowComponentsByKey.computeIfAbsent(flowComponentRegister.getKey(), (k) -> {
            return new CopyOnWriteArrayList();
        });
        flowComponents.add(flowComponentRegister);
        flowComponents.sort(Comparator.comparingInt(FlowComponentRegister::getRanking));
    }

    private synchronized void unbindFlowComponent(FlowComponentRegister flowComponentRegister) {
        this.log("Unbinding Flow Component", flowComponentRegister);
        ((List)this.flowComponentsByKey.get(flowComponentRegister.getKey())).remove(flowComponentRegister);
    }

    /**
     * get filtered list of components for given key
     */
    @SuppressWarnings("unchecked")
    public List<String> getComponents(String key, SlingHttpServletRequest request) {
        return (List)((List)this.flowComponentsByKey.getOrDefault(key, Collections.emptyList())).stream()
        .filter((flowComponentRegister) -> {
            return this.isApplicable(flowComponentRegister, request);
        })
        .map(flowComponentRegister -> ((FlowComponentRegister) flowComponentRegister).getComponent())
        .collect(Collectors.toList());
    }

    /*
    * get list of components for given key
    */
    @SuppressWarnings("unchecked")
    public List<String> getComponents(String key) {
        return (List)((List)this.flowComponentsByKey.getOrDefault(key, Collections.emptyList())).stream()
        .map(flowComponentRegister -> ((FlowComponentRegister) flowComponentRegister).getComponent())
        .collect(Collectors.toList());
    }

    private boolean isApplicable(Object flowComponentRegister, SlingHttpServletRequest request) {
        return flowComponentRegister instanceof ConditionalFlowComponent ? ((ConditionalFlowComponent)flowComponentRegister).isApplicable(request) : true;
    }

    private void log(String message, FlowComponentRegister flowComponentRegister) {
        String logFormat = message + " type = {}, key = {}, fragment = {}, ranking = {}";
        LOGGER.info(logFormat, new Object[]{flowComponentRegister.getClass().getName(), flowComponentRegister.getKey(), flowComponentRegister.getComponent(), flowComponentRegister.getRanking()});
    }

}
