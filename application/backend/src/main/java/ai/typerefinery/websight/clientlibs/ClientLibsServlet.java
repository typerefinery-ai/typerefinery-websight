package ai.typerefinery.websight.clientlibs;

import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.apache.sling.engine.impl.request.SlingRequestPathInfo;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.net.URLConnection;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Calendar;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.jcr.LoginException;
import javax.servlet.Servlet;
import javax.servlet.ServletException;

import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import org.apache.sling.query.SlingQuery;
import org.apache.sling.query.api.SearchStrategy;
import org.apache.sling.settings.SlingSettingsService;
import org.jetbrains.annotations.NotNull;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceMetadata;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.scripting.SlingBindings;
import org.apache.sling.api.scripting.SlingScriptHelper;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.ServletResolverConstants;
import org.osgi.framework.BundleContext;
import org.osgi.framework.Constants;
import org.osgi.service.cm.ConfigurationAdmin;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.io.Files;

import pl.ds.websight.publishing.framework.PublishService;
import pl.ds.websight.publishing.framework.PublishAction;
import pl.ds.websight.publishing.framework.PublishOptions;
import pl.ds.websight.publishing.framework.PublishStatus;
import pl.ds.websight.publishing.framework.PublishStatusName;


import ai.typerefinery.websight.services.ContentAccess;
import ai.typerefinery.websight.utils.FileMimeTypeUtil;

// @Service
// @Component(metatype = false)
// @Properties(value = {
//         @Property(name = "sling.servlet.resourceTypes", value = "apps/mysite/mycomponent"),
//         @Property(name = "sling.servlet.selectors", value = { "fullreport", "shortreport" }),
//         @Property(name = "sling.servlet.extensions", value = { "html" }),
//         @Property(name = "sling.servlet.methods", value = { "GET" }) 
//     })

@Component(
        service = Servlet.class,
        immediate = true,
        property = {
                // Constants.SERVICE_ID + "=TypeRefinery - Flow Service",
                // Constants.SERVICE_DESCRIPTION + "=This is the service for accessing external Flow service",
                // Constants.SERVICE_RANKING+":Integer=1000",
                // ServletResolverConstants.SLING_SERVLET_RESOURCE_TYPES + "=" + ClientLibsService.RESOURCE_TYPE,
                // ServletResolverConstants.SLING_SERVLET_SELECTORS + "=min",
                // ServletResolverConstants.SLING_SERVLET_SELECTORS + "=debug",
                // ServletResolverConstants.SLING_SERVLET_EXTENSIONS + "=css",
                // ServletResolverConstants.SLING_SERVLET_EXTENSIONS + "=js",
                // ServletResolverConstants.SLING_SERVLET_METHODS + "=" + HttpConstants.METHOD_POST,
                // ServletResolverConstants.SLING_SERVLET_METHODS + "=" + HttpConstants.METHOD_GET,
                "service.vendor=TypeRefinery",
                ServletResolverConstants.SLING_SERVLET_PATHS + "=/apps/sling/servlet/default/clientlibs.GET.servlet"
        }
)
@Designate(ocd = ClientLibsServlet.ClientLibsServiceConfiguration.class)
public class ClientLibsServlet extends SlingSafeMethodsServlet  {
    
    private static final long serialVersionUID = 1942189079618404960L;

    private static final Logger LOGGER = LoggerFactory.getLogger(ClientLibsServlet.class);
    public static final String RESOURCE_TYPE = "io/typerefinery/websight/clientlibs"; //this will make sure its not going to coinflict with any other resource type in apps
    public static final String SERVICE_PATH = "/etc.clientlibs/";
    public static final String ALLOWED_PROXY_PATH = "/clientlibs/";
    public static final String PROPERTY_CSS_PATHS = "css";
    public static final String PROPERTY_JS_PATHS = "js";
    public static final String PROPERTY_CATEGORIES = "categories";
    public static final String PROPERTY_DEPENDENCIES = "dependencies";
    public static final String PROPERTY_PREPEND = "prepend";
    public static final String PROPERTY_APPEND= "append";
    public static final String PROPERTY_EXTENSION = "extension";
    public static final String PROPERTY_CACHE_PATH = "cachepath";
    public static final String PROPERTY_CACHE_URI = "cacheuri";

    public static final String OPTION_ASYNC = "async";
    public static final String OPTION_DEFER= "defer";
    public static final String OPTION_CROSSORIGIN= "crossorigin";
    public static final String OPTION_MEDIA = "media";
    public static final String OPTION_ONLOAD = "onload";
    public static final String OPTION_DEBUG = "debug";

    public static final String[] SUPPORTED_EXTENSIONS = { "js", "css" };

    private ClientLibsServiceConfiguration configuration;

    @Reference
    ContentAccess contentAccess;

    @Reference
    PublishService publishService; // used to publish resources

    @Reference
    ConfigurationAdmin configurationAdmin; // used to get configurations

    @Reference
    SlingSettingsService slingSettings; // used to get setting properties

    @Activate
    protected void activate(ClientLibsServiceConfiguration configuration) {
        this.configuration = configuration;
    }


	protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws ServletException, IOException {
        try {
            // check if extension is supported
            String extension = request.getRequestURI().substring(request.getRequestURI().lastIndexOf('.') + 1);
            String requestPath = request.getRequestPathInfo().getSuffix();
            String mimeType = getServletContext().getMimeType(requestPath);
            if (ArrayUtils.contains(SUPPORTED_EXTENSIONS, extension)) {
                // set content type
                if (mimeType != null) {
                    response.setContentType(mimeType); 
                }
                // check if path is valid
                String relPath = getLibraryRelativePath(request);
                if (responseError(
                            response, 
                            404, 
                            MessageFormat.format("Request to {0} not supported.", request.getRequestURI()), 
                            (relPath == null || relPath.length() == 0 || relPath.charAt(0) == '/')
                        )
                    ) {
                    return;
                }                            
                // find the clientlib resource
                Resource resource = resolveRelativePathInSearchPath(request.getResourceResolver(), contentAccess, null, relPath);
                if (responseError(
                            response, 
                            404, 
                            MessageFormat.format("Could not find resource for relative path {0}.", relPath), 
                            (resource == null)
                        )
                    ) {
                    return;
                }

                // get the clientlib properties for caching
                String uri = request.getRequestURI();
                String uriPath = composeResourceCachePath(uri, extension, configurationAdmin, slingSettings);
                boolean isCacheRequest = request.getParameter("cache") == null ? false : true;
                Resource clientlibResource = request.getResourceResolver().getResource(relPath);
                
                // if not cache request and resource is not outdated send it and return
                if (!isCacheRequest) {
                    boolean isCachedOutdated = isCachedResourceOutdated(clientlibResource, uriPath);
                    if (!isCachedOutdated) {
                        //check if resurce has been published and is in cache send it and return
                        if (sendResourceFromCache(request.getResourceResolver(), uriPath, extension, response, configurationAdmin, slingSettings)) {
                            return;
                        }
                    }
                }

                // render all client lib content
                PrintWriter out = response.getWriter();
                printClientlibContent(request.getResourceResolver(), relPath, out, extension, request.getResourceResolver().getSearchPath());
                
                // do not cache if cache request to avoid infinite loop
                if (!isCacheRequest) {
                    // publish client lib to cache
                    publishClientLib(publishService, request.getResourceResolver(), relPath, extension, uriPath, uri);
                }
            } else {
                //send static resource file
                Resource staticResource = resolveRelativePathInSearchPath(request.getResourceResolver(), contentAccess, null, requestPath);
                if (responseError(
                            response, 
                            404, 
                            MessageFormat.format("Resource does not exist {0}.", requestPath), 
                            (staticResource == null)
                        )
                    ) {
                    return;
                }
                // only allow access to files in the /clientlibs/ folder
                if (responseError(
                            response, 
                            404, 
                            MessageFormat.format("Resource path not allowed to be proxied {0}.", requestPath), 
                            (!staticResource.getPath().contains(ALLOWED_PROXY_PATH))
                        )
                    ) {
                    return;
                }
                
                ResourceMetadata meta = staticResource.getResourceMetadata();
                long modifTime = meta.getModificationTime();
                if (unmodified(request, modifTime)) {
                    response.setHeader("Cache-Control", "max-age=86400, public");
                    response.setStatus(304);
                    return;
                }

                sendStaticResource(request.getResourceResolver(), staticResource, mimeType, response);
            }
        } catch (IOException e) {
            LOGGER.error(e.getMessage(), e);
            e.printStackTrace();
        }
    }

    public static String composeResourceCachePath(@NotNull String resoucePath, @NotNull String extension, @NotNull ConfigurationAdmin configAdmin, @NotNull SlingSettingsService slingSettings) {
        String diskFilePath = "";
        String cachePath = getCachePath(configAdmin);
        String directoryPath = "";
        if (!StringUtils.isEmpty(cachePath)) {
            Path configuredPath = Paths.get(cachePath, new String[0]);
            if (configuredPath.isAbsolute()) {
                directoryPath = configuredPath.toString();
            } else {
                directoryPath = Paths.get(slingSettings.getSlingHomePath(), new String[] { cachePath }).toString();
            }
        } else {
            directoryPath = Paths.get(slingSettings.getSlingHomePath(), new String[] { "docroot" }).toString();
        }

        resoucePath = resoucePath.replace("/", File.separator);

        // compose possible disk file path
        if (resoucePath.endsWith("." + extension)) {
            diskFilePath = directoryPath + resoucePath;
        } else {
            diskFilePath = directoryPath + resoucePath + "." + extension;
        }

        return diskFilePath;
    }

    /**
     * check and send a posisble file from disk as a response
     * @param resourceResolver
     * @param resourcePath
     * @param extension
     * @param response
     * @param configAdmin
     * @param slingSettings
     * @return
     */
    public static boolean sendResourceFromCache(@NotNull ResourceResolver resourceResolver, @NotNull String resourcePath, @NotNull String extension, @NotNull SlingHttpServletResponse response, @NotNull ConfigurationAdmin configAdmin, @NotNull SlingSettingsService slingSettings) {

        // check if file exists
        File file = new File(resourcePath);
        if (!file.exists()) {
            LOGGER.info("File does not exist {}", resourcePath);
            return false;
        }

        if (!file.canRead()) {
            LOGGER.info("File is not readable {}", resourcePath);
            return false;
        }

        return sendStaticFile(resourceResolver, file, response);

    }

    /**
     * send file from disk as a response
     * @param resourceResolver
     * @param diskFilePath
     * @param response
     */
    public static boolean sendStaticFile(@NotNull ResourceResolver resourceResolver, @NotNull File file, @NotNull SlingHttpServletResponse response) {
        InputStream resourceInputStream = null;
        try {

            // get last modified time from file
            long modifTime = file.lastModified();
            
            // open file as InputStream
            resourceInputStream = new FileInputStream(file);

            long length = file.length();
            if (length >= 0L) {
                response.setHeader("Content-Length", String.valueOf(length)); 
            }
            response.setHeader("Cache-Control", "max-age=86400, public");
            if (modifTime > 0L) {
                response.setDateHeader("Last-Modified", modifTime); 
            }

            String extension = Files.getFileExtension(file.getName());
            // get content type from resource metadata
            String metaType = FileMimeTypeUtil.getMimeTypeFromExtension(extension);
            if (metaType == null) {
                metaType = "application/octet-stream";
            }
            response.setContentType(metaType); 
            
            // set the character encoding
            String encoding = "UTF-8";
            if (encoding != null) {
                response.setCharacterEncoding(encoding); 
            }
            IOUtils.copy(resourceInputStream, (OutputStream)response.getOutputStream());

            return true;

        } catch (IOException e) {
            LOGGER.error("Could not sendStaticResource for resource {}.", file.getAbsoluteFile());
            e.printStackTrace();
        } finally {
            if (resourceInputStream != null) {
                IOUtils.closeQuietly(resourceInputStream);
            }
        } 
        
        return false;
    }


    /**
     * get the path to the cache folder from service configuration
     * @param sling
     */
    public static String getCachePath(@NotNull ConfigurationAdmin configAdmin) {
        org.osgi.service.cm.Configuration config = getServiceConfig(configAdmin, "pl.ds.websight.publishing.connectors.filesystem.FileSystemStorageConnector");
        String cachePath = null;
        if (config != null) {
            try {
                cachePath = (String) config.getProperties().get("directory.path");
            } catch (Exception e) {
                LOGGER.error(e.getMessage(), e);
            }
        } 
        return cachePath;
    }

    /**
     * get the service configuration from configuration admin service
     */
    public static org.osgi.service.cm.Configuration getServiceConfig(@NotNull ConfigurationAdmin configAdmin, @NotNull String serviceConfigName) {
        try {
            if (configAdmin != null) {
                return configAdmin.getConfiguration(serviceConfigName);
            }
        } catch (IOException e) {
            LOGGER.error(e.getMessage(), e);
        }
        return null;
    }

    /**
     * check if resource is already published
     * @param publishService
     * @param resource
     * @param relPath
     */
    public static boolean isCachedResourceOutdated(@NotNull Resource resource, @NotNull String resourceUriPath) {
        if (!ResourceUtil.isNonExistingResource(resource)) {
            // check if resource is already published
            long lastModified = resource.getResourceMetadata().getModificationTime();
            long created = resource.getResourceMetadata().getCreationTime();
            Calendar lastModifiedCal = Calendar.getInstance();
            lastModifiedCal.setTimeInMillis(lastModified > -1 ? lastModified : created);

            File file = new File(resourceUriPath);
            if (file.exists()) {
                long fileLastModified = file.lastModified();
                // if resource is modified after file was created, means files is older and needs to be updated
                if (lastModifiedCal.getTimeInMillis() > fileLastModified) {
                    return true;
                }
            }
        }
        return false;
    }

    
    /**
     * check if resource is already published
     * @param publishService
     * @param resource
     * @param relPath
     */
    public static boolean isResourcePublished(@NotNull PublishService publishService, @NotNull Resource resource) {
        if (!ResourceUtil.isNonExistingResource(resource)) {
            // check if resource is already published
            long lastModified = resource.getResourceMetadata().getModificationTime();
            long created = resource.getResourceMetadata().getCreationTime();
            Calendar lastModifiedCal = Calendar.getInstance();
            lastModifiedCal.setTimeInMillis(lastModified > -1 ? lastModified : created);

            PublishStatus publishStatus = publishService.getStatus(resource);
            // check if resource is already published and if it is not modified since publish date
            if (publishStatus != null && publishStatus.getStatusName(lastModifiedCal) == PublishStatusName.PUBLISHED) {
                return true;
            }
        }
        return false;
    }

    /**
     * publish clientlib effectively cache it
     * @param publishService
     * @param resourceResolver
     * @param relPath
     */
    public static void publishClientLib(@NotNull PublishService publishService, @NotNull ResourceResolver resourceResolver, @NotNull String relPath, @NotNull String extension, @NotNull String filePath, @NotNull String resoruceUri) {
        Resource clientlibResource = resourceResolver.getResource(relPath);

        if (!ResourceUtil.isNonExistingResource(clientlibResource)) {

            if (isResourcePublished(publishService, clientlibResource)) {
                return;
            }
            try {            
                Map<String, Object> properties = new HashMap<>();
                properties.put(PROPERTY_EXTENSION, extension);
                properties.put(PROPERTY_CACHE_PATH, filePath);
                properties.put(PROPERTY_CACHE_URI, resoruceUri);
                PublishOptions publishOptions = new PublishOptions(PublishAction.PUBLISH, properties);
                List<String> result = publishService.publish(clientlibResource, publishOptions);
                LOGGER.error("Published: {}", result);
            } catch (Exception e) {
                LOGGER.error(e.getMessage(), e);
            } 
        }
    }

    /**
     * output error message to response
     * @param response
     * @param status
     * @param message
     * @param test
     * @return
     * @throws IOException
     */
    public static boolean responseError(@NotNull SlingHttpServletResponse response, @NotNull int status, @NotNull String message, @NotNull Boolean isError) throws IOException {
        if (isError) {
            response.setStatus(status);
            response.setHeader("error", message);
            response.flushBuffer();
            return true;
        }
        return false;
    }

    /**
     * Send static resource.
     * @param resolver
     * @param resource
     * @param response
     * @throws IOException
     */
    public static boolean sendStaticResource(@NotNull ResourceResolver resourceResolver, @NotNull Resource staticResource, @NotNull String mimeType, @NotNull SlingHttpServletResponse response) {
        ResourceMetadata meta = staticResource.getResourceMetadata();
        long modifTime = meta.getModificationTime();

        InputStream resourceInputStream = (InputStream)staticResource.adaptTo(InputStream.class);
        try {
            if (resourceInputStream == null) {
                LOGGER.info("Resource at {} is no streamable", staticResource.getPath());
                response.setStatus(404);
                response.flushBuffer();
                return false;
            }
    
            long length = meta.getContentLength();
            if (length >= 0L) {
                response.setHeader("Content-Length", String.valueOf(length)); 
            }
            response.setHeader("Cache-Control", "max-age=86400, public");
            if (modifTime > 0L) {
                response.setDateHeader("Last-Modified", modifTime); 
            }

            // get content type from resource metadata
            String metaType = meta.getContentType();
            if (metaType != null || !"application/octet-stream".equals(metaType)) {
                mimeType = metaType;
            }
            // set the content type 
            if (mimeType != null) {
                response.setContentType(mimeType); 
            }
            
            // set the character encoding
            String encoding = meta.getCharacterEncoding();
            if (encoding != null) {
                response.setCharacterEncoding(encoding); 
            }
            IOUtils.copy(resourceInputStream, (OutputStream)response.getOutputStream());

            return true;

        } catch (IOException e) {
            LOGGER.error("Could not sendStaticResource for resource {}.", staticResource.getPath());
            e.printStackTrace();
        } finally {
            IOUtils.closeQuietly(resourceInputStream);
        } 
        
        return false;
    }

    /**
     * Check if the resource has been modified since the last request.
     * @param request
     * @param modifTime
     * @return
     */
    private boolean unmodified(@NotNull SlingHttpServletRequest request,@NotNull  long modifTime) {
        if (modifTime > 0L) {
          long modTime = modifTime / 1000L;
          long ims = request.getDateHeader("If-Modified-Since") / 1000L;
          return (modTime <= ims);
        } 
        return false;
    }

    /**
     * get relative path of clientlib resource.
     * @param resolver
     * @param contentAccess
     * @param searchPaths
     * @param relPath
     * @return
     */
    public static Resource resolveRelativePathInSearchPath(@NotNull ResourceResolver resolver, @NotNull ContentAccess contentAccess, @NotNull String[] searchPaths, @NotNull String relPath) {
        if (searchPaths == null) {
            searchPaths = resolver.getSearchPath();
        }

        for (String searchPath : searchPaths) {
          Resource resource = resolvePath(resolver, contentAccess, searchPath + relPath);
          if (resource != null)
            return resource; 
        } 
        return null;
    }

    /**
     * Resolve path from repository and retry if not found using ContentAccess.
     * @param resolver
     * @param contentAccess
     * @param path
     * @return
     */
    public static Resource resolvePath(@NotNull ResourceResolver resolver, @NotNull ContentAccess contentAccess, @NotNull String path) {
        Resource resource = resolver.getResource(path);
        if (resource != null) {
          return resource;
        }
        try (ResourceResolver adminResolver = contentAccess.getAdminResourceResolver()) {
            if (adminResolver == null) {
                return null;
            }
            return adminResolver.getResource(path);    
        } catch (Exception e) {
            LOGGER.error("Could not get admin resource resolver.", e);
        }
        return null;
    }

    /**
     * get the relative path of the clientlib resource.
     * @param request
     * @return
     */
    private String getLibraryRelativePath(@NotNull SlingHttpServletRequest request) {
        Resource resource = request.getResource();
        if (ResourceUtil.isNonExistingResource(resource)) {
            if (!resource.getPath().startsWith(SERVICE_PATH)) {
                return null; 
            }
        } else if (!"/etc".equals(resource.getPath())) {
            return null;
        } 
        if ((request.getRequestPathInfo().getSelectors()).length != 0) {
            return null; 
        }        
        String suffix = request.getRequestPathInfo().getSuffix();
        if (suffix == null || suffix.length() < 2) {
            return null; 
        }
        // find first . after last slash and return everything before that

        int lastSlash = suffix.lastIndexOf('/');
        int firstDot = suffix.indexOf('.', lastSlash);
        if (firstDot == -1) {
            return suffix.substring(1); 
        }
        return suffix.substring(1, firstDot);
    }

    /**
     * compile the path to the resource that will be rendered in a html tag.
     * @param resourcePath
     * @param extension
     * @param removePrefixPath
     * @return path to the resource that will be rendered in a html tag
     */
    public static String compileRenderPath(@NotNull String resourcePath, @NotNull String extension, @NotNull String[] removePrefixPath) {

        for (String prefix : removePrefixPath) {
            String prefixPath = prefix.endsWith("/") ? prefix : prefix + "/";
            if (resourcePath.startsWith(prefixPath)) {
                resourcePath = resourcePath.substring(prefixPath.length());
                break;
            }
        }

        return SERVICE_PATH + resourcePath + "." + extension;
    }

    /**
     * print contents of all files mentioned in embed and categories to the output stream.
     * @param resourceResolver
     * @param clientlibPath
     * @param out
     * @param extension
     */
    public static void printClientlibContent(@NotNull ResourceResolver resourceResolver, @NotNull String clientlibPath, @NotNull PrintWriter out, @NotNull String extension, @Nullable String[] searchPaths) {
        Resource clientlibResource = resourceResolver.getResource(clientlibPath);
        if (!ResourceUtil.isNonExistingResource(clientlibResource)) {
            ValueMap properties = clientlibResource.getValueMap();

            //add anything that need to be prepended with this client lib
            if (properties.containsKey(PROPERTY_PREPEND)) {
                String[] prepend = properties.get(PROPERTY_PREPEND, String[].class);
                printCategoryResources(resourceResolver, prepend, out, extension, searchPaths);
            }

            // print current resource
            printResource(clientlibResource, out, extension);

            //add anything that need to be appended with this client lib
            if (properties.containsKey(PROPERTY_APPEND)) {
                String[] append = properties.get(PROPERTY_APPEND, String[].class);
                printCategoryResources(resourceResolver, append, out, extension, searchPaths);
            }
            
        }
    }

    /**
     * print content of all files in the category to the output stream.
     * @param resourceResolver
     * @param categories
     * @param out
     * @param extension
     * @param searchPaths
     */
    public static void printCategoryResources(@NotNull ResourceResolver resourceResolver, @NotNull String[] categories, @NotNull PrintWriter out, @NotNull String extension, @NotNull String[] searchPaths) {
        for (String category : categories) {
            printCategoryResources(resourceResolver, category, out, extension, searchPaths);
        }
    }

    /**
     * find all resources in the category.
     * @param resourceResolver
     * @param category
     * @param searchPaths
     * @return list of resource paths
     */
    public static String[] findClientLibsCategoryResources(@NotNull ResourceResolver resourceResolver, @NotNull String[] categories, @NotNull String[] searchPaths) {
        List<Resource> resourceRoots = new ArrayList<>();
        for (String searchPath : searchPaths) {
            Resource searchRootResource = resourceResolver.getResource(searchPath);
            resourceRoots.add(searchRootResource);
        }

        Resource[] resourceRootsArray = resourceRoots.toArray(Resource[]::new);

        if (resourceRoots.isEmpty()) {
            LOGGER.error("No search roots not specified {}.", resourceRoots);
            return new String[0];
        }

        List<String> resourcePaths = new ArrayList<>();

        SlingQuery.$(resourceRootsArray)
            .searchStrategy(SearchStrategy.DFS)
            .find(RESOURCE_TYPE)
            .iterator()
            .forEachRemaining((Resource clientLib) -> {
                if (ClientLibsServlet.isResourceMatchesCategory(clientLib, categories)) {
                    resourcePaths.add(clientLib.getPath());
                }
            });
        return resourcePaths.toArray(String[]::new);
    }

    /**
     * find all clientlibs in the repository in search paths.
     * @param resourceResolver
     * @param searchPaths
     * @return iterator of resources
     */
    public static Iterator<Resource> findClientLibsCategoryResources(@NotNull ResourceResolver resourceResolver, @NotNull String[] searchPaths) {
        List<Resource> resourceRoots = new ArrayList<>();
        for (String searchPath : searchPaths) {
            Resource searchRootResource = resourceResolver.getResource(searchPath);
            resourceRoots.add(searchRootResource);
        }

        Resource[] resourceRootsArray = resourceRoots.toArray(Resource[]::new);

        if (resourceRoots.isEmpty()) {
            LOGGER.error("No search roots not specified {}.", resourceRoots);
            return new ArrayList<Resource>().iterator();
        }

        return SlingQuery.$(resourceRootsArray)
            .searchStrategy(SearchStrategy.DFS)
            .find(RESOURCE_TYPE)
            .iterator();
    }
    
    /**
     * find and print all clientlibs for given category in the repository in search paths.
     * @param resourceResolver
     * @param category
     * @param out
     * @param extension
     * @param searchPaths
     */
    public static void printCategoryResources(@NotNull ResourceResolver resourceResolver, @NotNull String category, @NotNull PrintWriter out, @NotNull String extension, @NotNull String[] searchPaths) {
        findClientLibsCategoryResources(resourceResolver, searchPaths)
            .forEachRemaining((Resource clientLib) -> {
                if (isResourceMatchesCategory(clientLib, category)) {
                    printResource(clientLib, out, extension);
                }
            });
    }

    /**
     * is given resource part of a clientlibs categories.
     * @param resource
     * @param category
     * @return
     */
    public static boolean isResourceMatchesCategory(@NotNull Resource resource, @NotNull String[] categories) {
        ValueMap resourceProperties = resource.getValueMap();
        if (resourceProperties != null && resourceProperties.containsKey(PROPERTY_CATEGORIES)) {
            String[] resourceCategories = resourceProperties.get(PROPERTY_CATEGORIES, String[].class);
            for (String category : categories) {
                return ArrayUtils.contains(resourceCategories, category);
            }
        }
        return false;
    }

    /**
     * is given resource part of a clientlibs category.
     * @param resource
     * @param category
     * @return
     */
    public static boolean isResourceMatchesCategory(@NotNull Resource resource, @NotNull String category) {
        ValueMap resourceProperties = resource.getValueMap();
        if (resourceProperties != null && resourceProperties.containsKey(PROPERTY_CATEGORIES)) {
            return ArrayUtils.contains(resourceProperties.get(PROPERTY_CATEGORIES, String[].class), category);
        }
        return false;
    }

    /**
     * is given resource has a property.
     * @param resource
     * @param property
     * @return
     */
    public static boolean isResourceHasProperty(@NotNull Resource resource, @NotNull String property) {
        ValueMap resourceProperties = resource.getValueMap();
        if (resourceProperties != null && resourceProperties.containsKey(property)) {
            return true;
        }
        return false;
    }

    /**
     * Prints the content of the resource to the output stream.
     */
    public static void printResource(Resource resource, PrintWriter out, String extension) {
        LOGGER.info("Found: {}", resource.getPath());                

            ValueMap properties = resource.getValueMap();
            String[] paths = null;
            if (extension.equals("js")) {
                if (properties.containsKey(PROPERTY_JS_PATHS)) {
                    paths = properties.get(PROPERTY_JS_PATHS, String[].class);
                }
            } else if (extension.equals("css")) {
                if (properties.containsKey(PROPERTY_CSS_PATHS)) {
                    paths = properties.get(PROPERTY_CSS_PATHS, String[].class);
                }
            }

            if (paths != null) {
                for (String path : paths) {
                    Boolean outputResult = false;
                    if (path.startsWith("/")) {
                        outputResult = printFileResource(resource.getResourceResolver(), path, out);
                    } else {
                        outputResult = printRelativeFileResource(resource, path, out);
                    }
                    if (outputResult == false) {
                        LOGGER.error("Could not find resource for path {}.", path);
                    }
                }
            }
    }

    /**
     * print a file path relative to a resource to output stream.
     * @param resource
     * @param relativePath
     * @param out
     * @return true if was successful
     */
    public static boolean printRelativeFileResource(Resource resource, String relativePath, PrintWriter out) {
        String resourcePath = resource.getPath() + "/" + relativePath;
        return printFileResource(resource.getResourceResolver(), resourcePath, out);
    }

    /**
     * prints the content of the file resource to the output stream.
     * @param resourceResolver
     * @param resourcePath
     * @param out
     * @return true if was successful
     */
    public static boolean printFileResource(ResourceResolver resourceResolver, String resourcePath, PrintWriter out) {
        Resource resource = resourceResolver.getResource(resourcePath);
        
        if (resource == null) {
            LOGGER.error("Could not find resource for path {}.", resourcePath);
            return false;
        }

        try {
            if (!ResourceUtil.isNonExistingResource(resource)) {
                InputStream inputStream = resource.adaptTo(InputStream.class);
                out.write("/* clientlib source: " + resourcePath + " */");
                out.write(System.lineSeparator());
                out.write(IOUtils.toString(inputStream, "UTF-8"));
                //add new line after each file
                out.write(System.lineSeparator());
            }
            return true;
        } catch (IOException e) {
            LOGGER.error(e.getMessage(), e);
        }
        return false;
    }

    @ObjectClassDefinition(
        name = "TypeRefinery - Clientlibs Configuration",
        description = "This is the configuration for the ClientLibs service"
    )
    public @interface ClientLibsServiceConfiguration {
        
        // @AttributeDefinition(
        //     name = "Search paths",
        //     description = "Host url of the external service."
        // )
        // String[] search_paths() default { "/apps" };

    }
}
