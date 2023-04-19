package ai.typerefinery.websight.utils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.util.Calendar;
import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.Validate;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.engine.SlingRequestProcessor;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import pl.ds.websight.cm.core.api.WebsightException;
import pl.ds.websight.pages.core.api.Page;
import pl.ds.websight.pages.core.api.PageException;
import pl.ds.websight.pages.core.api.PageManager;

public class ResourceUtils {
  private static final Logger LOGGER = LoggerFactory.getLogger(ResourceUtils.class);
  
  public static final String PATH_DELIMITER = "/";
  
  public static void orderBefore(Resource parent, String sourceName, String orderBefore) {
    Validate.notNull(parent);
    Node parentNode = (Node)parent.adaptTo(Node.class);
    if (parentNode == null)
      throw new IllegalStateException("Order before not supported for current resource provider"); 
    try {
      parentNode.orderBefore(sourceName, orderBefore);
    } catch (RepositoryException e) {
      throw new IllegalStateException(
          String.format("Error occurred while ordering resource %s before %s", new Object[] { sourceName, orderBefore }), e);
    } 
  }
  
  public static void move(@NotNull ResourceResolver resourceResolver, @NotNull String sourcePath, @NotNull String destinationPath) throws RepositoryException, WebsightException {
    Session session = (Session)resourceResolver.adaptTo(Session.class);
    if (session == null)
      throw new WebsightException("Cannot adapt resource resolver to Session object"); 
    session.move(sourcePath, destinationPath);
  }
  
  public static boolean isSubNodeOf(@NotNull Resource child, @NotNull Resource parent) {
    return isSubNodeOf(child.getPath(), parent.getPath());
  }
  
  public static boolean isSubNodeOf(@NotNull String childPath, @NotNull String parentPath) {
    String parentPathWithEndingDelimiter = parentPath.endsWith("/") ? parentPath : (parentPath + "/");
    return childPath.startsWith(parentPathWithEndingDelimiter);
  }
  
  @NotNull
  public static String uniqueName(@NotNull Resource parent, @NotNull String resourceName) {
    String currentName = resourceName;
    int iterationIndex = 1;
    while (true) {
      if (parent.getChild(currentName) == null)
        return currentName; 
      currentName = resourceName + "_" + resourceName;
      if (iterationIndex >= Integer.MAX_VALUE)
        throw new IllegalStateException("Cannot get unique name"); 
    } 
  }
  
  public static void markPageAsEdited(Resource resource) {
    PageManager pageManager = (PageManager)resource.getResourceResolver().adaptTo(PageManager.class);
    if (pageManager == null)
      return; 
    Page page = pageManager.getContainingPage(resource.getPath());
    if (page != null)
      updateModifiedProperties(page, pageManager); 
  }
  
  private static void updateModifiedProperties(Page page, PageManager pageManager) {
    try {
      pageManager.setContentProperty(page.getPath(), "ws:lastModified", Calendar.getInstance());
      Session session = (Session)page.getResource().getResourceResolver().adaptTo(Session.class);
      if (session != null)
        pageManager.setContentProperty(page.getPath(), "ws:lastModifiedBy", session.getUserID()); 
    } catch (PageException e) {
        LOGGER.warn("Cannot update Page modification properties {}", e.getMessage());
    } 
  }

  public static String getResourceHtml(@NotNull ResourceResolver resourceResolver, @NotNull SlingRequestProcessor requestProcessor, @NotNull String path) {
    try {
        String html = "";
        String url = path + ".html";
        HttpServletRequest req = new FakeRequest("GET", url);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        HttpServletResponse resp;
        try {
            resp = new FakeResponse(out);

            // this needs to be done to get the inherited resource
            requestProcessor.processRequest(req, resp, resourceResolver);

            // need to flush the response to get the contents
            resp.getWriter().flush();

            // trim to remove all the extra whitespace
            html = out.toString().trim();

        } catch (ServletException | IOException | NoSuchAlgorithmException e) {
            LOGGER.warn("Exception retrieving contents for {}", url, e);
        }
        
        
        return html;
    } catch (Exception e) {
        LOGGER.error("Error getting inherited html", e);
    }
    return "";
  }
}
