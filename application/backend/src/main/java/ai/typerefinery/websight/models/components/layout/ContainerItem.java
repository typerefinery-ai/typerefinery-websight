package ai.typerefinery.websight.models.components.layout;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.inject.Inject;
import lombok.Getter;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)

public class ContainerItem {
  public ContainerItem(String siblingId,String title) {
    this.id=siblingId;
    this.title=title;
}
  @Getter
    @Inject
    private String id;

    @Getter
    @Inject
    private String title;
    
  
}
