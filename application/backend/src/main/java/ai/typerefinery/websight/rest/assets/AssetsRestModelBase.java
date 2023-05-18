package ai.typerefinery.websight.rest.assets;

import javax.annotation.PostConstruct;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import org.jetbrains.annotations.NotNull;
import pl.ds.websight.assets.core.api.AssetManager;

import ai.typerefinery.websight.rest.ResourceRestModel;

@Model(adaptables = {SlingHttpServletRequest.class})
public abstract class AssetsRestModelBase extends ResourceRestModel {
  @Self
  private SlingHttpServletRequest request;
  
  @SlingObject
  protected Resource resource;
  
  private AssetManager assetManager;
  
  protected String requestedPath;
  
  @PostConstruct
  public void init() {
    this.assetManager = (AssetManager)getResourceResolver().adaptTo(AssetManager.class);
    if (this.assetManager == null)
      throw new IllegalStateException("Asset manager must not be null"); 
    this.requestedPath = this.resource.getPath();
  }
  
  public SlingHttpServletRequest getRequest() {
    return this.request;
  }
  
  @NotNull
  public ResourceResolver getResourceResolver() {
    return getRequest().getResourceResolver();
  }
  
  public AssetManager getAssetManager() {
    return this.assetManager;
  }
  
}
