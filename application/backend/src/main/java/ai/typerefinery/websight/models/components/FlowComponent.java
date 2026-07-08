package ai.typerefinery.websight.models.components;


import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.jetbrains.annotations.Nullable;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import ai.typerefinery.websight.services.flow.FlowService;
import ai.typerefinery.websight.services.flow.FlowSyncStorageService;
import lombok.Getter;

/*
 * Flow component
 * 
 * register component as FlowComponent to be able to use it in FlowService to determine if component needs Flow Sync
 * 
 */
@Component
@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    resourceType = { FlowComponent.RESOURCE_TYPE },
    defaultInjectionStrategy = OPTIONAL
)
public class FlowComponent extends BaseComponent {
    
    public static final String RESOURCE_TYPE = "typerefinery/components/flow/flowcontainer";

    private static final Logger LOG = LoggerFactory.getLogger(FlowComponent.class);
    // if true will create/update flow
    @Getter
    @Inject
    @Default(booleanValues = false)
    @Named(FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_ENABLE)
    public Boolean flowapi_enable;

    // if blank will create new flow, if not blank will be used to update existing flow
    // Read from /var resource (Flow service managed)
    @Getter
    public String flowapi_flowstreamid;

    // will be used to test if update of flow should happen
    @Getter
    @Inject
    @Nullable
    @Named(FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_TITLE)
    public String flowapi_title;

    @Getter
    @Inject
    @Nullable
    @Named(FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_TOPIC)
    public String flowapi_topic;
    
    @Getter
    @Inject
    @Nullable
    @Named(FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_GROUP)
    public String flowapi_group;    

    @Getter
    @Inject
    @Nullable
    @Named(FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_REFERENCE)
    public String flowapi_reference;

    @Getter
    @Inject
    @Nullable
    @Named(FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_NAME)
    public String flowapi_name;

    @Getter
    @Inject
    @Nullable
    @Named(FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_ICON)
    public String flowapi_icon;

    @Getter
    @Inject
    @Nullable
    @Named(FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_COLOR)
    public String flowapi_color;

    @Getter
    @Inject
    @Nullable
    @Named(FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_VERSION)
    public String flowapi_version;

    @Getter
    @Inject
    @Nullable
    @Named(FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_AUTHOR)
    public String flowapi_author;

    @Getter
    @Inject
    @Nullable
    @Named(FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_README)
    public String flowapi_readme;

    // Read from /var resource (Flow service managed)
    @Getter
    public String flowapi_createdon;
    
    // Read from /var resource (Flow service managed)
    @Getter
    public String flowapi_updatedon;
    
    // Read from /var resource (Flow service managed)
    @Getter
    public Boolean flowapi_paused;
    
    @Getter
    @Inject
    @Nullable
    @Named(FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_TEMPLATE)
    public String flowapi_template;
    
    @Getter
    @Inject
    @Nullable
    @Named(FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_TEMPLATE_DESIGN)
    public String flowapi_designtemplate;    

    @Getter
    @Inject
    @Nullable
    @Named(FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_ISCONTAINER)
    public Boolean flowapi_iscontainer;

    @Getter
    @Inject
    @Nullable
    @Named(FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_SAMPLEDATA)
    public String flowapi_sampledata;
    
    // authored title and will be used compared to flowapi_title to determine if update of flow should happen
    @Getter
    @Inject
    public String title;

    // Read from /var resource (Flow service managed)
    @Getter
    public String flowapi_editurl;

    // Read from /var resource (Flow service managed)
    @Getter
    public String flowapi_httproute;

    // Read from /var resource (Flow service managed)
    @Getter
    public String flowapi_httproutenosfx;

    // Read from /var resource (Flow service managed)
    @Getter
    public String flowapi_websocketurl;

    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @OSGiService
    FlowService flowService;
    
    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @OSGiService
    FlowSyncStorageService flowSyncStorage;

    @Override
    @PostConstruct
    protected void init() {
        super.init();
        
        // Read Flow service properties from /var resource
        // User-controlled properties are already injected from component resource
        if (this.resource != null && this.resourceResolver != null && flowSyncStorage != null) {
            try {
                Resource varResource = flowSyncStorage.getOrCreateVarResource(
                    this.resource.getPath(),
                    this.resourceResolver
                );
                
                if (varResource != null) {
                    org.apache.sling.api.resource.ValueMap varProps = varResource.getValueMap();
                    
                    // Read Flow service managed properties from var resource
                    this.flowapi_flowstreamid = varProps.get(
                        FlowService.prop(FlowService.PROPERTY_FLOWSTREAMID),
                        String.class
                    );
                    this.flowapi_createdon = varProps.get(
                        FlowService.prop(FlowService.PROPERTY_CREATEDON),
                        String.class
                    );
                    this.flowapi_updatedon = varProps.get(
                        FlowService.prop(FlowService.PROPERTY_UPDATEDON),
                        String.class
                    );
                    this.flowapi_paused = varProps.get(
                        FlowService.prop(FlowService.PROPERTY_PAUSED),
                        Boolean.class
                    );
                    this.flowapi_editurl = varProps.get(
                        FlowService.prop(FlowService.PROPERTY_EDITURL),
                        String.class
                    );
                    this.flowapi_httproute = varProps.get(
                        FlowService.prop(FlowService.PROPERTY_HTTPROUTE),
                        String.class
                    );
                    this.flowapi_httproutenosfx = varProps.get(
                        FlowService.prop(FlowService.PROPERTY_HTTPROUTE_NOSFX),
                        String.class
                    );
                    this.flowapi_websocketurl = varProps.get(
                        FlowService.prop(FlowService.PROPERTY_WEBSOCKETURL),
                        String.class
                    );
                }
            } catch (Exception e) {
                LOG.warn("FlowComponent.init: Error reading Flow service properties from var resource. path={}", 
                    this.resource != null ? this.resource.getPath() : "null", e);
            }
        }
    }

    public Boolean isContainer() {
        boolean isContainer = flowapi_iscontainer != null ? flowapi_iscontainer : false;
        if (this.resource != null) {
            isContainer = this.resource.isResourceType(FlowComponent.RESOURCE_TYPE);
        }
        return isContainer;
    }

    /**
     * Flow creation is handled asynchronously by FlowSyncJobConsumer.
     *
     * Sling Models can be adapted multiple times during rendering/editor/export requests, so this
     * method must not call the Flow API or persist Flow-managed state.
     */
    public void ensureFlowExists() {
        if (Boolean.TRUE.equals(this.flowapi_enable) && this.flowapi_flowstreamid == null) {
            LOG.debug("Flow is enabled and no flow id is stored yet. Creation is handled by the Flow sync job. path={}",
                this.resource != null ? this.resource.getPath() : "null");
        }
    }

    public String getFlowStreamEditUrl() {
        return this.flowService.compileEditUrl(flowapi_flowstreamid);
    }
}
