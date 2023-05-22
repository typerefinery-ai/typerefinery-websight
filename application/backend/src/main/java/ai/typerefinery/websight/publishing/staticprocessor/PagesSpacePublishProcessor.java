package ai.typerefinery.websight.publishing.staticprocessor;


import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

import org.apache.jackrabbit.JcrConstants;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.engine.SlingRequestProcessor;
import org.apache.sling.servlethelpers.internalrequests.SlingInternalRequest;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.osgi.service.metatype.annotations.Designate;
import pl.ds.websight.pages.core.api.Page;
import pl.ds.websight.publishing.connectors.spi.StorageConnector;
import pl.ds.websight.publishing.framework.PublishException;
import pl.ds.websight.publishing.framework.PublishOptions;
import pl.ds.websight.publishing.framework.spi.PublishProcessor;

@Component(service = {PublishProcessor.class}, reference = {@Reference(name = "storageConnectors", field = "storageConnectors", service = StorageConnector.class, cardinality = ReferenceCardinality.MULTIPLE, policy = ReferencePolicy.DYNAMIC)})
@Designate(ocd = PagesSpacePublishProcessorConfig.class)
public class PagesSpacePublishProcessor extends AbstractPublishProcessor {
  @Reference
  private SlingRequestProcessor requestProcessor;
  
  private Boolean shortenPaths;

  @Activate
  private void activate(PagesSpacePublishProcessorConfig config) {
    this.shortenPaths = Boolean.valueOf(config.shorten_paths());
  }
  
  
  public boolean canProcess(ResourceResolver resourceResolver, String resourcePath) {
    Resource resource = resourceResolver.getResource(resourcePath);
    if (resource != null) {
        ValueMap valueMap = resource.adaptTo(ValueMap.class);
        if (valueMap != null && valueMap.containsKey(JcrConstants.JCR_PRIMARYTYPE)) {
            String primaryType = valueMap.get(JcrConstants.JCR_PRIMARYTYPE, String.class);
            return primaryType.equals("ws:Pages");
        }
    }
    return false;
  }
  
  public void prepare(ResourceResolver resourceResolver, String resourcePath, PublishOptions options) {}
  
  String getStoragePath(String resourcePath, PublishOptions options) {
    return resourcePath + ".html";
  }
  
  InputStream getStorageData(Resource resource) throws PublishException {
    try {
      String response = (new SlingInternalRequest(resource.getResourceResolver(), this.requestProcessor, resource.getPath())).withExtension("html").execute().getResponseAsString();
    //   return new ByteArrayInputStream(response.getBytes());
      return wrapStreamIfNeeded(this.shortenPaths.booleanValue(), resource.getPath(), new ByteArrayInputStream(response
            .getBytes()));
    } catch (IOException e) {
      throw new PublishException(
          String.format("Failed to perform internal sling request to render page of path %s", new Object[] { resource.getPath() }), e);
    } 
  }
  
  static InputStream wrapStreamIfNeeded(boolean shortenPaths, String path, InputStream input) {
    if (shortenPaths && path.startsWith("/content")) {
      String[] elements = path.split("/");
      String spaceName = (elements.length >= 2) ? elements[2] : null;
      if (spaceName != null) {
        byte[] pagesPath = ("/content/" + spaceName + "/pages").getBytes();
        byte[] contentPath = ("/content/" + spaceName).getBytes();
        InputStream replacePages = new ReplacingInputStream(input, pagesPath, null);
        return new ReplacingInputStream(replacePages, contentPath, null);
      } 
    } 
    return input;
  }

  public String getId() {
    return "ai/typerefinery/websight/publishing/static/pagesspace";
  }
  

}
