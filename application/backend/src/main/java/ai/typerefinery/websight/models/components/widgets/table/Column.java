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

    @Getter
    @Inject
    private String type;

    // TODO: add support for formatter function in the future (see https://bootstrap-table.com/docs/api/table-options/#formatter)
    @Getter
    @Inject
    private String format;

    @Getter
    @Inject
    private String width;

    @Getter
    @Inject
    private String align;

    @Getter
    @Inject
    private String valign;


}
