package ai.typerefinery.websight.activator;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.framework.BundleEvent;
import org.osgi.framework.BundleListener;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import pl.ds.websight.publishing.framework.PublishAction;
import pl.ds.websight.publishing.framework.PublishException;
import pl.ds.websight.publishing.framework.PublishOptions;
import pl.ds.websight.publishing.framework.PublishService;
import org.apache.commons.lang3.StringUtils;

@Component(service = { Runnable.class }, immediate = true, property = { "scheduler.period:Long=10",
        "scheduler.concurrent:Boolean=false" })
public class ClientlibsPublisher implements BundleListener, Runnable {
    private static final Logger LOG = LoggerFactory.getLogger(ClientlibsPublisher.class);

    private static final String BUNDLE_HEADER = "Typerefinery-Apps-Clientlibs";

    private static final String SERVICE_USER_ID = "websight-webroot-publish";

    @Reference
    private PublishService publishService;

    @Reference
    private ResourceResolverFactory resourceResolverFactory;

    private final Map<String, Set<String>> publishedFilesByWebRoot = new ConcurrentHashMap<>();

    @Activate
    private void activate(BundleContext bundleContext) {
        bundleContext.addBundleListener(this);
        Arrays.<Bundle>stream(bundleContext.getBundles()).forEach(this::addBundleWebRoot);
    }

    @Deactivate
    private void deactivate(BundleContext bundleContext) {
        bundleContext.removeBundleListener(this);
        this.publishedFilesByWebRoot.clear();
    }

    public void bundleChanged(BundleEvent event) {
        if (event.getType() == 2) {
            addBundleWebRoot(event.getBundle());
        } else if (event.getType() == 4) {
            removeBundleWebRoot(event.getBundle());
        }
    }

    public void run() {
        this.publishedFilesByWebRoot.forEach(this::publishWebRoot);
    }

    private void publishWebRoot(String webRoot, Set<String> publishedFiles) {
        try {
            ResourceResolver resourceResolver = this.resourceResolverFactory
                    .getServiceResourceResolver(Map.of("sling.service.subservice", "websight-webroot-publish"));
            try {
                Resource webRootResource = resourceResolver.getResource(webRoot);
                if (webRootResource == null) {
                    LOG.warn("Error occurred during processing web root {} - resource does not exist", webRoot);
                    if (resourceResolver != null)
                        resourceResolver.close();
                    return;
                }
                List<Resource> files = new ArrayList<>();
                findResources(webRootResource.getChildren(), "nt:file", files);
                for (Resource file : files) {
                    if (!publishedFiles.contains(file.getPath())) {
                        List<String> processors = this.publishService.publish(file,
                                new PublishOptions(PublishAction.PUBLISH));
                        if (!processors.isEmpty())
                            publishedFiles.add(file.getPath());
                    }
                }
                if (resourceResolver != null)
                    resourceResolver.close();
            } catch (Throwable throwable) {
                if (resourceResolver != null)
                    try {
                        resourceResolver.close();
                    } catch (Throwable throwable1) {
                        throwable.addSuppressed(throwable1);
                    }
                throw throwable;
            }
        } catch (LoginException e) {
            LOG.error("Error occurred during processing web root {} - unable to get resource resolver", webRoot, e);
        } catch (PublishException e) {
            LOG.warn("Error occurred during processing web root {} - unable to publish data", webRoot, e);
        }
    }

    private void findResources(Iterable<Resource> resources, String resourceType, List<Resource> results) {
        for (Resource resource : resources) {
            if (resource.getResourceType().equals(resourceType))
                results.add(resource);
            findResources(resource.getChildren(), resourceType, results);
        }
    }

    private void addBundleWebRoot(Bundle bundle) {
        String[] webRoots = getWebrootBundleHeader(bundle);
        for (String webRoot : webRoots) {
            if (StringUtils.isNotBlank(webRoot)) {
                this.publishedFilesByWebRoot.put(webRoot, new CopyOnWriteArraySet<>());
            }
        }
    }

    private void removeBundleWebRoot(Bundle bundle) {
        String[] webRoots = getWebrootBundleHeader(bundle);
        for (String webRoot : webRoots) {
            if (StringUtils.isNotBlank(webRoot)) {
                this.publishedFilesByWebRoot.remove(webRoot);
            }
        }
    }

    // get list of web roots that were defined and loaded from bnd.bnd file
    // allow for comma separated list of web roots
    private String[] getWebrootBundleHeader(Bundle bundle) {
        String header = (String) bundle.getHeaders().get(BUNDLE_HEADER);
        if (header == null) {
            return new String[0];
        }
        return StringUtils.split(header, ',');
    }
}
