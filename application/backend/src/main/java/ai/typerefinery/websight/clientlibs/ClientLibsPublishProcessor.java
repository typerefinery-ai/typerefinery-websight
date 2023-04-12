package ai.typerefinery.websight.clientlibs;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.CopyOption;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.FileAttribute;
import java.text.MessageFormat;
import java.util.List;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.engine.SlingRequestProcessor;
import org.apache.sling.servlethelpers.internalrequests.SlingInternalRequest;
import org.apache.tika.io.IOUtils;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import pl.ds.websight.publishing.connectors.StorageConnectorException;
import pl.ds.websight.publishing.connectors.spi.StorageConnector;
import pl.ds.websight.publishing.framework.PublishAction;
import pl.ds.websight.publishing.framework.PublishException;
import pl.ds.websight.publishing.framework.PublishOptions;
import pl.ds.websight.publishing.framework.spi.PublishProcessor;

@Component(service = { PublishProcessor.class })
public class ClientLibsPublishProcessor implements PublishProcessor {

    protected final Logger LOGGER = LoggerFactory.getLogger(getClass());

    @Reference
    private SlingRequestProcessor requestProcessor;

    @Activate
    private void activate() {
        LOGGER.info("activated");
    }

    /**
     * This method is called to check if the resource can be processed by this
     * processor. It is called only once for each publish process.
     * @param resourceResolver
     * @param resourcePath
     * @return true if the resource can be processed by this processor
     */
    public boolean canProcess(ResourceResolver resourceResolver, String resourcePath) {
        LOGGER.info("canProcess");
        Resource resource = resourceResolver.getResource(resourcePath);
        boolean returnValue = false;
        if (resource != null) {
            String resourceType = resource.getResourceType();
            if (resourceType != null) {
                returnValue = resourceType.equals(ClientLibsServlet.RESOURCE_TYPE);
            }
        }
        return returnValue;
    }

    /**
     * This method is called before the publish process starts. It is used to
     * prepare the publish process. It is called only once for each publish
     * process.
     * As client libs dont exist as nodes, we need to render them as string and
     * save them as file during prepare phase.
     * @param resourceResolver
     * @param resourcePath
     * @param options
     */
    public void prepare(ResourceResolver resourceResolver, String resourcePath, PublishOptions options) {
        LOGGER.info("prepare");
        if (PublishAction.PUBLISH == options.getPublishAction()) {
            try {
                // processPublish(resourceResolver, resourcePath, options);
                String extension = options.getProperties().get(ClientLibsServlet.PROPERTY_EXTENSION).toString();
                String resourceUri = options.getProperties().get(ClientLibsServlet.PROPERTY_CACHE_URI).toString();
                String cachePath = options.getProperties().get(ClientLibsServlet.PROPERTY_CACHE_PATH).toString();

                store(getStorageData(resourceResolver, resourceUri, extension), cachePath);
            } catch (StorageConnectorException | PublishException e) {
                LOGGER.error("Failed to store resource into path {}", resourcePath);
                e.printStackTrace();
            }
        } else if (PublishAction.UNPUBLISH == options.getPublishAction()) {
            try {
                // processUnpublish(resourceResolver, resourcePath, options);
                delete(resourcePath);
            } catch (StorageConnectorException e) {
                LOGGER.error("Failed to delete resource in path {}", resourcePath);
                e.printStackTrace();
            }
        }
    }

    /**
     * This method that is called to publish a resource. As client libs dont exsint in repository
     * this will never be called.
     */
    public void process(ResourceResolver resourceResolver, String resourcePath, PublishOptions options)
            throws PublishException {
        // this wont happen as client libs are not nodes
        LOGGER.info("process");
    }


    /**
     * store file in disk cache
     * @param input
     * @param cachePath
     * @throws StorageConnectorException
     */
    public void store(InputStream input, String cachePath) throws StorageConnectorException {
        try {
            Path absolutePath = Paths.get(cachePath);
            Files.createDirectories(absolutePath.getParent(), (FileAttribute<?>[]) new FileAttribute[0]);
            Files.copy(input, absolutePath, new CopyOption[] { StandardCopyOption.REPLACE_EXISTING });
        } catch (IOException e) {
            LOGGER.error("Failed to store resource under path {}", cachePath);
            throw new StorageConnectorException("Failed to store resource", e);
        }
    }

    /**
     * delete file from disk cache
     * @param path
     * @throws StorageConnectorException
     */
    public void delete(String path) throws StorageConnectorException {
        try {
            Files.deleteIfExists(Paths.get(path));
        } catch (IOException e) {
            LOGGER.error("Failed to delete resource under path {}", path);
            throw new StorageConnectorException("Failed to delete resource", e);
        }
    }

    /**
     * render resource as string
     * @param resourceResolver
     * @param path is the resourceUri to render
     * @param extension is the extension of the resource is not part of path
     */
    public InputStream getStorageData(ResourceResolver resourceResolver, String path, String extension)
            throws PublishException {
        try {
            String response = "";
            if (path.endsWith("." + extension)) {
                // render resource as string
                response = (new SlingInternalRequest(resourceResolver, this.requestProcessor,
                        path)).withParameter("cache", "cache").execute().getResponseAsString();

            } else {
                // render resource as string
                response = (new SlingInternalRequest(resourceResolver, this.requestProcessor,
                        path)).withParameter("cache", "cache").withExtension(extension).execute().getResponseAsString();
            }
            // return it to be saved as file
            return IOUtils.toInputStream(response);
        } catch (IOException e) {
            throw new PublishException(
                    String.format("Failed to perform internal sling request to render page of path %s",
                            new Object[] { path }),
                    e);
        }
    }

    /**
     * this method is used to identify the processor to publish service.
     */
    public String getId() {
        return "ai/typerefinery/websight/clientlibs";
    }
}
