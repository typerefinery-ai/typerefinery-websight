package io.typerefinery.websight.models.components.forms;
import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import javax.inject.Inject;
import org.apache.sling.models.annotations.Default;
import lombok.Getter;
@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Select {
    @Inject
    @Getter
    @Default(values = "select")
    private String name;

    @Inject
    @Getter
    @Default(values = "select")
    private String label;

    @Inject
    @Getter
    @Default(values = "select")
    private String cls;

    @Inject
    @Getter
    @Default(values = "Select the data")
    private String placeholder;
    
}