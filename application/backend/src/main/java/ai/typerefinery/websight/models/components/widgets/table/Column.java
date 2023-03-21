package ai.typerefinery.websight.models.components.widgets.table;

import javax.inject.Inject;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import lombok.Getter;



@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Column {
    // field and name are required
    @Getter
    @Inject
    private String field;

    @Getter
    @Inject
    private String title;
}
