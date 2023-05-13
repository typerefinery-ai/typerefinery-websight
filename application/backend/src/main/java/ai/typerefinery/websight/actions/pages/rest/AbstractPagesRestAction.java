package ai.typerefinery.websight.actions.pages.rest;

import java.util.ArrayList;
import java.util.List;
import org.apache.sling.api.resource.PersistenceException;
import org.apache.sling.api.resource.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import pl.ds.websight.pages.core.api.Page;
import pl.ds.websight.pages.core.api.PageException;
import pl.ds.websight.pages.core.api.PageManager;
import pl.ds.websight.publishing.framework.PublishException;
import pl.ds.websight.rest.framework.RestAction;
import pl.ds.websight.rest.framework.RestActionResult;

public abstract class AbstractPagesRestAction<T extends PagesRestModel, R> implements RestAction<T, R> {
  private final Logger log = LoggerFactory.getLogger(getClass());
  
  protected abstract String getFailureMessage(T paramT);
  
  protected abstract RestActionResult<R> execute(T paramT, List<Page> paramList) throws PageException, PersistenceException, PublishException;
  
  public RestActionResult<R> perform(T model) {
    PageManager pageManager = model.getPageManager();
    List<String> items = model.getItems();
    String failureMessage = getFailureMessage(model);
    List<Page> pages = new ArrayList<>(items.size());
    for (String item : items) {
      Resource child = model.getRequestedResource().getChild(item);
      if (child == null)
        return RestActionResult.failure(failureMessage, 
            String.format("The '%s' does not exist or you do not have access to this resource", new Object[] { item })); 
      Page page = pageManager.getPage(child.getPath());
      if (page == null)
        return RestActionResult.failure(failureMessage, 
            String.format("Resource '%s' must be a page.", new Object[] { item })); 
      pages.add(page);
    } 
    try {
      return execute(model, pages);
    } catch (PersistenceException|PageException|PublishException e) {
      this.log.error("Error during pages action", e);
      return RestActionResult.failure(failureMessage, "Please check if selected pages are valid and try again. If this error persists, please contact the site administrator.");
    } 
  }
}
