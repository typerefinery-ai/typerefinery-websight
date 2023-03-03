/*
 * Copyright (C) 2023 Typerefinery.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.typerefinery.websight.models.components.forms;
import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;
import javax.inject.Inject;
import lombok.Getter;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.osgi.service.component.annotations.Component;

import javax.annotation.PostConstruct;

import io.typerefinery.websight.models.components.BaseFormComponent;
import io.typerefinery.websight.services.flow.FlowService;
import io.typerefinery.websight.services.flow.registry.FlowComponent;

@Component
@Model(adaptables = {
    Resource.class,
    SlingHttpServletRequest.class
    },
    resourceType = { Form.RESOURCE_TYPE }, 
    defaultInjectionStrategy = OPTIONAL
)
@Exporter(name = "jackson", extensions = "json", options = {
    @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true")
})
public class Form extends BaseFormComponent implements FlowComponent {

    public static final String RESOURCE_TYPE = "typerefinery/components/forms/form";

    private String DEFAULT_FORM_CLASSES = "card p-4 mb-3";

    @Inject
    @Getter
    private String writeUrl;

    @Inject
    @Getter
    private String writePayloadType;


    @Inject
    @Getter
    private String writeMethod;

    @Inject
    @Getter
    private String readUrl;

    @Inject
    @Getter
    private String readPayloadType;


    @Inject
    @Getter
    private String readMethod;

    private static final String DEFAULT_ID = "form";
    private static final String DEFAULT_MODULE = "formComponent";

    @Override
    @PostConstruct
    protected void init() {
        this.module = DEFAULT_MODULE;
        super.init();
        if (grid != null) {
            grid.addClasses(DEFAULT_FORM_CLASSES);
        }
    }

    @Override
    public String getKey() {
        return FlowService.FLOW_SPI_KEY;
    }

    @Override
    public String getComponent() {        
        return RESOURCE_TYPE;
    }

    @Override
    public int getRanking() {
        return 200;
    }

}