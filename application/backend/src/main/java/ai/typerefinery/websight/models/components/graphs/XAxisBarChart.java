package ai.typerefinery.websight.models.components.graphs;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.inject.Inject;
import lombok.Getter;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;

import ai.typerefinery.websight.models.components.BaseComponent;


@Model(adaptables = Resource.class, resourceType = { "typerefinery/components/graphs/linechart" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = { @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true") })
public class XAxisBarChart extends BaseComponent {
    @SlingObject
    private ResourceResolver resourceResolver;
    
    
    @Getter
    @Inject
    public String dataSource;
    
    @Getter
    @Inject
    @Default (values = "ws://localhost:8112/$tms")
    public String websocketHost;

    @Getter
    @Inject
    // @Default (values = "")
    public String websocketTopic;
}
