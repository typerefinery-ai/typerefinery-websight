package io.typerefinery.websight.models.components.content;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.text.MessageFormat;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.engine.SlingRequestProcessor;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import org.jetbrains.annotations.Nullable;
import org.jsoup.nodes.Element;
import org.jsoup.parser.Tag;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.utils.FakeRequest;
import io.typerefinery.websight.utils.FakeResponse;
import io.typerefinery.websight.utils.LinkUtil;
import io.typerefinery.websight.utils.PageUtil;
import io.typerefinery.websight.utils.SyntheticSlingHttpServletGetRequest;
import lombok.Getter;
import pl.ds.websight.pages.foundation.WcmMode;

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
        }
        try {
            String markup = "";
            String url = referenceResource.getPath() + ".html";
            HttpServletRequest req = new FakeRequest("GET", url);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            HttpServletResponse resp;
            try {
                resp = new FakeResponse(out);

                // this needs to be done to get the inherited resource
                requestProcessor.processRequest(req, resp, resourceResolver);

                // get the inherited resource as html
                markup = SyntheticSlingHttpServletGetRequest.getIncludeAsString(referenceResource.getPath(), request, response);

            } catch (ServletException | IOException | NoSuchAlgorithmException e) {
                LOGGER.warn("Exception retrieving contents for {}", url, e);
            }
            
            
            return markup;
        } catch (Exception e) {
            LOGGER.error("Error getting inherited html", e);
        }
        return "";
    }
}
