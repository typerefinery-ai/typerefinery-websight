package ai.typerefinery.websight.rest;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import org.jetbrains.annotations.NotNull;

@Model(adaptables = {SlingHttpServletRequest.class})
public class ResourceRestModel {
  @SlingObject
  private Resource resource;
  
  @NotNull
  public Resource getRequestedResource() {
    return this.resource;
  }
  
  @NotNull
  public String getRequestedPath() {
    return this.resource.getPath();
  }
}
