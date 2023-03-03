package io.typerefinery.websight.models.components.content;


import javax.annotation.PostConstruct;
import javax.inject.Inject;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;

import io.typerefinery.websight.models.components.BaseComponent;
import lombok.Getter;

@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class CardItem extends BaseComponent {
    @SlingObject
    private ResourceResolver resourceResolver;

    private static final String DEFAULT_CLASS_NAME = "card";


        
    @Getter
    @Inject
    private Boolean hideCardImage;
    
    @Override
    @PostConstruct
    protected void init() {
        super.init();

        if(style != null) {
            style.addClasses(DEFAULT_CLASS_NAME);
        }
    }
}
