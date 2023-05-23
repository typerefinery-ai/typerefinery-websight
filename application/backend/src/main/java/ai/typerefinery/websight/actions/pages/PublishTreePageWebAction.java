package ai.typerefinery.websight.actions.pages;

import org.osgi.service.component.annotations.Component;
import pl.ds.websight.ui.framework.actions.service.Condition;
import pl.ds.websight.ui.framework.actions.service.WebAction;
import pl.ds.websight.ui.framework.actions.service.WebActionConfig;
import pl.ds.websight.ui.framework.actions.service.conditions.HasPrivilegesCondition;

@Component
public class PublishTreePageWebAction implements WebAction {
  private static final WebActionConfig CONFIG = WebActionConfig.Builder.newWebActionConfig("/apps/typerefinery/components/actions/pages/publishtree.js")
    .withName("publishtree")
    .forModule("ws:SpaceElement")
    .forTypes(new String[] { "ws:Page" }).forViewTypes(new String[] { "row" }).withMultipleResourceSupport()
    .withCondition((Condition)new HasPrivilegesCondition(new String[] { "ws:publish" })).withRanking(600)
    .build();
  
  public WebActionConfig getConfig() {
    return CONFIG;
  }
}
