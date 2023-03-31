package ai.typerefinery.websight.models.components.tab;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.inject.Inject;
import lombok.Getter;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)

public class TabList {

    @Getter
    @Inject
    private String title;
  
    @Getter
    @Inject
    private String tabId;
  
    @Getter
    @Inject
    private String height;

    @Getter
    @Inject
    private String url;
}


 
 