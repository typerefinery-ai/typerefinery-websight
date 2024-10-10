package ai.typerefinery.websight.actions.spaces.rest;

import java.util.List;
import javax.validation.constraints.NotEmpty;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;

import ai.typerefinery.websight.rest.spaces.SpacesRestModelBase;
import pl.ds.websight.request.parameters.support.annotations.RequestParameter;
import pl.ds.websight.rest.framework.Errors;
import pl.ds.websight.rest.framework.Validatable;

@Model(adaptables = {SlingHttpServletRequest.class})
public class SpacesRestModel extends SpacesRestModelBase implements Validatable {
  @NotEmpty
  @RequestParameter
  private List<String> items;
  
  @RequestParameter
  private String options;  

  @RequestParameter
  @Default(booleanValues = true, values = {"false"})
  private Boolean deploy;
  
  @RequestParameter
  @Default(booleanValues = true, values = {"false"})
  private Boolean commit;

  @RequestParameter
  @Default(booleanValues = true, values = {"false"})
  private Boolean backup;
  
  public List<String> getItems() {
    return this.items;
  }
    
  public String getOptions() {
    return this.options;
  }
      
  public Boolean getDeploy() {
    return this.deploy;
  }
        
  public Boolean getCommit() {
    return this.commit;
  }
          
  public Boolean getBackup() {
    return this.backup;
  }
  
  public Errors validate() {
    Errors errors = Errors.createErrors();
    for (String item : this.items) {
      if (item == null || item.isEmpty())
        errors.add("items", item, "Item must be a valid resource child"); 
    } 
    return errors;
  }
}
