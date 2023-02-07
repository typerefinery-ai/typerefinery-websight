package io.typerefinery.websight.models.components.widgets;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import io.typerefinery.websight.models.components.BaseComponent;

@Model(adaptables = Resource.class, resourceType = {
                "typerefinery/components/widgets/ticker" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = {
                @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true") })
public class SmallTicker extends BaseComponent {
        @SlingObject
        private ResourceResolver resourceResolver;
        private static final String DEFAULT_ID = "smallticker";
        private static final String DEFAULT_CLASS_NAMES = "smallticker";
        private static final String DEFAULT_MODULE = "smallTickerComponent";
        
        @Override
        @PostConstruct
        protected void init() {
                this.id = DEFAULT_ID;
                this.classNames = DEFAULT_CLASS_NAMES;
                this.module = DEFAULT_MODULE;
                super.init();

                if (StringUtils.isBlank(this.websocketTopic)) {
                this.websocketTopic = this.flowapi_topic;
                }
        }

        @Getter
        @Inject
        @Default(values = "Demo Ticker")
        public String title;

        @Getter
        @Inject
        @Default(values = "14.5k")
        public String value;

        @Getter
        @Inject
        // @Default(values = "#D35400")
        public String textColor;

        @Getter
        @Inject
        // @Default(values = "#F8C471")
        public String bgColor;

        @Getter
        @Inject
        // @Default (values =
        // "http://localhost:8080/apps/typerefinery/components/widgets/smallticker/mock/dataSource1.json")
        public String dataSource;

        @Getter
        @Inject
        @Default(values = "ws://localhost:8112/$tms")
        public String websocketHost;

        @Getter
        @Inject
        // @Default (values = "")
        public String websocketTopic;

        @Getter
        @Inject
        @Default(values = "")
        public String flowapi_topic;
}
