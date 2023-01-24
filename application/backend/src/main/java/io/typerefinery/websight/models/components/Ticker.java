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
public class Ticker {
    @SlingObject
    private ResourceResolver resourceResolver;

    @Getter
    @Inject
    @Default(values = "Sample Card")
    public String title;


    @Getter
    @Inject
    @Default(values = "12.5k")
    public String value;


    @Getter
    @Inject
    @Default(values = "pi pi-database")
    public String icon;


    @Getter
    @Inject
    public String badge;

    @Getter
    @Inject
    @Default (values = "pi pi-arrow-up")
    public String indicatorType;


    @Getter
    @Inject
    @Default (values = "12.k")
    public String indicatorValue;

    @Getter
    @Inject
    // @Default (values = "http://localhost:8080/apps/typerefinery/components/content/ticker/dataSource_1.json")
    public String dataSource;

    @Getter
    @Inject
    @Default (values = "ws://localhost:8112/$tms")
    public String websocketHost;

    @Getter
    @Inject
    // @Default (values = "")
    public String websocketTopic;

    //  @Getter
    // @Inject
    // // @Default (values = "")
    // public String defaultWebsocketHost;

    
    @Getter
    @Inject
    @Default (values = "5")
    public String dataSourceRefreshTime;
}
