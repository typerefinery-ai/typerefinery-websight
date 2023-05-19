package ai.typerefinery.websight.publishing.staticprocessor;

import java.io.InputStream;
import java.util.Optional;

import org.apache.jackrabbit.JcrConstants;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import pl.ds.websight.assets.core.api.Asset;
import pl.ds.websight.assets.core.api.Rendition;
import pl.ds.websight.publishing.connectors.spi.StorageConnector;
import pl.ds.websight.publishing.framework.PublishException;
import pl.ds.websight.publishing.framework.PublishOptions;
import pl.ds.websight.publishing.framework.spi.PublishProcessor;

@Component(service = {PublishProcessor.class}, reference = {@Reference(name = "storageConnectors", field = "storageConnectors", service = StorageConnector.class, cardinality = ReferenceCardinality.MULTIPLE, policy = ReferencePolicy.DYNAMIC)})
public class AssetPublishProcessor extends AbstractPublishProcessor {
  private static final String RENDITION_PUBLISH_PROPERTY = "rendition";
  
  public boolean canProcess(ResourceResolver resourceResolver, String resourcePath) {
    return Optional.<Resource>ofNullable(resourceResolver.getResource(resourcePath))
      .map(resource -> (Asset)resource.adaptTo(Asset.class))
      .map(Asset::getOriginalRendition)
      .isPresent();
  }
  
  public void prepare(ResourceResolver resourceResolver, String resourcePath, PublishOptions options) {
    String originalRenditionPath = (String)Optional.<Resource>ofNullable(resourceResolver.getResource(resourcePath)).map(resource -> (Asset)resource.adaptTo(Asset.class)).map(Asset::getOriginalRendition).map(Rendition::getPath).orElseThrow(() -> new IllegalStateException("Cannot get original rendition for " + resourcePath));
    options.getProperties().put("rendition", originalRenditionPath);
  }
  
  String getStoragePath(String resourcePath, PublishOptions options) {
    return fixStoragePath(options.getProperties().get("rendition").toString());
  }
  
  String fixStoragePath(String storagePath) {
    String fixedStoragePath = storagePath;
    fixedStoragePath = fixedStoragePath.replaceFirst(JcrConstants.JCR_CONTENT, "_" + JcrConstants.JCR_CONTENT.replace(":", "_"));
    return fixedStoragePath;
  }

  InputStream getStorageData(Resource resource) {
    return Optional.<Asset>ofNullable((Asset)resource.adaptTo(Asset.class))
      .map(Asset::getOriginalRendition)
      .map(Rendition::openStream)
      .orElse(null);
  }
  
  public String getId() {
    return "ai/typerefinery/websight/publishing/static/assets";
  }
}