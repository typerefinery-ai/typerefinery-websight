package ai.typerefinery.websight.actions.spaces.rest;

import java.util.ArrayList;
import java.util.List;
import javax.jcr.RepositoryException;
import org.apache.sling.api.resource.PersistenceException;
import org.apache.sling.api.resource.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import pl.ds.websight.assets.core.api.AssetException;
import pl.ds.websight.publishing.framework.PublishException;
import pl.ds.websight.rest.framework.RestAction;
import pl.ds.websight.rest.framework.RestActionResult;
import pl.ds.websight.spaces.service.util.JcrUtil;

public abstract class AbstractSpacesRestAction<T extends SpacesRestModel, R> implements RestAction<T, R> {
  private final Logger log = LoggerFactory.getLogger(getClass());
  
  abstract String getFailureMessage(T paramT);
  
  abstract RestActionResult<R> execute(T paramT, List<Resource> paramList) throws PersistenceException, AssetException, RepositoryException, PublishException;
  
  public RestActionResult<R> perform(T model) {
    List<String> items = model.getItems();
    String failureMessage = getFailureMessage(model);
    List<Resource> resources = new ArrayList<>(items.size());
    for (String item : items) {
      Resource child = model.getRequestedResource().getChild(item);
      if (child == null)
        return RestActionResult.failure(failureMessage, 
            String.format("The '%s' does not exist or you do not have access to this resource", new Object[] { item })); 
      if (!JcrUtil.isNodeType(child, "ws:PagesSpace"))
        return RestActionResult.failure(failureMessage, 
            String.format("Resource '%s' must be a Pages Space.", new Object[] { item })); 
      resources.add(child);
    } 
    try {
      return execute(model, resources);
    } catch (PersistenceException|AssetException|RepositoryException|PublishException e) {
      this.log.error("Error during resource items action", e);
      return RestActionResult.failure(failureMessage, "Please check if selected items are valid and try again. If this error persists, please contact the site administrator.");
    } 
  }
}
