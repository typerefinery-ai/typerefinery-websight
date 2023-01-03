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
public class Smallticker {
    @SlingObject
    private ResourceResolver resourceResolver;

    @Getter
    @Inject
    @Default(values = "Demo Card")
    public String title;


    @Getter
    @Inject
    @Default(values = "12.5k")
    public String value;

     @Getter
    @Inject
    @Default(values = "pink")
    public String textColor;

     @Getter
    @Inject
    @Default(values = "blue")
    public String bgColor;

     @Getter
    @Inject
    // @Default (values = "http://localhost:8080/apps/typerefinery/components/content/columnticker/smallticker/dataSource_1.json")
    public String dataSource;

    
    @Getter
    @Inject
    @Default (values = "5")
    public String dataSourceRefreshTime;



}
