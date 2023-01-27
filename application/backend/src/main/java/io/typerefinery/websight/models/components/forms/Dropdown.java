package io.typerefinery.websight.models.components.forms;
import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import javax.inject.Inject;
import org.apache.sling.models.annotations.Default;
import lombok.Getter;
@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Dropdown {
    @Inject
    @Getter
    @Default(values = "dropdown")
    private String name;

    @Inject
    @Getter
    @Default(values = "Dropdown")
    private String label;

    @Inject
    @Getter
    @Default(values = "dropdown")
    private String cls;

    @Inject
    @Getter
    @Default(values = "Select the data")
    private String placeholder;
    
}