package io.typerefinery.websight.models.components;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.inject.Inject;
import lombok.Getter;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Password {

    @Inject
    @Getter
    @Default(values = "password")
    private String label;

    @Inject
    @Getter
    @Default(values = "Password")
    private String name;

    @Inject
    @Getter
    @Default(values = "password")
    private String cls;

    @Inject
    @Getter
    @Default(values = "false")
    private String value;

    @Inject
    @Getter
    @Default(values = "Enter Password")
    private String placeholder;

    @Inject
    @Getter
    @Default(values = "2")
    private String rows;
  
    @Inject
    @Getter
    @Default(values = "50")
    private String cols;

}