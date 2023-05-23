package ai.typerefinery.websight.actions.pages.rest;


import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Spliterators;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import org.apache.jackrabbit.JcrConstants;
import org.apache.sling.api.resource.PersistenceException;
import org.apache.sling.api.resource.Resource;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ai.typerefinery.websight.utils.DeepIterator;
import pl.ds.websight.pages.core.api.Page;
import pl.ds.websight.pages.core.api.PageException;
import pl.ds.websight.publishing.framework.PublishAction;
import pl.ds.websight.publishing.framework.PublishException;
import pl.ds.websight.publishing.framework.PublishOptions;
import pl.ds.websight.publishing.framework.PublishService;
import pl.ds.websight.rest.framework.RestAction;
import pl.ds.websight.rest.framework.RestActionResult;
import pl.ds.websight.rest.framework.annotations.PrimaryTypes;
import pl.ds.websight.rest.framework.annotations.SlingAction;

@SlingAction
@PrimaryTypes({"ws:Page", "ws:Pages"})
@Component
public class PublishTreePagesRestAction extends AbstractPagesRestAction<PagesRestModel, Void> implements RestAction<PagesRestModel, Void> {
  private static final Logger LOG = LoggerFactory.getLogger(PublishTreePagesRestAction.class);
  
  @Reference
  private PublishService publishService;
  
  protected RestActionResult<Void> execute(PagesRestModel model, List<Resource> pages) throws PageException, PersistenceException {
    boolean isAllPages = Boolean.valueOf(model.getOptions().equals("all"));
    boolean isOnlyPublished = Boolean.valueOf(model.getOptions().equals("onlypublished"));
    return publishPages(isAllPages, isOnlyPublished, pages, this.publishService);
  }
  
  protected static String getFailureMessage(Integer numberOfSuccesses) {
    return "Error while publishing " + ((numberOfSuccesses == 1) ? "page" : "pages");
  }  
  protected String getFailureMessage(PagesRestModel model) {
    return "Error while publishing " + ((model.getItems().size() == 1) ? "page" : "pages");
  }
  
  public static RestActionResult<Void> publishPages(boolean isAllPages, boolean isOnlyPublished, List<Resource> pages, PublishService publishService)  {
    Map<String, List<String>> resourceProcessors = new HashMap<>();

    for (Resource page : pages) {
      try {

        // publish current page
        List<String> processors = publishService.publish(page, new PublishOptions(PublishAction.PUBLISH));
        resourceProcessors.put(page.getPath(), processors);

        // publish children recursively
        // for current page.streamOfChildrenRecursively publish each page
        streamOfChildrenRecursively(page)
          .forEach(r -> {
            try {
                Map<String, Object> properties =  getContentProperties(r);
                if (properties == null) {
                    // this is not a page node
                    return;
                }
                boolean isPublished = properties.containsKey("ws:lastPublishAction") ? properties.get("ws:lastPublishAction").equals("Publish") : false;
                if (isAllPages || (isOnlyPublished && isPublished )) {
                    List<String> childProcessors = publishService.publish(r, new PublishOptions(PublishAction.PUBLISH));
                    resourceProcessors.put(r.getPath(), childProcessors);      
                }
            } catch (PublishException e) {
              LOG.error("Error during publishing pages. ", (Throwable)e);
            } 
          });
      } catch (PublishException e) {
        LOG.error("Error during publishing pages. ", (Throwable)e);
        return RestActionResult.failure(getFailureMessage(pages.size()), "Please try again or contact administrator");
      } 
    } 
    Collection<String> notPublishedPages = notPublishedPages(resourceProcessors);
    if (notPublishedPages.isEmpty())
      return RestActionResult.success("Publishing requested", "Publishing requested successfully."); 
    LOG.debug("Could not found any publish processor for pages: {}", 
        String.join(", ", (Iterable)notPublishedPages));
    return RestActionResult.failure(getFailureMessage(pages.size()), "Could not found any publish processor for requested resource.");
  }
  
  private static Collection<String> notPublishedPages(Map<String, List<String>> resourceProcessors) {
    return (Collection<String>)resourceProcessors.keySet().stream()
      .filter(key -> ((List)resourceProcessors.get(key)).isEmpty())
      .collect(Collectors.toList());
  }

  @NotNull
  public static Stream<Resource> streamOfChildrenRecursively(Resource resource) {
    return toStream(DeepIterator.ofResource(resource, 2147483647), Function.identity());
  }
  
  @NotNull
  public static Stream<Resource> streamOfChildrenRecursively(Resource resource, int maxLevel) {
    if (maxLevel < 0)
      throw new IllegalArgumentException("maxLevel cannot be negative"); 
    return toStream(DeepIterator.ofResource(resource, maxLevel), Function.identity());
  }

  @NotNull
  public static <T, R> Stream<R> toStream(Iterator<T> resourceIterator, Function<T, R> converter) {
    return StreamSupport.<T>stream(
        Spliterators.spliteratorUnknownSize(resourceIterator, 273), false)
      
      .<R>map(converter)
      .filter(Objects::nonNull);
  }

  @Nullable
  public static Map<String, Object> getContentProperties(Resource resource) {
    Resource contentResource = getContentResource(resource);
    return (contentResource == null) ? null : (Map<String, Object>)contentResource.getValueMap();
  }

  @Nullable
  public static Resource getContentResource(Resource resource) {
    return resource.getChild(JcrConstants.JCR_CONTENT);
  }
}


