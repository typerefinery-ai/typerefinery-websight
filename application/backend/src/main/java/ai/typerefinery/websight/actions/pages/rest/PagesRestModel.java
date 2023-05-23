package ai.typerefinery.websight.actions.pages.rest;

import java.util.List;
import javax.validation.constraints.NotEmpty;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.models.annotations.Model;

import ai.typerefinery.websight.rest.pages.PagesRestModelBase;
import pl.ds.websight.request.parameters.support.annotations.RequestParameter;
import pl.ds.websight.rest.framework.Errors;
import pl.ds.websight.rest.framework.Validatable;

@Model(adaptables = {SlingHttpServletRequest.class})
public class PagesRestModel extends PagesRestModelBase implements Validatable {
  @NotEmpty
  @RequestParameter
  private List<String> items;
  
  @RequestParameter
  private String options;
  
  public List<String> getItems() {
    return this.items;
  }
    
  public String getOptions() {
    return this.options;
  }
  
  public Errors validate() {
    Errors errors = Errors.createErrors();
    for (String item : this.items) {
      if (item == null || item.isEmpty() || item.contains("/"))
        errors.add("items", item, "Item must be a valid resource child"); 
    } 
    return errors;
  }
}
