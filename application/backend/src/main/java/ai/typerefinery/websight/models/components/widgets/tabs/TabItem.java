package ai.typerefinery.websight.models.components.widgets.tabs;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.annotation.PostConstruct;
import javax.inject.Inject;

import lombok.Getter;
import lombok.Setter;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.engine.SlingRequestProcessor;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import ai.typerefinery.websight.utils.ResourceUtils;

// import ai.typerefinery.websight.utils.LinkUtil;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)

public class TabItem {
    
    @Getter
    @Setter
    @Inject
    private String title;
  
    @Getter
    @Inject
    @Setter
    private String icon;

    @Inject
    @Getter
    @Setter
    public Boolean isCloseable;

  
    @Getter
    @Setter
    @Inject
    private String id;

    //used to get html for tab
    @Getter
    @Setter
    @Inject
    private String resourcepath;

    //used to render in iframe
    @Getter
    @Setter
    @Inject
    private String url;
    
    @Getter
    @Inject
    @Setter
    private Boolean passParentQueryString;


    @Getter
    @Inject
    @Setter
    private String render;

    @Inject
    @Getter
    private String html;

    @OSGiService
    private SlingRequestProcessor requestProcessor;

    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @SlingObject
    public ResourceResolver resourceResolver;

    @PostConstruct
    protected void init() {
        //get html for tab
        if (StringUtils.isNotBlank(resourcepath)) {
            html = ResourceUtils.getResourceHtml(resourceResolver, requestProcessor, resourcepath);
        }

    }

}

 
 