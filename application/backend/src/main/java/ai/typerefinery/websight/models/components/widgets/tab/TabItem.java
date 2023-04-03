package ai.typerefinery.websight.models.components.widgets.tab;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.inject.Inject;
import lombok.Getter;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Model;

// import ai.typerefinery.websight.utils.LinkUtil;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)

public class TabItem {
    
    ResourceResolver resourceResolver;

    @Getter
    @Inject
    private String title;
  
    @Getter
    @Inject
    private String id;
  
    @Getter
    @Inject
    private String content;

    @Getter
    @Inject
    private Boolean useQueryParamsFromParent;

    // public String getContent() {
    //     return LinkUtil.handleLink(this.content, this.resourceResolver);
    // }
}


 
 