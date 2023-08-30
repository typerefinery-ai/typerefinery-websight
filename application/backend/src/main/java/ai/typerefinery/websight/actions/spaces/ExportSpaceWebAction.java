package ai.typerefinery.websight.actions.spaces;

import org.jetbrains.annotations.NotNull;
import org.osgi.service.component.annotations.Component;
import pl.ds.websight.ui.framework.actions.service.Condition;
import pl.ds.websight.ui.framework.actions.service.WebAction;
import pl.ds.websight.ui.framework.actions.service.WebActionConfig;
import pl.ds.websight.ui.framework.actions.service.conditions.HasPrivilegesCondition;

@Component
public class ExportSpaceWebAction implements WebAction {
  private static final WebActionConfig CONFIG = WebActionConfig.Builder.newWebActionConfig("/apps/typerefinery/components/actions/spaces/exportspace.js")
    .forAllModules()
    .forTypes(new String[] { "ws:Space" }).forViewTypes(new String[] { "row" })
    .withCondition((Condition)new HasPrivilegesCondition(new String[] { "ws:publish" })).withRanking(600)
    .build();
  
  @NotNull
  public WebActionConfig getConfig() {
    return CONFIG;
  }
}
