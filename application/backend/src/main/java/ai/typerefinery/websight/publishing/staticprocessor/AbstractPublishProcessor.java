package ai.typerefinery.websight.publishing.staticprocessor;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import pl.ds.websight.publishing.connectors.StorageConnectorException;
import pl.ds.websight.publishing.connectors.spi.StorageConnector;
import pl.ds.websight.publishing.framework.PublishAction;
import pl.ds.websight.publishing.framework.PublishException;
import pl.ds.websight.publishing.framework.PublishOptions;
import pl.ds.websight.publishing.framework.spi.PublishProcessor;

abstract class AbstractPublishProcessor implements PublishProcessor {
  final Logger log = LoggerFactory.getLogger(getClass());
  
  volatile List<StorageConnector> storageConnectors = new CopyOnWriteArrayList<>();
  
  public void process(ResourceResolver resourceResolver, String resourcePath, PublishOptions options) throws PublishException {
    if (PublishAction.PUBLISH == options.getPublishAction()) {
      processPublish(resourceResolver, resourcePath, options);
    } else if (PublishAction.UNPUBLISH == options.getPublishAction()) {
      processUnpublish(resourceResolver, resourcePath, options);
    } 
  }
  
  private void processPublish(ResourceResolver resourceResolver, String resourcePath, PublishOptions options) throws PublishException {
    Resource resource = resourceResolver.getResource(resourcePath);
    if (resource == null) {
      this.log.warn("Resource {} does not exists.", resourcePath);
      return;
    } 
    String storagePath = getStoragePath(resourcePath, options);
    for (StorageConnector storageConnector : this.storageConnectors) {
      try {
        InputStream storageData = getStorageData(resource);
        try {
          if (storageData != null)
            storeResource(storageConnector, resource, storagePath, storageData); 
          if (storageData != null)
            storageData.close(); 
        } catch (Throwable throwable) {
          if (storageData != null)
            try {
              storageData.close();
            } catch (Throwable throwable1) {
              throwable.addSuppressed(throwable1);
            }  
          throw throwable;
        } 
      } catch (IOException e) {
        this.log.warn("IOException occurred when getting storage data for resource {}", resource
            .getPath());
      } 
    } 
  }
  
  private void processUnpublish(ResourceResolver resourceResolver, String resourcePath, PublishOptions options) throws PublishException {
    String storagePath = getStoragePath(resourcePath, options);
    for (StorageConnector storageConnector : this.storageConnectors)
      delete(storageConnector, storagePath); 
  }
  
  abstract String getStoragePath(String paramString, PublishOptions paramPublishOptions);
  
  abstract InputStream getStorageData(Resource paramResource) throws PublishException;
  
  private void storeResource(StorageConnector storageConnector, Resource resource, String storagePath, InputStream storageData) throws PublishException {
    try {
      InputStream inputStream = storageData;
      try {
        storageConnector.store(storagePath, inputStream, Collections.emptyMap());
        this.log.info("Successfully stored resource {} by {} at path {}", new Object[] { resource.getPath(), storageConnector
              .getClass().getName(), storagePath });
        if (inputStream != null)
          inputStream.close(); 
      } catch (Throwable throwable) {
        if (inputStream != null)
          try {
            inputStream.close();
          } catch (Throwable throwable1) {
            throwable.addSuppressed(throwable1);
          }  
        throw throwable;
      } 
    } catch (StorageConnectorException e) {
      String message = String.format("Failed to store resource of path %s by %s", new Object[] { resource
            .getPath(), storageConnector.getClass().getName() });
      throw new PublishException(message, e);
    } catch (IOException e) {
      String message = String.format("IOException occurred when handling InputStream of resource %s", new Object[] { resource
            .getPath() });
      throw new PublishException(message, e);
    } 
  }
  
  private void delete(StorageConnector storageConnector, String storagePath) throws PublishException {
    try {
      storageConnector.delete(storagePath);
      this.log.info("Successfully deleted resource from path {} by {}", storagePath, storageConnector
          .getClass().getName());
    } catch (StorageConnectorException e) {
      String message = String.format("Failed to delete resource from path %s by %s", new Object[] { storagePath, storageConnector
            .getClass().getName() });
      throw new PublishException(message, e);
    } 
  }
}
