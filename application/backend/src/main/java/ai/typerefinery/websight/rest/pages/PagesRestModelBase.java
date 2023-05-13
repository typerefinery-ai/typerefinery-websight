package ai.typerefinery.websight.rest.pages;

import javax.inject.Inject;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import org.jetbrains.annotations.NotNull;

import ai.typerefinery.websight.rest.ResourceRestModel;
import pl.ds.websight.pages.core.api.PageManager;

@Model(adaptables = {SlingHttpServletRequest.class})
public class PagesRestModelBase extends ResourceRestModel {
  @Self
  private SlingHttpServletRequest request;
  
  @SlingObject
  private ResourceResolver resourceResolver;
  
  @Inject
  private PageManager pageManager;
  
  @NotNull
  public SlingHttpServletRequest getRequest() {
    return this.request;
  }
  
  @NotNull
  public ResourceResolver getResourceResolver() {
    return this.resourceResolver;
  }
  
  @NotNull
  public PageManager getPageManager() {
    return this.pageManager;
  }
}
