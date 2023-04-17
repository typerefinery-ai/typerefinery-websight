package ai.typerefinery.websight.models.components.widgets.tabs;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.inject.Inject;

import lombok.Getter;
import lombok.Setter;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;

// import ai.typerefinery.websight.utils.LinkUtil;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)

public class TabItem {
    

    @Getter
    @Setter
    @Inject
    private String title;
  
    @Getter
    @Setter
    @Inject
    private String id;
  
    @Getter
    @Inject
    @Setter
    private String content;

    
    @Getter
    @Inject
    @Setter
    private String icon;

    

    @Inject
    @Getter
    @Setter
    public Boolean isCloseable;

    @Getter
    @Inject
    @Setter
    private Boolean useQueryParamsFromParent;
}


 
 