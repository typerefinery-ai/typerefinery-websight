package io.typerefinery.websight.models.components.content;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.inject.Inject;
import lombok.Getter;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Card {
    @SlingObject
    private ResourceResolver resourceResolver;

    @Getter
    @Inject
    @Default(values = "")
    public String title;


    @Getter
    @Inject
    @Default(values = "")
    public String description;


    @Getter
    @Inject
    @Default(values = "")
    public String subtitle;


    @Getter
    @Inject
    public String bgColor;


    @Getter
    @Inject
    public String titleColor;

    @Getter
    @Inject
    public String subtitleColor;

    @Getter
    @Inject
    public String descriptionColor;
}
