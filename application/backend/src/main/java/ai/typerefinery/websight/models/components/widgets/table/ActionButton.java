package ai.typerefinery.websight.models.components.widgets.table;


import ai.typerefinery.websight.models.components.BaseFormComponent;
import ai.typerefinery.websight.utils.LinkUtil;

import javax.inject.Inject;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;

import lombok.Getter;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class ActionButton extends BaseFormComponent{
    @Inject
    public String actionButtonNavigateToPath;

    @Inject
    public String actionButtonModalContentURL;

    // Optional pre-navigation action: the widget POSTs the row object here and only follows
    // actionButtonNavigateToPath on success (alpha-launch docs/decisions/0002). Served verbatim -
    // this is a service URL, not a content link, so no LinkUtil handling.
    @Getter
    @Inject
    public String actionButtonPostUrl;
    

    @Getter
    @Inject
    public String actionTypeWhenActionButtonIsClicked;

    @Getter
    @Inject
    public String label;

    @Getter
    @Inject
    public String icon;

    
    @Getter
    @Inject
    public String background;


    public String getActionButtonNavigateToPath() {
        return LinkUtil.handleLink(actionButtonNavigateToPath, resourceResolver);
    }

    public String getActionButtonModalContentURL() {
        return LinkUtil.handleLink(actionButtonModalContentURL, resourceResolver);
    }
}
