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
public class LeafletMap {
    @SlingObject
    private ResourceResolver resourceResolver;

    @Getter
    @Inject
    // @Default (values = "http://localhost:8080/apps/typerefinery/components/widgets/leafletMap/dataSource_1.json")
    public String dataSource;
}
