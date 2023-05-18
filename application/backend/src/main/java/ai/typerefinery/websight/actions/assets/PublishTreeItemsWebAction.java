package ai.typerefinery.websight.actions.assets;


import org.osgi.service.component.annotations.Component;
import pl.ds.websight.ui.framework.actions.service.Condition;
import pl.ds.websight.ui.framework.actions.service.WebAction;
import pl.ds.websight.ui.framework.actions.service.WebActionConfig;
import pl.ds.websight.ui.framework.actions.service.conditions.HasPrivilegesCondition;

@Component
public class PublishTreeItemsWebAction implements WebAction {
  private static final WebActionConfig CONFIG = WebActionConfig.Builder.newWebActionConfig("/apps/typerefinery/components/actions/assets/publishtree.js")
    .forModule("ws:Assets")
    .forTypes(new String[] { "ws:Asset", "nt:folder" }).forViewTypes(new String[] { "row" }).withMultipleResourceSupport()
    .withCondition((Condition)new HasPrivilegesCondition(new String[] { "ws:publish" })).withRanking(500)
    .build();
  
  public WebActionConfig getConfig() {
    return CONFIG;
  }
}
