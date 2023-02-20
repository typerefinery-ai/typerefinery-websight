package io.typerefinery.websight.clientlibs;

import javax.inject.Inject;
import javax.inject.Named;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Arrays;
import java.util.Set;

import org.jetbrains.annotations.Nullable;
import org.jsoup.nodes.Element;
import org.jsoup.parser.Tag;
import org.jetbrains.annotations.NotNull;
import javax.annotation.PostConstruct;
import org.apache.sling.api.resource.Resource;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.typerefinery.websight.services.ContentAccess;
import io.typerefinery.websight.utils.StringsUtils;

import static io.typerefinery.websight.clientlibs.ClientLibsServlet.PROPERTY_CATEGORIES;
import static io.typerefinery.websight.clientlibs.ClientLibsServlet.PROPERTY_CSS_PATHS;
import static io.typerefinery.websight.clientlibs.ClientLibsServlet.PROPERTY_JS_PATHS;
import static io.typerefinery.websight.clientlibs.ClientLibsServlet.OPTION_ASYNC;
import static io.typerefinery.websight.clientlibs.ClientLibsServlet.OPTION_DEFER;
import static io.typerefinery.websight.clientlibs.ClientLibsServlet.OPTION_CROSSORIGIN;
import static io.typerefinery.websight.clientlibs.ClientLibsServlet.OPTION_ONLOAD;
import static io.typerefinery.websight.clientlibs.ClientLibsServlet.OPTION_MEDIA;
import static io.typerefinery.websight.clientlibs.ClientLibsServlet.OPTION_DEBUG;

@Model(
    adaptables = SlingHttpServletRequest.class,
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class ClientLibsModel {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(ClientLibsModel.class);

    @Self
    private SlingHttpServletRequest request;

    @OSGiService
    ResourceResolverFactory resolverFactory;

    @OSGiService
    ContentAccess contentAccess;

    @Inject
    @Named(PROPERTY_CATEGORIES)
    private Object categories;

    @Inject
    @Named(OPTION_DEBUG)
    @Nullable
    private boolean debug;

    @Inject
    @Named(OPTION_ASYNC)
    @Nullable
    private boolean async;

    @Inject
    @Named(OPTION_DEFER)
    @Nullable
    private boolean defer;

    @Inject
    @Named(OPTION_CROSSORIGIN)
    @Nullable
    private String crossorigin;

    @Inject
    @Named(OPTION_ONLOAD)
    @Nullable
    private String onload;

    @Inject
    @Named(OPTION_MEDIA)
    @Nullable
    private String media;

    private String[] categoriesArray;
    private Set<String> categoriesSet;

    @PostConstruct
    protected void init() {

        Set<String> categoriesSet = StringsUtils.getStrings(categories);

        categoriesArray = categoriesSet.toArray(new String[0]);
    }

    @NotNull
    public String getJsInline() {
        return getInline(PROPERTY_JS_PATHS);
    }

    @NotNull
    public String getCssInline() {
        return getInline(PROPERTY_CSS_PATHS);
    }

    public String getJsIncludes() {
        return getLibIncludes(PROPERTY_JS_PATHS);
    }

    public String getCssIncludes() {
        return getLibIncludes(PROPERTY_CSS_PATHS);
    }

    public String getJsAndCssIncludes() {
        return getLibIncludes(null);
    }

    /**
     * Return list of clientlib resources as html string.
     */
    private String getLibIncludes(String type) {
        StringWriter stringWriter = new StringWriter();
            if (categoriesArray == null || categoriesArray.length == 0)  {
                LOGGER.error("No categories detected. Please either specify the categories as a CSV string or a set of resource types for looking them up.");
            } else {
                try (ResourceResolver resourceResolver = contentAccess.getAdminResourceResolver()) {                    
                    String[] searchPaths = new String[]{"/apps"};
                    // for each category in categoriesArray, find all resources and print them
                    compileIncludes(ClientLibsServlet.findClientLibsCategoryResources(resourceResolver, categoriesArray, searchPaths ), type, stringWriter, searchPaths);
                } catch (Exception e) {
                    LOGGER.error("Failed to include client libraries {}", Arrays.toString(categoriesArray));
                }
    
            }
        return stringWriter.toString();
        // inject attributes from HTL into the JS and CSS HTML tags
        //return getHtmlWithInjectedAttributes(html);
    }


    /**
     * Return list of clientlib resources as html string.
     * @param type
     * @return
     */
    private String getInline(String type) {
        StringWriter stringWriter = new StringWriter();
        try {
            if (categoriesArray == null || categoriesArray.length == 0)  {
                LOGGER.error("No categories detected. Please either specify the categories as a CSV string or a set of resource types for looking them up.");
            } else {
                PrintWriter out = new PrintWriter(stringWriter);
                ResourceResolver resourceResolver = contentAccess.getAdminResourceResolver();
                //find all resources in the categories and print them
                ClientLibsServlet.printCategoryResources(resourceResolver, categoriesArray, out, type, new String[]{"/apps"} );
            }
        } catch (Exception e) {
            LOGGER.error("Failed to include client libraries {}", Arrays.toString(categoriesArray));
        }
        return stringWriter.toString();
    }
    /**
     * Returns the content of the clientlib resource as a string.
     */
    private void compileIncludes(@NotNull String[] paths, String type, @NotNull StringWriter stringWriter, String[] searchPaths) {
        for (String path : paths) {
            Resource resource = request.getResourceResolver().getResource(path);
            Boolean includeJS = (type == null || type.equals(PROPERTY_JS_PATHS)) 
                && ClientLibsServlet.isResourceHasProperty(resource, PROPERTY_JS_PATHS);
            Boolean includeCSS = (type == null || type.equals(PROPERTY_CSS_PATHS)) 
                && ClientLibsServlet.isResourceHasProperty(resource, PROPERTY_CSS_PATHS);

            if (debug) {
                stringWriter.append("<!-- " + path + " -->" + System.lineSeparator());
            }

            if (includeJS) {
                Element htmlTag = new Element(Tag.valueOf("script"), "");

                htmlTag.attr("type", "text/javascript")
                    .attr("src", ClientLibsServlet.compileRenderPath(path, PROPERTY_JS_PATHS, searchPaths))                    
                    .attr(OPTION_CROSSORIGIN, crossorigin);

                if (StringUtils.isNotBlank(onload)) {
                    htmlTag.attr(OPTION_ONLOAD, onload);
                }
                    
                if (defer) {
                    htmlTag.attr(OPTION_DEFER, defer);
                }
                                        
                if (async) {
                    htmlTag.attr(OPTION_ASYNC, async);
                }
                    
                stringWriter.append(htmlTag.toString());
                // add a newline to make the output more readable
                stringWriter.append(System.lineSeparator());
            } 
            if (includeCSS) {
                Element htmlTag = new Element(Tag.valueOf("link"), "");
                htmlTag
                    .attr("type", "text/css")
                    .attr("rel", "stylesheet")
                    .attr("href", ClientLibsServlet.compileRenderPath(path, PROPERTY_CSS_PATHS, searchPaths))
                    .attr(OPTION_CROSSORIGIN, crossorigin);

                if (StringUtils.isNotBlank(media)) {
                    htmlTag.attr(OPTION_MEDIA, media);
                }
                
                stringWriter.append(htmlTag.toString());
                // add a newline to make the output more readable
                stringWriter.append(System.lineSeparator());
            }
        }
    }

}
