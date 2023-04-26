package ai.typerefinery.websight.models.components.layout;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.inject.Inject;
import lombok.Getter;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import ai.typerefinery.websight.models.components.KeyValuePair;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)

public class ContainerItem extends KeyValuePair{
  public ContainerItem(String siblingId, String title) {
    this.key = siblingId;
    this.value = title;
  }

}
