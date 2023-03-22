package ai.typerefinery.websight.models.components.widgets.table;

import javax.inject.Inject;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;

import lombok.Getter;
import org.apache.sling.models.annotations.Default;


@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class ColumnRules {
        @Getter
        @Inject
        public String field;

        @Getter
        @Inject
        @Default(values = "")
        public String rule;
}
