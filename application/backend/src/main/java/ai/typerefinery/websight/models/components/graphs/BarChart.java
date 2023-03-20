package ai.typerefinery.websight.models.components.graphs;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.inject.Inject;
import lombok.Getter;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import ai.typerefinery.websight.models.components.BaseComponent;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import ai.typerefinery.websight.models.components.BaseComponent;

@Model(adaptables = Resource.class, resourceType = {
                "typerefinery/components/graphs/barchart" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = {
                @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
                @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
})
public class BarChart extends BaseComponent {
        @JsonIgnore
        @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
        @SlingObject
        private ResourceResolver resourceResolver;

        @Getter
        @Inject
        public String dataSource;

        @Getter
        @Inject
        // @Default(values = "ws://localhost:8112/$tms")
        public String websocketHost;

        @Getter
        @Inject
        // @Default (values = "")
        public String websocketTopic;

}
