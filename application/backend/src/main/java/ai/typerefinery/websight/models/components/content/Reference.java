package ai.typerefinery.websight.models.components.content;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;


import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.engine.SlingRequestProcessor;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.jetbrains.annotations.Nullable;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ai.typerefinery.websight.models.components.BaseComponent;
import ai.typerefinery.websight.utils.SlingUtil;
import lombok.Getter;

@Component
@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    resourceType = { 
        Reference.RESOURCE_TYPE 
    }, 
    defaultInjectionStrategy = OPTIONAL
)
@Exporter(name = "jackson", extensions = "json", options = {
        @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
})
public class Reference extends BaseComponent {

    
    private static final Logger LOGGER = LoggerFactory.getLogger(Reference.class);

    public static final String RESOURCE_TYPE = "typerefinery/components/layout/container";
    
    public static final String PROPERTY_PATH = "path";

    @OSGiService
    private SlingRequestProcessor requestProcessor;

    @Inject
    @Getter
    @Named(PROPERTY_PATH)
    @Nullable
    protected String path;

    @Getter
    protected Resource referenceResource;
    
    @Override
    @PostConstruct
    protected void init() {
        super.init();

        if (StringUtils.isNotBlank(path)) {
            referenceResource = resourceResolver.getResource(path);
            if (ResourceUtil.isNonExistingResource(referenceResource)) {
                LOGGER.warn("Resource {} does not exist", path);
                referenceResource = null;
            }
        }
    }

    public String getInheritedHtml() {
        if (referenceResource == null) {
            LOGGER.debug("No reference resource to output.");
            return "";
        } else {
            return SlingUtil.resourceRenderAsHtml(referenceResource.getPath(), resourceResolver, requestProcessor).trim();
        }
    }
}
