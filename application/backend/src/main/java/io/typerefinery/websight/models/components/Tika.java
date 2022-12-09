package io.typerefinery.websight.models.components;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.inject.Inject;
import lombok.Getter;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Tika {
    @SlingObject
    private ResourceResolver resourceResolver;

    @Getter
    @Inject
    @Default(values = "")
    public String title;


    @Getter
    @Inject
    @Default(values = "")
    public String value;


    @Getter
    @Inject
    @Default(values = "")
    public String icon;


    @Getter
    @Inject
    public String badge;
}
