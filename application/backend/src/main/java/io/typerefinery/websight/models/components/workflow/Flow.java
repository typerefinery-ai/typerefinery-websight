package io.typerefinery.websight.models.components.workflow;


import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.annotation.PostConstruct;
import javax.inject.Inject;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.typerefinery.websight.models.components.BaseModel;
import io.typerefinery.websight.models.components.widgets.Ticker;
import lombok.Getter;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Flow extends BaseModel {
    
    private static final Logger LOG = LoggerFactory.getLogger(Flow.class);
    
    @Getter
    @Inject
    @Default(values = "false")
    public String flowstreamenable;    

    @Getter
    @Inject
    @Default(values = "")
    public String flowstreamid;

    @Override
    @PostConstruct
    protected void init() {
        super.init();
    }

}
