package io.typerefinery.websight.models.components;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.annotation.PostConstruct;
import javax.inject.Inject;

import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;

import lombok.Getter;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.apache.sling.models.annotations.injectorspecific.RequestAttribute;

@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    defaultInjectionStrategy = OPTIONAL
)
@Exporter(
    name = "jackson",
    extensions = "json",
    options = {
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true")
    }
)
public class BaseFormComponent extends BaseComponent {

    @Self
    private SlingHttpServletRequest request;

    @Inject
    @Getter
    @Default(values = "")
    protected String name;

    @Inject
    @Getter
    @Default(values = "")
    protected String label;
    

    @Override
    @PostConstruct
    protected void init() {
        // check if selectors are present
        if (request != null && request.getRequestPathInfo() != null) {
            String selectors = request.getRequestPathInfo().getSelectorString();
            if (StringUtils.isNotBlank(selectors)) {
                String[] selectorArray = StringUtils.split(selectors, ".");
                if (selectorArray.length >= 2) {
                    // check if id is present and update component id
                    if (ArrayUtils.contains(selectorArray, "id")) {
                        String value = selectorArray[ArrayUtils.indexOf(selectorArray, "id")+1];
                        if (StringUtils.isNotBlank(value)) {
                            this.id = value;
                        }
                    }
                }
            }
        }
        super.init();

    }

    
}
